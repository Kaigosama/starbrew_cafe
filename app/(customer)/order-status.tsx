import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

type Step = { id: string; label: string; sublabel: string; icon: keyof typeof Ionicons.glyphMap };

const STEPS: Step[] = [
  { id: 'Order Received',   label: 'Order Received',   sublabel: 'We got your order',       icon: 'checkmark-circle' },
  { id: 'Crafting',         label: 'Crafting',          sublabel: 'Your barista is on it',   icon: 'cafe' },
  { id: 'Ready for Pickup', label: 'Ready for Pick-up', sublabel: 'Come grab your drink!',   icon: 'storefront' },
];

const STEP_INDEX: Record<string, number> = {
  'Order Received': 0, 'Crafting': 1, 'Ready for Pickup': 2, 'Picked Up': 3,
};

type OrderItemRow = { quantity: number; menu_items: { name: string } | null };
type Order = {
  id: string;
  queue_position: number;
  status: string;
  estimated_eta_min: number;
  created_at: string;
  order_items: OrderItemRow[];
};

export default function OrderStatusScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const orderIdRef = useRef<string | null>(null);
  useEffect(() => {
    orderIdRef.current = order?.id ?? null;
  }, [order]);

  const fetchOrder = useCallback(async () => {
    if (!user) return;
    const query = supabase
      .from('orders')
      .select('id, queue_position, status, estimated_eta_min, created_at, order_items(quantity, menu_items(name))')
      .eq('customer_id', user.id);

    const { data, error } = id
      ? await query.eq('id', id).maybeSingle()
      : await query
          .neq('status', 'Picked Up')
          .neq('status', 'Cancelled Remake In Progress')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

    if (error) console.error('order-status fetch error:', error.message);
    setOrder(data as unknown as Order | null);
  }, [user, id]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    (async () => {
      setLoading(true);
      await fetchOrder();
      if (isMounted) setLoading(false);
    })();

    const channel = supabase
      .channel(`order-status-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as { id?: string; status?: string };
          if (updated.id === orderIdRef.current && updated.status === 'Picked Up') {
            setQrVisible(false);
            Alert.alert(
              'Order picked up!',
              'Enjoy your order — see you next time!',
              [{ text: 'OK', onPress: () => router.replace('/(customer)') }]
            );
          }
          if (isMounted) fetchOrder();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrder]);

  async function handleCancel() {
    if (!order) return;
    Alert.alert(
      'Cancel this order?',
      "It hasn't started being made yet, so it can still be cancelled.",
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const { error } = await supabase
              .from('orders')
              .update({ status: 'Cancelled Remake In Progress' })
              .eq('id', order.id);
            setCancelling(false);
            if (error) {
              Alert.alert('Could not cancel order', error.message);
              return;
            }
            router.replace({ pathname: '/(customer)/order-detail' as any, params: { id: order.id } });
          },
        },
      ]
    );
  }

  const currentStepIdx = order ? (STEP_INDEX[order.status] ?? 0) : 0;
  const eta = order?.estimated_eta_min ?? 0;
  const firstItemName = order?.order_items?.[0]?.menu_items?.name ?? 'Order';

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : !order ? (
        <View style={styles.centered}>
          <Ionicons name="cafe-outline" size={40} color={colors.textDisabled} />
          <Text style={styles.emptyText}>No active orders to track</Text>
          <TouchableOpacity
            style={styles.orderNowBtn}
            onPress={() => router.push('/(customer)/menu' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.orderNowText}>Order now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={[styles.orderCard, cardShadow]}>
            <View style={styles.orderCardLeft}>
              <View style={styles.orderImg}>
                <Ionicons name="cafe-outline" size={24} color={colors.brandMuted} />
              </View>
              <View>
                <Text style={styles.orderName}>{firstItemName}</Text>
                <Text style={styles.orderMeta}>Queue #{order.queue_position}</Text>
              </View>
            </View>
            <View style={styles.queueBadge}>
              <Text style={styles.queueNum}>#{order.queue_position}</Text>
            </View>
          </View>

          <View style={styles.tracker}>
            {STEPS.map((step, idx) => {
              const done = idx < currentStepIdx;
              const active = idx === currentStepIdx;
              return (
                <View key={step.id} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[
                      styles.stepCircle,
                      done && styles.stepCircleDone,
                      active && styles.stepCircleActive,
                    ]}>
                      <Ionicons
                        name={done ? 'checkmark' : step.icon}
                        size={18}
                        color={done || active ? colors.textInverse : colors.textDisabled}
                      />
                    </View>
                    {idx < STEPS.length - 1 && (
                      <View style={[styles.stepLine, done && styles.stepLineDone]} />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                      {step.label}
                    </Text>
                    {active && <Text style={styles.stepSublabel}>{step.sublabel}</Text>}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.etaCard, cardShadow]}>
            <Ionicons name="time-outline" size={20} color={colors.brandPrimary} />
            <Text style={styles.etaText}>Estimated wait: </Text>
            <Text style={styles.etaValue}>~{eta} minutes</Text>
          </View>

          {order.status === 'Ready for Pickup' && (
            <TouchableOpacity
              style={styles.qrBtn}
              onPress={() => setQrVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="qr-code-outline" size={20} color={colors.textInverse} />
              <Text style={styles.qrBtnText}>Show QR Code to Barista</Text>
            </TouchableOpacity>
          )}

          {order.status === 'Order Received' && (
            <TouchableOpacity
              style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
              onPress={handleCancel}
              activeOpacity={0.8}
              disabled={cancelling}
            >
              <Text style={styles.cancelBtnText}>
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={qrVisible} transparent animationType="fade" onRequestClose={() => setQrVisible(false)}>
        <View style={styles.qrModalOverlay}>
          <View style={[styles.qrModalCard, cardShadow]}>
            <Text style={styles.qrModalTitle}>Show this to your barista</Text>
            <View style={styles.qrModalCodeBox}>
              {order && (
                <QRCode value={order.id} size={200} color="#000000" backgroundColor="#FFFFFF" />
              )}
            </View>
            <Text style={styles.qrModalHint}>Queue #{order?.queue_position}</Text>
            <TouchableOpacity
              style={styles.qrModalCloseBtn}
              onPress={() => setQrVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.qrModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Sp[5], paddingVertical: Sp[3],
    },
    backBtn: { padding: Sp[1] },
    headerTitle: { fontSize: FS.headingMd, fontWeight: '700', color: colors.textPrimary },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Sp[3], paddingHorizontal: Sp[5] },
    emptyText: { fontSize: FS.body, color: colors.textSecondary },
    orderNowBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md,
      paddingHorizontal: Sp[5], paddingVertical: 10,
    },
    orderNowText: { fontSize: FS.label, fontWeight: '700', color: colors.textInverse },
    body: { flex: 1, paddingHorizontal: Sp[5] },
    orderCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4],
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Sp[6],
    },
    orderCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Sp[3] },
    orderImg: {
      width: 48, height: 48, borderRadius: R.md, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center',
    },
    orderName: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
    orderMeta: { fontSize: FS.caption, color: colors.textSecondary },
    queueBadge: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md, paddingHorizontal: Sp[3], paddingVertical: Sp[2],
    },
    queueNum: { fontSize: FS.headingMd, fontWeight: '800', color: colors.textInverse },
    tracker: { flex: 1 },
    stepRow: { flexDirection: 'row', gap: Sp[4], minHeight: 60 },
    stepLeft: { alignItems: 'center' },
    stepCircle: {
      width: 40, height: 40, borderRadius: R.full, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border,
    },
    stepCircleDone: { backgroundColor: colors.statusSuccess, borderColor: colors.statusSuccess },
    stepCircleActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
    stepLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
    stepLineDone: { backgroundColor: colors.statusSuccess },
    stepContent: { flex: 1, paddingTop: Sp[2], paddingBottom: Sp[4] },
    stepLabel: { fontSize: FS.body, fontWeight: '500', color: colors.textSecondary },
    stepLabelActive: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary },
    stepSublabel: { fontSize: FS.caption, color: colors.textSecondary, marginTop: 3 },
    etaCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4],
      flexDirection: 'row', alignItems: 'center', gap: Sp[2], marginBottom: Sp[8],
    },
    etaText: { fontSize: FS.body, color: colors.textSecondary },
    etaValue: { fontSize: FS.body, fontWeight: '700', color: colors.brandPrimary },
    cancelBtn: {
      borderWidth: 1.5, borderColor: colors.statusError, borderRadius: R.md,
      paddingVertical: 14, alignItems: 'center', marginBottom: Sp[8],
    },
    cancelBtnDisabled: { opacity: 0.6 },
    cancelBtnText: { fontSize: FS.bodyLg, fontWeight: '700', color: colors.statusError },
    qrBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Sp[2], marginBottom: Sp[3],
    },
    qrBtnText: { fontSize: FS.bodyLg, fontWeight: '700', color: colors.textInverse },
    qrModalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: Sp[6],
    },
    qrModalCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[6],
      alignItems: 'center', gap: Sp[4], width: '100%', maxWidth: 320,
    },
    qrModalTitle: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
    qrModalCodeBox: { padding: Sp[3], backgroundColor: '#FFFFFF', borderRadius: R.md },
    qrModalHint: { fontSize: FS.body, color: colors.textSecondary },
    qrModalCloseBtn: {
      alignSelf: 'stretch', borderWidth: 1.5, borderColor: colors.border, borderRadius: R.md,
      paddingVertical: 12, alignItems: 'center', marginTop: Sp[2],
    },
    qrModalCloseText: { fontSize: FS.body, fontWeight: '600', color: colors.textPrimary },
  });
}
