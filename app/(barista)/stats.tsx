import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const CHART_BARS = [
  { label: 'Mon', height: 40 },
  { label: 'Tue', height: 60 },
  { label: 'Wed', height: 80 },
  { label: 'Thu', height: 55 },
  { label: 'Fri', height: 100 },
  { label: 'Sat', height: 90 },
  { label: 'Sun', height: 70 },
];

const TOP_ITEMS = [
  { rank: 1, name: 'Cold Brew',                      count: 12, revenue: 2100 },
  { rank: 2, name: 'Vanilla Sweet Cream Cold Brew',   count: 9,  revenue: 1755 },
  { rank: 3, name: 'Caramel Frappuccino',             count: 7,  revenue: 1435 },
  { rank: 4, name: 'Nitro Cold Brew',                 count: 5,  revenue: 925 },
  { rank: 5, name: 'Hazelnut Mocha',                  count: 5,  revenue: 925 },
];

const maxHeight = Math.max(...CHART_BARS.map(b => b.height));

export default function StatsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const SUMMARY = [
    { label: 'Orders Today', value: '38',    icon: 'receipt-outline' as const, color: colors.statusInfo },
    { label: 'Revenue',      value: '₱7,240', icon: 'cash-outline' as const,   color: colors.statusSuccess },
    { label: 'Avg. Wait',    value: '6 min',  icon: 'time-outline' as const,   color: colors.statusWarning },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Stats</Text>
          <Text style={styles.headerDate}>Today, Jun 8</Text>
        </View>
      </SafeAreaView>

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
            {CHART_BARS.map(bar => {
              const heightPct = bar.height / maxHeight;
              const isToday = bar.label === 'Fri';
              return (
                <View key={bar.label} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill,
                      { height: `${heightPct * 100}%` },
                      isToday && styles.barFillActive,
                    ]} />
                  </View>
                  <Text style={[styles.barLabel, isToday && styles.barLabelActive]}>
                    {bar.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Top Items Today</Text>
        <View style={[styles.topCard, cardShadow]}>
          {TOP_ITEMS.map((item, idx) => (
            <View key={item.rank}>
              <View style={styles.topRow}>
                <Text style={styles.topRank}>#{item.rank}</Text>
                <View style={styles.topInfo}>
                  <Text style={styles.topName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.topCount}>{item.count} orders</Text>
                </View>
                <Text style={styles.topRevenue}>₱{item.revenue}</Text>
              </View>
              {idx < TOP_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
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
  });
}
