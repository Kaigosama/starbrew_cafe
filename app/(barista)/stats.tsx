import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

type OrderItemRow = { quantity: number; unit_price: number; menu_items: { name: string } | null };
type Order = {
  id: string;
  total_price: number;
  status: string;
  payment_method: string | null;
  estimated_eta_min: number;
  created_at: string;
  order_items: OrderItemRow[];
};

function paymentLabel(method: string | null) {
  if (method === 'gcash') return 'GCash';
  if (method === 'cash') return 'Cash';
  return 'Not specified';
}

function orderTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

function orderItemsSummary(order: Order) {
  const items = order.order_items ?? [];
  if (items.length === 0) return 'No items';
  const first = items[0].menu_items?.name ?? 'Item';
  return items.length > 1 ? `${first} +${items.length - 1} more` : first;
}

type DayBucket = {
  date: Date;
  weekdayLabel: string;
  dateLabel: string;
  isToday: boolean;
  orders: Order[];
  count: number;
  revenue: number;
};

type TopItem = { rank: number; name: string; count: number; revenue: number };

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayHeaderLabel(bucket: DayBucket) {
  if (bucket.isToday) return 'Today, ' + bucket.dateLabel;
  return bucket.date.toLocaleDateString('en-US', { weekday: 'long' }) + ', ' + bucket.dateLabel;
}

export default function StatsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [avgWait, setAvgWait] = useState<number | null>(null);
  const [dayBuckets, setDayBuckets] = useState<DayBucket[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(6);

  const fetchStats = useCallback(async () => {
      setLoading(true);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);

      const { data, error } = await supabase
        .from('orders')
        .select('id, total_price, status, payment_method, estimated_eta_min, created_at, order_items(quantity, unit_price, menu_items(name))')
        .gte('created_at', weekStart.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('stats fetch error:', error.message);
        setLoading(false);
        return;
      }

      const weekOrders = (data ?? []) as unknown as Order[];
      // Only completed (picked up) orders count toward stats and history —
      // an order shouldn't inflate revenue/counts the moment it's placed.
      const completed = weekOrders.filter(o => o.status === 'Picked Up');

      // Avg. Est. Wait reflects orders currently in progress today, which is
      // a different (forward-looking) metric from the completed-order stats.
      const activeToday = weekOrders.filter(
        o => o.status !== 'Picked Up' && o.status !== 'Cancelled Remake In Progress' && new Date(o.created_at) >= todayStart
      );
      if (activeToday.length > 0) {
        const totalWait = activeToday.reduce((sum, o) => sum + (o.estimated_eta_min ?? 0), 0);
        setAvgWait(Math.round(totalWait / activeToday.length));
      } else {
        setAvgWait(null);
      }

      // 7-day history of completed orders, oldest to newest (today last)
      const buckets: DayBucket[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayStart);
        d.setDate(d.getDate() - i);
        const orders = completed.filter(o => isSameDay(new Date(o.created_at), d));
        buckets.push({
          date: d,
          weekdayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isToday: i === 0,
          orders,
          count: orders.length,
          revenue: orders.reduce((sum, o) => sum + (o.total_price ?? 0), 0),
        });
      }
      setDayBuckets(buckets);

      setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('stats-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  const maxCount = Math.max(1, ...dayBuckets.map(b => b.count));
  const selected = dayBuckets[selectedDayIdx];

  const topItems = useMemo<TopItem[]>(() => {
    if (!selected) return [];
    const counts = new Map<string, { count: number; revenue: number }>();
    for (const order of selected.orders) {
      for (const item of order.order_items ?? []) {
        const name = item.menu_items?.name ?? 'Item';
        const entry = counts.get(name) ?? { count: 0, revenue: 0 };
        entry.count += item.quantity;
        entry.revenue += item.quantity * item.unit_price;
        counts.set(name, entry);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, v], idx) => ({ rank: idx + 1, name, count: v.count, revenue: v.revenue }));
  }, [selected]);

  const paymentBreakdown = useMemo(() => {
    if (!selected) return { gcash: 0, cash: 0, unspecified: 0 };
    return selected.orders.reduce(
      (acc, o) => {
        if (o.payment_method === 'gcash') acc.gcash += 1;
        else if (o.payment_method === 'cash') acc.cash += 1;
        else acc.unspecified += 1;
        return acc;
      },
      { gcash: 0, cash: 0, unspecified: 0 }
    );
  }, [selected]);

  const SUMMARY = [
    {
      label: selected?.isToday ? 'Orders Today' : 'Orders',
      value: String(selected?.count ?? 0),
      icon: 'receipt-outline' as const, color: colors.statusInfo,
    },
    {
      label: 'Revenue', value: `₱${selected?.revenue ?? 0}.00`,
      icon: 'cash-outline' as const, color: colors.statusSuccess,
    },
    {
      label: 'Avg. Est. Wait',
      value: selected?.isToday && avgWait !== null ? `${avgWait} min` : '—',
      icon: 'time-outline' as const, color: colors.statusWarning,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Stats</Text>
          <Text style={styles.headerDate}>{selected ? dayHeaderLabel(selected) : ''}</Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.summaryRow}>
            {SUMMARY.map(item => (
              <View key={item.label} style={[styles.summaryCard, cardShadow]}>
                <View style={[styles.summaryIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>This Week</Text>
          <Text style={styles.chartHint}>Tap a day to view its history</Text>
          <View style={[styles.chartCard, cardShadow]}>
            <View style={styles.chartBars}>
              {dayBuckets.map((bucket, idx) => {
                const heightPct = bucket.count / maxCount;
                const isSelected = idx === selectedDayIdx;
                return (
                  <TouchableOpacity
                    key={bucket.dateLabel}
                    style={styles.barCol}
                    onPress={() => setSelectedDayIdx(idx)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.barTrack, isSelected && styles.barTrackSelected]}>
                      <View style={[
                        styles.barFill,
                        { height: `${Math.max(heightPct * 100, bucket.count > 0 ? 4 : 0)}%` },
                        isSelected && styles.barFillActive,
                      ]} />
                    </View>
                    <Text style={[styles.barLabel, isSelected && styles.barLabelActive]}>
                      {bucket.weekdayLabel}
                    </Text>
                    <Text style={[styles.barDateLabel, isSelected && styles.barLabelActive]}>
                      {bucket.dateLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={styles.sectionLabel}>
            Top Items {selected?.isToday ? 'Today' : `— ${selected?.dateLabel ?? ''}`}
          </Text>
          {topItems.length === 0 ? (
            <View style={[styles.emptyCard, cardShadow]}>
              <Ionicons name="cafe-outline" size={32} color={colors.textDisabled} />
              <Text style={styles.emptyText}>
                No items sold {selected?.isToday ? 'yet today' : 'on this day'}
              </Text>
            </View>
          ) : (
            <View style={[styles.topCard, cardShadow]}>
              {topItems.map((item, idx) => (
                <View key={item.name}>
                  <View style={styles.topRow}>
                    <Text style={styles.topRank}>#{item.rank}</Text>
                    <View style={styles.topInfo}>
                      <Text style={styles.topName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.topCount}>{item.count} sold</Text>
                    </View>
                    <Text style={styles.topRevenue}>₱{item.revenue}</Text>
                  </View>
                  {idx < topItems.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionLabel}>
            Order History {selected?.isToday ? 'Today' : `— ${selected?.dateLabel ?? ''}`}
          </Text>
          {!selected || selected.orders.length === 0 ? (
            <View style={[styles.emptyCard, cardShadow]}>
              <Ionicons name="receipt-outline" size={32} color={colors.textDisabled} />
              <Text style={styles.emptyText}>
                No completed orders {selected?.isToday ? 'yet today' : 'on this day'}
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.paymentRow, cardShadow]}>
                <View style={styles.paymentChip}>
                  <Ionicons name="phone-portrait-outline" size={14} color={colors.statusInfo} />
                  <Text style={styles.paymentChipText}>{paymentBreakdown.gcash} GCash</Text>
                </View>
                <View style={styles.paymentChip}>
                  <Ionicons name="cash-outline" size={14} color={colors.statusSuccess} />
                  <Text style={styles.paymentChipText}>{paymentBreakdown.cash} Cash</Text>
                </View>
                {paymentBreakdown.unspecified > 0 && (
                  <View style={styles.paymentChip}>
                    <Ionicons name="help-circle-outline" size={14} color={colors.textDisabled} />
                    <Text style={styles.paymentChipText}>{paymentBreakdown.unspecified} Unspecified</Text>
                  </View>
                )}
              </View>

              <View style={[styles.topCard, cardShadow]}>
                {selected.orders.map((order, idx) => (
                  <View key={order.id}>
                    <TouchableOpacity
                      style={styles.historyRow}
                      activeOpacity={0.7}
                      onPress={() => router.push({ pathname: '/(barista)/order-detail', params: { id: order.id } } as any)}
                    >
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyItems} numberOfLines={1}>{orderItemsSummary(order)}</Text>
                        <Text style={styles.historyMeta}>
                          {orderTimeLabel(order.created_at)} · {paymentLabel(order.payment_method)}
                        </Text>
                      </View>
                      <Text style={styles.topRevenue}>₱{order.total_price}.00</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                    </TouchableOpacity>
                    {idx < selected.orders.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </>
          )}
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
      flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
      paddingHorizontal: Sp[5], paddingVertical: Sp[3],
    },
    headerTitle: { fontSize: FS.headingLg, fontWeight: '800', color: colors.textPrimary },
    headerDate: { fontSize: FS.body, color: colors.textSecondary },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    summaryRow: { flexDirection: 'row', gap: Sp[3], marginBottom: Sp[5] },
    summaryCard: {
      flex: 1, backgroundColor: colors.bgSurface, borderRadius: R.lg,
      padding: Sp[3], alignItems: 'center', gap: Sp[2],
    },
    summaryIcon: { width: 36, height: 36, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
    summaryValue: { fontSize: FS.headingSm, fontWeight: '800', color: colors.textPrimary },
    summaryLabel: { fontSize: FS.overline, color: colors.textSecondary, textAlign: 'center' },
    sectionLabel: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary, marginBottom: Sp[3] },
    chartHint: { fontSize: FS.caption, color: colors.textSecondary, marginTop: -Sp[2], marginBottom: Sp[3] },
    chartCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4], marginBottom: Sp[5],
    },
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: Sp[2] },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    barTrack: {
      flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: R.sm,
      overflow: 'hidden', backgroundColor: colors.bgSubtle,
    },
    barTrackSelected: { backgroundColor: colors.brandMuted + '30' },
    barFill: { width: '100%', backgroundColor: colors.brandMuted, borderRadius: R.sm },
    barFillActive: { backgroundColor: colors.brandPrimary },
    barLabel: { fontSize: FS.overline, color: colors.textSecondary, marginTop: 2 },
    barDateLabel: { fontSize: FS.overline, color: colors.textDisabled },
    barLabelActive: { color: colors.brandPrimary, fontWeight: '700' },
    topCard: { backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4], marginBottom: Sp[5] },
    topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Sp[3] + 1, gap: Sp[3] },
    topRank: { fontSize: FS.label, fontWeight: '800', color: colors.brandMuted, width: 24, textAlign: 'center' },
    topInfo: { flex: 1 },
    topName: { fontSize: FS.body, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    topCount: { fontSize: FS.caption, color: colors.textSecondary },
    topRevenue: { fontSize: FS.headingSm, fontWeight: '700', color: colors.brandSecondary, flexShrink: 0 },
    divider: { height: 1, backgroundColor: colors.bgSubtle },
    paymentRow: {
      flexDirection: 'row', gap: Sp[2], marginBottom: Sp[3],
    },
    paymentChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.bgSurface, borderRadius: R.full,
      paddingHorizontal: Sp[3], paddingVertical: Sp[2],
    },
    paymentChipText: { fontSize: FS.caption, fontWeight: '600', color: colors.textPrimary },
    historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Sp[3] + 1, gap: Sp[3] },
    historyInfo: { flex: 1 },
    historyItems: { fontSize: FS.body, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    historyMeta: { fontSize: FS.caption, color: colors.textSecondary },
    emptyCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[6],
      alignItems: 'center', gap: Sp[3], marginBottom: Sp[5],
    },
    emptyText: { fontSize: FS.body, color: colors.textSecondary },
  });
}
