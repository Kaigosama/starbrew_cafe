import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { estimateWaitMinutes } from '../../lib/eta';

type Step = { id: string; label: string; sublabel: string; icon: keyof typeof Ionicons.glyphMap };

const STEPS: Step[] = [
  { id: 'received', label: 'Order Received',   sublabel: 'We got your order',       icon: 'checkmark-circle' },
  { id: 'crafting', label: 'Crafting',          sublabel: 'Your barista is on it',   icon: 'cafe' },
  { id: 'ready',    label: 'Ready for Pick-up', sublabel: 'Come grab your drink!',   icon: 'storefront' },
];

const STEP_INDEX: Record<string, number> = {
  received: 0, crafting: 1, ready: 2, completed: 3, picked_up: 3,
};

type OrderItem = { name: string; qty: number };
type Order = {
  id: string;
  queue_num: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

export default function OrderStatusScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchOrder() {
      setLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('id, queue_num, status, created_at, order_items(name, qty)')
        .eq('user_id', user!.id)
        .neq('status', 'completed')
        .neq('status', 'picked_up')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setOrder(data as Order | null);
      setLoading(false);
    }
    fetchOrder();
  }, [user]);

  const currentStepIdx = order ? (STEP_INDEX[order.status] ?? 0) : 0;
  const itemCount = order?.order_items?.length || 1;
  const eta = order ? estimateWaitMinutes(order.status, itemCount) : 0;
  const firstItemName = order?.order_items?.[0]?.name ?? 'Order';

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
                <Text style={styles.orderMeta}>Queue #{order.queue_num}</Text>
              </View>
            </View>
            <View style={styles.queueBadge}>
              <Text style={styles.queueNum}>#{order.queue_num}</Text>
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
        </View>
      )}
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
  });
}
