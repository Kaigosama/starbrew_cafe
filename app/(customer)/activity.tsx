import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const RECENT = [
  { id: '1', name: 'Cold Brew – StarBrew Cafe Makati',                         date: 'April 26, 2026  ·  16:32', price: 175 },
  { id: '2', name: 'Cold Brew – StarBrew Cafe Makati',                         date: 'April 25, 2026  ·  10:14', price: 175 },
  { id: '3', name: 'Vanilla Sweet Cream Cold Brew – StarBrew Cafe Makati',     date: 'April 24, 2026  ·  08:55', price: 195 },
];

export default function ActivityScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Activity</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>My Order</Text>
        <View style={[styles.orderCard, cardShadow]}>
          <View style={styles.orderCardTop}>
            <View style={styles.orderImgPlaceholder}>
              <Ionicons name="cafe-outline" size={28} color={colors.brandMuted} />
            </View>
            <View style={styles.orderCardInfo}>
              <Text style={styles.orderCardDrink} numberOfLines={1}>Cold Brew</Text>
              <Text style={styles.orderCardLocation}>StarBrew Cafe Makati</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>In Progress</Text>
              </View>
            </View>
            <Text style={styles.orderCardPrice}>₱175.00</Text>
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
              <Text style={styles.footerTileValue}>#12</Text>
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
          {RECENT.map((order, idx) => (
            <View key={order.id}>
              <View style={styles.recentRow}>
                <View style={styles.recentImg} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>{order.name}</Text>
                  <Text style={styles.recentDate}>{order.date}</Text>
                  <TouchableOpacity style={styles.reorderBtn} activeOpacity={0.7}>
                    <Text style={styles.reorderText}>Reorder</Text>
                    <Ionicons name="arrow-forward" size={12} color={colors.brandPrimary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.recentPrice}>₱{order.price}.00</Text>
              </View>
              {idx < RECENT.length - 1 && <View style={styles.divider} />}
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
    headerRow: { paddingHorizontal: Sp[5], paddingVertical: Sp[3] },
    headerTitle: { fontSize: FS.headingLg, fontWeight: '800', color: colors.textPrimary },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
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
    statusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
      backgroundColor: colors.statusWarningBg, borderRadius: R.sm, paddingHorizontal: Sp[2], paddingVertical: 3,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.statusWarning },
    statusText: {
      fontSize: FS.overline, fontWeight: '600', color: colors.statusWarning,
      textTransform: 'uppercase', letterSpacing: 0.3,
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
    recentHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sp[3],
    },
    viewAllText: { fontSize: FS.label, color: colors.brandSecondary, fontWeight: '600' },
    recentCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4],
    },
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
