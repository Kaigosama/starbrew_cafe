import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { estimateWaitMinutes } from '../../lib/eta';

type OrderStatus = 'Order Received' | 'Crafting' | 'Ready for Pickup' | 'Picked Up' | 'Cancelled Remake In Progress';

type OrderItemRow = { quantity: number; menu_items: { name: string } | null };
type RawOrder = {
  id: string;
  queue_position: number;
  status: OrderStatus;
  pickup_method: 'in-store' | 'drive-thru';
  created_at: string;
  users: { full_name: string } | null;
  order_items: OrderItemRow[];
};

type Order = {
  id: string;
  queuePosition: number;
  status: OrderStatus;
  pickupMethod: 'in-store' | 'drive-thru';
  createdAt: string;
  customerName: string;
  itemsSummary: string;
  itemCount: number;
};

const STATUS_CONFIG: Record<OrderStatus, {
  label: string; color: string; bg: string; action?: string; next?: OrderStatus;
}> = {
  'Order Received':              { label: 'Received',    color: '#3A6B8A', bg: 'rgba(58,107,138,0.10)', action: 'Start Crafting', next: 'Crafting' },
  'Crafting':                    { label: 'In Progress', color: '#C48A2F', bg: 'rgba(196,138,47,0.12)', action: 'Mark Ready',     next: 'Ready for Pickup' },
  'Ready for Pickup':            { label: 'Ready',       color: '#4A7C59', bg: 'rgba(74,124,89,0.10)' },
  'Picked Up':                   { label: 'Picked Up',   color: '#B0A099', bg: 'rgba(176,160,153,0.1)' },
  'Cancelled Remake In Progress': { label: 'Cancelled',  color: '#B33A3A', bg: 'rgba(179,58,58,0.10)' },
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff === 1) return '1 min';
  return `${diff} min`;
}

function mapOrder(raw: RawOrder): Order {
  const itemCount = raw.order_items?.length ?? 0;
  const itemsSummary = (raw.order_items ?? [])
    .map(oi => oi.menu_items?.name ?? 'Item')
    .join(', ') || 'No items';
  const fullName = raw.users?.full_name?.trim();
  const customerName = fullName || 'Customer';

  return {
    id: raw.id,
    queuePosition: raw.queue_position,
    status: raw.status,
    pickupMethod: raw.pickup_method,
    createdAt: raw.created_at,
    customerName,
    itemsSummary,
    itemCount,
  };
}

export default function BaristaDashboard() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [storeOpen, setStoreOpen] = useState(true);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, queue_position, status, pickup_method, created_at, users(full_name), order_items(quantity, menu_items(name))')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('dashboard fetch error:', error.message);
      return;
    }
    setOrders((data as unknown as RawOrder[]).map(mapOrder));
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      await fetchOrders();
      if (isMounted) setLoading(false);
    })();

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          if (isMounted) fetchOrders();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeConnected(true);
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  useEffect(() => {
    supabase
      .from('store_status')
      .select('is_open')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('store_status fetch error:', error.message);
        if (data) setStoreOpen(data.is_open);
      });

    const channel = supabase
      .channel('store-status-dashboard')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'store_status' },
        (payload) => setStoreOpen((payload.new as { is_open: boolean }).is_open)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function advanceOrder(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const next = STATUS_CONFIG[order.status].next;
    if (!next) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: next } : o))
    );

    const nextEta = estimateWaitMinutes(next, order.itemCount || 1);
    await supabase.from('orders').update({ status: next, estimated_eta_min: nextEta }).eq('id', id);
  }

  const active = orders.filter((o) => o.status !== 'Picked Up' && o.status !== 'Cancelled Remake In Progress');
  const completed = orders.filter((o) => o.status === 'Picked Up' || o.status === 'Cancelled Remake In Progress');

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Orders</Text>
            <Text style={styles.headerSub}>Oldest orders at the top</Text>
          </View>
          <View style={styles.headerRight}>
            {realtimeConnected && (
              <View style={[styles.liveBadge, !storeOpen && styles.liveBadgeClosed]}>
                <View style={[styles.liveDot, !storeOpen && styles.liveDotClosed]} />
                <Text style={[styles.liveText, !storeOpen && styles.liveTextClosed]}>
                  {storeOpen ? 'Live' : 'Closed'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {active.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.textDisabled} />
              <Text style={styles.emptyText}>All caught up!</Text>
            </View>
          )}

          {active.map(order => {
            const cfg = STATUS_CONFIG[order.status];
            return (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, cardShadow]}
                onPress={() => router.push({ pathname: '/(barista)/order-detail', params: { id: order.id } } as any)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={styles.customerCol}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={18} color={colors.brandMuted} />
                    </View>
                    <Text style={styles.queueNum}>#{order.queuePosition}</Text>
                    <Text style={styles.customerName} numberOfLines={2}>{order.customerName}</Text>
                  </View>

                  <View style={styles.detailsCol}>
                    <Text style={styles.itemsText} numberOfLines={2}>{order.itemsSummary}</Text>
                    <View style={styles.fulfillRow}>
                      <Ionicons
                        name={order.pickupMethod === 'in-store' ? 'storefront-outline' : 'car-outline'}
                        size={13}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.fulfillText}>
                        {order.pickupMethod === 'in-store' ? 'In-Store' : 'Drive-Thru'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionCol}>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    {order.status === 'Ready for Pickup' ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnReady, styles.actionBtnRow]}
                        onPress={() => router.push({ pathname: '/(barista)/qr-scanner', params: { orderId: order.id } } as any)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="qr-code-outline" size={13} color={colors.textInverse} />
                        <Text style={styles.actionBtnText}>Scan to Confirm</Text>
                      </TouchableOpacity>
                    ) : cfg.action && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => advanceOrder(order.id)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.actionBtnText}>{cfg.action}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Ionicons name="time-outline" size={12} color={colors.textDisabled} />
                  <Text style={styles.timeAgo}>{timeAgo(order.createdAt)} ago</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.completedHeader}
            onPress={() => setShowCompleted(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.completedTitle}>Recently Completed ({completed.length})</Text>
            <Ionicons
              name={showCompleted ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showCompleted && completed.map(order => {
            const isCancelled = order.status === 'Cancelled Remake In Progress';
            return (
              <TouchableOpacity
                key={order.id}
                style={[styles.completedCard, cardShadow]}
                onPress={() => router.push({ pathname: '/(barista)/order-detail', params: { id: order.id } } as any)}
                activeOpacity={0.85}
              >
                <View style={styles.completedAvatar}>
                  <Ionicons name="person" size={14} color={colors.brandMuted} />
                </View>
                <View style={styles.completedInfo}>
                  <Text style={styles.completedName}>{order.customerName}</Text>
                  <Text style={styles.completedItems} numberOfLines={1}>{order.itemsSummary}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: isCancelled ? STATUS_CONFIG[order.status].bg : colors.bgSubtle },
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: isCancelled ? STATUS_CONFIG[order.status].color : colors.textDisabled },
                  ]}>
                    {isCancelled ? 'Cancelled Order' : 'Done'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    headerArea: { backgroundColor: colors.bgBase },
    headerRow: {
      flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
      paddingHorizontal: Sp[5], paddingVertical: Sp[3],
    },
    headerTitle: { fontSize: FS.headingLg, fontWeight: '800', color: colors.textPrimary },
    headerSub: { fontSize: FS.caption, color: colors.textSecondary, marginTop: 2 },
    headerRight: { paddingTop: 4 },
    liveBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.statusSuccessBg, borderRadius: R.full,
      paddingHorizontal: Sp[3], paddingVertical: Sp[1] + 1,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.statusSuccess },
    liveText: { fontSize: FS.overline, color: colors.statusSuccess, fontWeight: '700' },
    liveBadgeClosed: { backgroundColor: colors.bgSubtle },
    liveDotClosed: { backgroundColor: colors.textDisabled },
    liveTextClosed: { color: colors.textDisabled },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: 90 },
    empty: { alignItems: 'center', paddingTop: Sp[12], gap: Sp[3] },
    emptyText: { fontSize: FS.body, color: colors.textSecondary },
    orderCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4], marginBottom: Sp[3],
    },
    cardTop: { flexDirection: 'row', gap: Sp[3] },
    customerCol: { alignItems: 'center', width: 68 },
    avatar: {
      width: 40, height: 40, borderRadius: R.full, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center', marginBottom: 3,
    },
    queueNum: { fontSize: FS.overline, fontWeight: '700', color: colors.brandPrimary, letterSpacing: 0.2 },
    customerName: {
      fontSize: FS.overline, color: colors.textSecondary, textAlign: 'center',
      lineHeight: 13, marginTop: 1, flexShrink: 1,
    },
    detailsCol: { flex: 1 },
    itemsText: { fontSize: FS.body, fontWeight: '600', color: colors.textPrimary, marginBottom: Sp[2], lineHeight: 19 },
    fulfillRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    fulfillText: { fontSize: FS.caption, color: colors.textSecondary },
    actionCol: { alignItems: 'flex-end', gap: Sp[2] },
    statusBadge: { borderRadius: R.sm, paddingHorizontal: Sp[2], paddingVertical: 3 },
    statusText: { fontSize: FS.overline, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
    actionBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md,
      paddingHorizontal: Sp[3], paddingVertical: 7,
    },
    actionBtnReady: { backgroundColor: colors.statusSuccess },
    actionBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionBtnText: { fontSize: FS.overline, fontWeight: '700', color: colors.textInverse, letterSpacing: 0.2 },
    cardFooter: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      marginTop: Sp[3], paddingTop: Sp[2], borderTopWidth: 1, borderTopColor: colors.bgSubtle,
    },
    timeAgo: { fontSize: FS.overline, color: colors.textDisabled },
    completedHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: Sp[3], marginBottom: Sp[2],
    },
    completedTitle: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textSecondary },
    completedCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[3] + 1,
      flexDirection: 'row', alignItems: 'center', gap: Sp[3], marginBottom: Sp[2], opacity: 0.75,
    },
    completedAvatar: {
      width: 32, height: 32, borderRadius: R.full, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center',
    },
    completedInfo: { flex: 1 },
    completedName: { fontSize: FS.label, fontWeight: '600', color: colors.textPrimary },
    completedItems: { fontSize: FS.caption, color: colors.textSecondary },
  });
}
