import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

type OrderItemRow = { quantity: number; unit_price: number; menu_items: { name: string } | null };
type Order = {
  id: string;
  total_price: number;
  status: string;
  estimated_eta_min: number;
  created_at: string;
  order_items: OrderItemRow[];
};

type DayBar = { label: string; count: number; isToday: boolean };
type TopItem = { rank: number; name: string; count: number; revenue: number };

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function todayDateLabel() {
  return 'Today, ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function StatsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [ordersToday, setOrdersToday] = useState(0);
  const [revenueToday, setRevenueToday] = useState(0);
  const [avgWait, setAvgWait] = useState<number | null>(null);
  const [chartBars, setChartBars] = useState<DayBar[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);

  const fetchStats = useCallback(async () => {
      setLoading(true);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);

      const { data, error } = await supabase
        .from('orders')
        .select('id, total_price, status, estimated_eta_min, created_at, order_items(quantity, unit_price, menu_items(name))')
        .gte('created_at', weekStart.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('stats fetch error:', error.message);
        setLoading(false);
        return;
      }

      const weekOrders = (data ?? []) as unknown as Order[];
      const active = weekOrders.filter(o => o.status !== 'Cancelled Remake In Progress');

      // Today's metrics
      const todays = active.filter(o => new Date(o.created_at) >= todayStart);
      setOrdersToday(todays.length);
      setRevenueToday(todays.reduce((sum, o) => sum + (o.total_price ?? 0), 0));

      const activeToday = todays.filter(o => o.status !== 'Picked Up');
      if (activeToday.length > 0) {
        const totalWait = activeToday.reduce((sum, o) => sum + (o.estimated_eta_min ?? 0), 0);
        setAvgWait(Math.round(totalWait / activeToday.length));
      } else {
        setAvgWait(null);
      }

      // 7-day order-count chart
      const bars: DayBar[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayStart);
        d.setDate(d.getDate() - i);
        const count = active.filter(o => isSameDay(new Date(o.created_at), d)).length;
        bars.push({
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          count,
          isToday: i === 0,
        });
      }
      setChartBars(bars);

      // Top items today
      const counts = new Map<string, { count: number; revenue: number }>();
      for (const order of todays) {
        for (const item of order.order_items ?? []) {
          const name = item.menu_items?.name ?? 'Item';
          const entry = counts.get(name) ?? { count: 0, revenue: 0 };
          entry.count += item.quantity;
          entry.revenue += item.quantity * item.unit_price;
          counts.set(name, entry);
        }
      }
      const ranked: TopItem[] = Array.from(counts.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name, v], idx) => ({ rank: idx + 1, name, count: v.count, revenue: v.revenue }));
      setTopItems(ranked);

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

  const maxCount = Math.max(1, ...chartBars.map(b => b.count));

  const SUMMARY = [
    { label: 'Orders Today', value: String(ordersToday), icon: 'receipt-outline' as const, color: colors.statusInfo },
    { label: 'Revenue',      value: `₱${revenueToday}.00`, icon: 'cash-outline' as const, color: colors.statusSuccess },
    { label: 'Avg. Est. Wait', value: avgWait !== null ? `${avgWait} min` : '—', icon: 'time-outline' as const, color: colors.statusWarning },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Stats</Text>
          <Text style={styles.headerDate}>{todayDateLabel()}</Text>
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
          <View style={[styles.chartCard, cardShadow]}>
            <View style={styles.chartBars}>
              {chartBars.map(bar => {
                const heightPct = bar.count / maxCount;
                return (
                  <View key={bar.label} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[
                        styles.barFill,
                        { height: `${Math.max(heightPct * 100, bar.count > 0 ? 4 : 0)}%` },
                        bar.isToday && styles.barFillActive,
                      ]} />
                    </View>
                    <Text style={[styles.barLabel, bar.isToday && styles.barLabelActive]}>
                      {bar.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Top Items Today</Text>
          {topItems.length === 0 ? (
            <View style={[styles.emptyCard, cardShadow]}>
              <Ionicons name="cafe-outline" size={32} color={colors.textDisabled} />
              <Text style={styles.emptyText}>No items sold yet today</Text>
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
    chartCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4], marginBottom: Sp[5],
    },
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: Sp[2] },
    barCol: { flex: 1, alignItems: 'center', gap: 6 },
    barTrack: {
      flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: R.sm,
      overflow: 'hidden', backgroundColor: colors.bgSubtle,
    },
    barFill: { width: '100%', backgroundColor: colors.brandMuted, borderRadius: R.sm },
    barFillActive: { backgroundColor: colors.brandPrimary },
    barLabel: { fontSize: FS.overline, color: colors.textSecondary },
    barLabelActive: { color: colors.brandPrimary, fontWeight: '700' },
    topCard: { backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4] },
    topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Sp[3] + 1, gap: Sp[3] },
    topRank: { fontSize: FS.label, fontWeight: '800', color: colors.brandMuted, width: 24, textAlign: 'center' },
    topInfo: { flex: 1 },
    topName: { fontSize: FS.body, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    topCount: { fontSize: FS.caption, color: colors.textSecondary },
    topRevenue: { fontSize: FS.headingSm, fontWeight: '700', color: colors.brandSecondary, flexShrink: 0 },
    divider: { height: 1, backgroundColor: colors.bgSubtle },
    emptyCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[6],
      alignItems: 'center', gap: Sp[3],
    },
    emptyText: { fontSize: FS.body, color: colors.textSecondary },
  });
}
