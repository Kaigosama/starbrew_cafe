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

type Filter = 'All' | 'In-Store' | 'Drive-Thru';
const FILTERS: Filter[] = ['All', 'In-Store', 'Drive-Thru'];

type OrderItemRow = { quantity: number; menu_items: { name: string } | null };
type Order = {
  id: string;
  queue_position: number;
  status: string;
  pickup_method: string;
  total_price: number;
  created_at: string;
  order_items: OrderItemRow[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function orderDisplayName(items: OrderItemRow[]) {
  if (!items || items.length === 0) return 'Order';
  const firstName = items[0].menu_items?.name ?? 'Item';
  if (items.length === 1) return firstName;
  return `${firstName} + ${items.length - 1} more`;
}

function statusInfo(status: string) {
  if (status === 'Cancelled Remake In Progress') return { text: 'Cancelled', isError: true };
  if (status === 'Picked Up') return { text: 'Completed', isError: false };
  return { text: 'Active', isError: false };
}

function isFinished(status: string) {
  return status === 'Picked Up' || status === 'Cancelled Remake In Progress';
}

export default function OrderHistoryScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('All');

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, queue_position, status, pickup_method, total_price, created_at, order_items(quantity, menu_items(name))')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) console.error('order-history fetch error:', error.message);
      if (data) setOrders(data as unknown as Order[]);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const filtered = useMemo(() => {
    if (filter === 'All') return orders;
    const val = filter === 'In-Store' ? 'in-store' : 'drive-thru';
    return orders.filter(o => o.pickup_method === val);
  }, [orders, filter]);

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.brandPrimary} size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={colors.textDisabled} />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        ) : (
          filtered.map(order => {
            const { text: statusText, isError } = statusInfo(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, cardShadow]}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: isFinished(order.status)
                    ? '/(customer)/order-detail' as any
                    : '/(customer)/order-status' as any,
                  params: { id: order.id },
                })}
              >
                <View style={styles.orderTop}>
                  <View style={styles.orderImg}>
                    <Ionicons name="cafe-outline" size={20} color={colors.brandMuted} />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderName} numberOfLines={1}>
                      {orderDisplayName(order.order_items)}
                    </Text>
                    <Text style={styles.orderDate}>
                      {formatDate(order.created_at)} · {order.pickup_method === 'in-store' ? 'In-Store' : 'Drive-Thru'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, isError && styles.statusBadgeCancelled]}>
                    <Text style={[styles.statusText, isError && styles.statusTextCancelled]}>
                      {statusText}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderBottom}>
                  <Text style={styles.orderTotal}>₱{order.total_price}.00</Text>
                  <TouchableOpacity style={styles.reorderBtn} activeOpacity={0.8}>
                    <Ionicons name="refresh-outline" size={14} color={colors.brandPrimary} />
                    <Text style={styles.reorderText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
    filtersRow: { gap: Sp[2], paddingHorizontal: Sp[5], paddingBottom: Sp[3] },
    filterChip: {
      paddingHorizontal: Sp[4], paddingVertical: 8, borderRadius: R.full,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgSurface,
    },
    filterChipActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimary },
    filterText: { fontSize: FS.label, fontWeight: '500', color: colors.textSecondary },
    filterTextActive: { color: colors.textInverse, fontWeight: '600' },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    centered: { alignItems: 'center', paddingTop: Sp[12] },
    empty: { alignItems: 'center', paddingTop: Sp[12], gap: Sp[3] },
    emptyText: { fontSize: FS.body, color: colors.textSecondary },
    orderCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4], marginBottom: Sp[3],
    },
    orderTop: { flexDirection: 'row', alignItems: 'center', gap: Sp[3], marginBottom: Sp[3] },
    orderImg: {
      width: 44, height: 44, borderRadius: R.md, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    orderInfo: { flex: 1 },
    orderName: { fontSize: FS.body, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    orderDate: { fontSize: FS.caption, color: colors.textSecondary },
    statusBadge: {
      backgroundColor: colors.statusSuccessBg, borderRadius: R.sm,
      paddingHorizontal: Sp[2], paddingVertical: 3,
    },
    statusBadgeCancelled: { backgroundColor: colors.statusErrorBg },
    statusText: {
      fontSize: FS.overline, fontWeight: '700', color: colors.statusSuccess,
      textTransform: 'uppercase', letterSpacing: 0.3,
    },
    statusTextCancelled: { color: colors.statusError },
    orderBottom: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderTopWidth: 1, borderTopColor: colors.bgSubtle, paddingTop: Sp[3],
    },
    orderTotal: { fontSize: FS.headingSm, fontWeight: '800', color: colors.textPrimary },
    reorderBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.bgSubtle, borderRadius: R.md,
      paddingHorizontal: Sp[3], paddingVertical: 7,
    },
    reorderText: { fontSize: FS.label, color: colors.brandPrimary, fontWeight: '600' },
  });
}
