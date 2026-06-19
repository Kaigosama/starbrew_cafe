import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { estimateWaitMinutes } from '../../lib/eta';

type OrderItem = { name: string; qty: number; price: number };
type Order = {
  id: string;
  queue_num: number;
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  received: { text: 'Received',    color: '#3A6B8A', bg: 'rgba(58,107,138,0.10)' },
  crafting:  { text: 'In Progress', color: '#C48A2F', bg: 'rgba(196,138,47,0.12)' },
  ready:     { text: 'Ready',       color: '#4A7C59', bg: 'rgba(74,124,89,0.10)' },
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) +
    '  ·  ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

function firstItemName(items: OrderItem[]) {
  return items?.[0]?.name ?? 'Order';
}

export default function ActivityScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchOrders() {
      setLoading(true);

      // Most recent non-completed order
      const { data: active } = await supabase
        .from('orders')
        .select('id, queue_num, status, total, created_at, order_items(name, qty, price)')
        .eq('user_id', user!.id)
        .neq('status', 'completed')
        .neq('status', 'picked_up')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Recent completed orders
      const { data: recent } = await supabase
        .from('orders')
        .select('id, queue_num, status, total, created_at, order_items(name, qty, price)')
        .eq('user_id', user!.id)
        .in('status', ['completed', 'picked_up'])
        .order('created_at', { ascending: false })
        .limit(5);

      setActiveOrder(active as Order | null);
      setRecentOrders((recent ?? []) as Order[]);
      setLoading(false);
    }
    fetchOrders();
  }, [user]);

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Activity</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.brandPrimary} size="large" />
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>My Order</Text>
            {activeOrder ? (
              <View style={[styles.orderCard, cardShadow]}>
                <View style={styles.orderCardTop}>
                  <View style={styles.orderImgPlaceholder}>
                    <Ionicons name="cafe-outline" size={28} color={colors.brandMuted} />
                  </View>
                  <View style={styles.orderCardInfo}>
                    <Text style={styles.orderCardDrink} numberOfLines={1}>
                      {firstItemName(activeOrder.order_items)}
                    </Text>
                    <Text style={styles.orderCardLocation}>StarBrew Cafe Makati</Text>
                    {STATUS_LABEL[activeOrder.status] && (
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_LABEL[activeOrder.status].bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_LABEL[activeOrder.status].color }]} />
                        <Text style={[styles.statusText, { color: STATUS_LABEL[activeOrder.status].color }]}>
                          {STATUS_LABEL[activeOrder.status].text}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.etaInline}>
                      Est. {estimateWaitMinutes(activeOrder.status, activeOrder.order_items?.length || 1)} min
                    </Text>
                  </View>
                  <Text style={styles.orderCardPrice}>₱{activeOrder.total}.00</Text>
                </View>

                <View style={styles.orderCardDivider} />

                <View style={styles.orderCardFooter}>
                  <TouchableOpacity
                    style={styles.footerTile}
                    onPress={() => router.push('/(customer)/order-status' as any)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="list-outline" size={18} color={colors.brandPrimary} />
                    <Text style={styles.footerTileLabel}>Queue Number</Text>
                    <Text style={styles.footerTileValue}>#{activeOrder.queue_num}</Text>
                  </TouchableOpacity>
                  <View style={styles.footerTileSep} />
                  <TouchableOpacity
                    style={styles.footerTile}
                    onPress={() => router.push('/(customer)/order-status' as any)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate-outline" size={18} color={colors.brandPrimary} />
                    <Text style={styles.footerTileLabel}>Order Tracking</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.emptyOrderCard, cardShadow]}>
                <Ionicons name="cafe-outline" size={32} color={colors.textDisabled} />
                <Text style={styles.emptyOrderText}>No active orders</Text>
                <TouchableOpacity
                  style={styles.orderNowBtn}
                  onPress={() => router.push('/(customer)/menu' as any)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.orderNowText}>Order now</Text>
                </TouchableOpacity>
              </View>
            )}

            {recentOrders.length > 0 && (
              <>
                <View style={styles.recentHeader}>
                  <Text style={styles.sectionLabel}>Recent</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(customer)/order-history' as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewAllText}>View all</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.recentCard, cardShadow]}>
                  {recentOrders.map((order, idx) => (
                    <View key={order.id}>
                      <View style={styles.recentRow}>
                        <View style={styles.recentImg} />
                        <View style={styles.recentInfo}>
                          <Text style={styles.recentName} numberOfLines={1}>
                            {firstItemName(order.order_items)} – StarBrew Cafe Makati
                          </Text>
                          <Text style={styles.recentDate}>{formatDateTime(order.created_at)}</Text>
                          <TouchableOpacity style={styles.reorderBtn} activeOpacity={0.7}>
                            <Text style={styles.reorderText}>Reorder</Text>
                            <Ionicons name="arrow-forward" size={12} color={colors.brandPrimary} />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.recentPrice}>₱{order.total}.00</Text>
                      </View>
                      {idx < recentOrders.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    headerArea: { backgroundColor: colors.bgBase },
    headerRow: { paddingHorizontal: Sp[5], paddingVertical: Sp[3] },
    headerTitle: { fontSize: FS.headingLg, fontWeight: '800', color: colors.textPrimary },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    centered: { alignItems: 'center', paddingTop: Sp[12] },
    sectionLabel: {
      fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary, marginBottom: Sp[3],
    },
    orderCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, overflow: 'hidden', marginBottom: Sp[5],
    },
    orderCardTop: {
      flexDirection: 'row', alignItems: 'center', gap: Sp[3], padding: Sp[4],
    },
    orderImgPlaceholder: {
      width: 56, height: 56, borderRadius: R.md, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    orderCardInfo: { flex: 1 },
    orderCardDrink: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
    orderCardLocation: { fontSize: FS.caption, color: colors.textSecondary, marginBottom: Sp[2] },
    etaInline: { fontSize: FS.caption, color: colors.textSecondary, marginTop: 4 },
    statusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
      borderRadius: R.sm, paddingHorizontal: Sp[2], paddingVertical: 3,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: {
      fontSize: FS.overline, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3,
    },
    orderCardPrice: { fontSize: FS.headingSm, fontWeight: '700', color: colors.brandSecondary, flexShrink: 0 },
    orderCardDivider: { height: 1, backgroundColor: colors.bgSubtle },
    orderCardFooter: { flexDirection: 'row' },
    footerTile: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Sp[2], paddingVertical: Sp[3],
    },
    footerTileLabel: { flex: 1, fontSize: FS.label, fontWeight: '600', color: colors.textPrimary },
    footerTileValue: { fontSize: FS.label, fontWeight: '700', color: colors.brandPrimary },
    footerTileSep: { width: 1, backgroundColor: colors.bgSubtle },
    emptyOrderCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[6],
      alignItems: 'center', gap: Sp[3], marginBottom: Sp[5],
    },
    emptyOrderText: { fontSize: FS.body, color: colors.textSecondary },
    orderNowBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md,
      paddingHorizontal: Sp[5], paddingVertical: 10,
    },
    orderNowText: { fontSize: FS.label, fontWeight: '700', color: colors.textInverse },
    recentHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sp[3],
    },
    viewAllText: { fontSize: FS.label, color: colors.brandSecondary, fontWeight: '600' },
    recentCard: { backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4] },
    recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Sp[4], gap: Sp[3] },
    recentImg: {
      width: 48, height: 48, borderRadius: R.md, backgroundColor: colors.bgSubtle, flexShrink: 0,
    },
    recentInfo: { flex: 1 },
    recentName: { fontSize: FS.label, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    recentDate: { fontSize: FS.caption, color: colors.textSecondary, marginBottom: Sp[2] },
    reorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    reorderText: { fontSize: FS.label, color: colors.brandPrimary, fontWeight: '600' },
    recentPrice: { fontSize: FS.label, fontWeight: '700', color: colors.textPrimary, flexShrink: 0 },
    divider: { height: 1, backgroundColor: colors.bgSubtle },
  });
}
