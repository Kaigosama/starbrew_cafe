import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { R, FS, Sp } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;

type ScannedOrder = {
  id: string;
  status: string;
  users: { full_name: string } | null;
  order_items: { quantity: number; menu_items: { name: string } | null }[];
};

export default function QRScannerScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const scannedRef = useRef(false);

  const resetScan = useCallback(() => {
    scannedRef.current = false;
    setProcessing(false);
  }, []);

  // Re-arm the scanner every time the screen is focused. Expo Router can retain
  // this screen's instance between visits, which would otherwise leave
  // scannedRef stuck `true` after the first scan and block every later scan.
  useFocusEffect(
    useCallback(() => {
      scannedRef.current = false;
      setProcessing(false);
    }, [])
  );

  const finishPickup = useCallback(async (order: ScannedOrder) => {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'Picked Up' })
      .eq('id', order.id);

    if (updateError) {
      Alert.alert('Could not update order', updateError.message, [
        { text: 'Scan Again', onPress: resetScan },
      ]);
      return;
    }

    router.back();
  }, [resetScan]);

  const handleScan = useCallback(async ({ data }: BarcodeScanningResult) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setProcessing(true);

    const scannedId = (data ?? '').trim();

    const { data: rawOrder, error } = await supabase
      .from('orders')
      .select('id, status, users(full_name), order_items(quantity, menu_items(name))')
      .eq('id', scannedId)
      .maybeSingle();
    const order = rawOrder as unknown as ScannedOrder | null;

    if (error || !order) {
      Alert.alert('Invalid QR Code', "This doesn't match any order.", [
        { text: 'Scan Again', onPress: resetScan },
      ]);
      return;
    }

    if (orderId && order.id !== orderId) {
      Alert.alert('Wrong Order', "This QR code doesn't match the order you're confirming.", [
        { text: 'Scan Again', onPress: resetScan },
      ]);
      return;
    }

    if (order.status !== 'Ready for Pickup') {
      Alert.alert('Order Not Ready', `This order is currently "${order.status}".`, [
        { text: 'Scan Again', onPress: resetScan },
      ]);
      return;
    }

    const customerName = order.users?.full_name?.trim() || 'Customer';
    const itemsSummary = (order.order_items ?? [])
      .map((oi) => oi.menu_items?.name ?? 'Item')
      .join(', ') || 'No items';

    setProcessing(false);
    Alert.alert(
      'Confirm Pickup',
      `${customerName} — ${itemsSummary}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: resetScan },
        { text: 'Confirm', onPress: () => finishPickup(order) },
      ]
    );
  }, [orderId, resetScan, finishPickup]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={{ width: 32 }} />
        </View>
        {orderId && (
          <Text style={styles.headerSubtitle}>Confirming pickup for this order</Text>
        )}
      </SafeAreaView>

      {!permission ? (
        <View style={styles.permissionBox} />
      ) : !permission.granted ? (
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={40} color="rgba(250,247,244,0.7)" />
          <Text style={styles.permissionText}>
            Camera access is needed to scan customer pickup codes.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.viewfinder}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={processing ? undefined : handleScan}
          />
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.scanHint}>
            {processing ? 'Checking order…' : "Point the camera at the customer's QR code"}
          </Text>
        </View>
      )}

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerContent}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.footerText}>Scanning marks the order as picked up</Text>
        </View>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0D0806' },
    headerArea: { backgroundColor: 'transparent' },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Sp[5], paddingVertical: Sp[3],
    },
    backBtn: { padding: Sp[1] },
    headerTitle: { fontSize: FS.headingMd, fontWeight: '700', color: colors.textInverse },
    headerSubtitle: {
      fontSize: FS.caption, color: 'rgba(250,247,244,0.7)',
      textAlign: 'center', paddingBottom: Sp[2],
    },
    viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Sp[6] },
    camera: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    scanFrame: { width: 240, height: 240, position: 'relative' },
    corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
    cornerTL: {
      top: 0, left: 0,
      borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
      borderColor: colors.textInverse, borderRadius: R.sm,
    },
    cornerTR: {
      top: 0, right: 0,
      borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
      borderColor: colors.textInverse, borderRadius: R.sm,
    },
    cornerBL: {
      bottom: 0, left: 0,
      borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
      borderColor: colors.textInverse, borderRadius: R.sm,
    },
    cornerBR: {
      bottom: 0, right: 0,
      borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
      borderColor: colors.textInverse, borderRadius: R.sm,
    },
    scanHint: {
      fontSize: FS.body, color: 'rgba(250,247,244,0.7)',
      textAlign: 'center', paddingHorizontal: Sp[8], lineHeight: 21,
    },
    permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Sp[4], paddingHorizontal: Sp[8] },
    permissionText: { fontSize: FS.body, color: 'rgba(250,247,244,0.8)', textAlign: 'center', lineHeight: 21 },
    permissionBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md,
      paddingHorizontal: Sp[5], paddingVertical: 12,
    },
    permissionBtnText: { fontSize: FS.body, fontWeight: '700', color: colors.textInverse },
    footer: {
      backgroundColor: colors.bgBase, paddingHorizontal: Sp[5],
      paddingTop: Sp[4], paddingBottom: Sp[4], gap: Sp[3],
    },
    footerContent: { flexDirection: 'row', alignItems: 'center', gap: Sp[2] },
    footerText: { fontSize: FS.caption, color: colors.textSecondary, flex: 1 },
    cancelBtn: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: R.md, paddingVertical: 14, alignItems: 'center',
    },
    cancelBtnText: { fontSize: FS.bodyLg, fontWeight: '600', color: colors.textPrimary },
  });
}
