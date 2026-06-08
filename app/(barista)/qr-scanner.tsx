import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;

export default function QRScannerScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      </SafeAreaView>

      <View style={styles.viewfinder}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.scanHint}>Point the camera at the customer's QR code</Text>
      </View>

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
    viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Sp[6] },
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
