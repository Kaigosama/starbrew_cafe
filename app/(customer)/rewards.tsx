import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const REWARDS = [
  { id: '1', name: 'Free Tall Drink',   cost: 150, unlocked: true },
  { id: '2', name: 'Free Pastry',       cost: 100, unlocked: true },
  { id: '3', name: 'Free Grande Drink', cost: 250, unlocked: false },
  { id: '4', name: 'Free Venti Drink',  cost: 400, unlocked: false },
];

const HISTORY = [
  { id: '1', label: 'Cold Brew purchase',          points: +12,  date: 'Apr 26' },
  { id: '2', label: 'Vanilla Latte purchase',       points: +14,  date: 'Apr 25' },
  { id: '3', label: 'Free Tall Drink redeemed',     points: -150, date: 'Apr 20' },
];

export default function RewardsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const totalPoints = 240;
  const nextTier = 300;
  const progress = totalPoints / nextTier;

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loyalty Rewards</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Text style={styles.heroPoints}>{totalPoints}</Text>
          <Text style={styles.heroLabel}>Stars</Text>
          <View style={styles.tierBadge}>
            <Ionicons name="star" size={12} color={colors.textInverse} />
            <Text style={styles.tierText}>Gold Member</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {nextTier - totalPoints} more stars to Platinum
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Redeem Rewards</Text>
        {REWARDS.map(reward => (
          <View key={reward.id} style={[styles.rewardRow, cardShadow]}>
            <View style={[styles.rewardIcon, !reward.unlocked && styles.rewardIconLocked]}>
              <Ionicons
                name={reward.unlocked ? 'cafe-outline' : 'lock-closed-outline'}
                size={20}
                color={reward.unlocked ? colors.brandPrimary : colors.textDisabled}
              />
            </View>
            <View style={styles.rewardInfo}>
              <Text style={[styles.rewardName, !reward.unlocked && styles.rewardNameLocked]}>
                {reward.name}
              </Text>
              <Text style={styles.rewardCost}>{reward.cost} stars</Text>
            </View>
            <TouchableOpacity
              style={[styles.redeemBtn, !reward.unlocked && styles.redeemBtnDisabled]}
              disabled={!reward.unlocked}
              activeOpacity={0.85}
            >
              <Text style={[styles.redeemBtnText, !reward.unlocked && styles.redeemBtnTextDisabled]}>
                {reward.unlocked ? 'Redeem' : 'Locked'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionLabel}>Recent Activity</Text>
        <View style={[styles.historyCard, cardShadow]}>
          {HISTORY.map((item, idx) => (
            <View key={item.id}>
              <View style={styles.historyRow}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyLabel}>{item.label}</Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
                <Text style={[
                  styles.historyPoints,
                  item.points > 0 ? styles.historyPointsPos : styles.historyPointsNeg,
                ]}>
                  {item.points > 0 ? '+' : ''}{item.points}
                </Text>
              </View>
              {idx < HISTORY.length - 1 && <View style={styles.divider} />}
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
    headerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Sp[5], paddingVertical: Sp[3],
    },
    backBtn: { padding: Sp[1] },
    headerTitle: { fontSize: FS.headingMd, fontWeight: '700', color: colors.textPrimary },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    heroCard: {
      backgroundColor: colors.brandPrimary, borderRadius: R.xl,
      padding: Sp[6], alignItems: 'center', marginBottom: Sp[5],
    },
    heroPoints: { fontSize: 56, fontWeight: '900', color: colors.textInverse, lineHeight: 64 },
    heroLabel: { fontSize: FS.bodyLg, color: 'rgba(250,247,244,0.7)', marginBottom: Sp[3] },
    tierBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: R.full,
      paddingHorizontal: Sp[3], paddingVertical: Sp[1] + 1, marginBottom: Sp[5],
    },
    tierText: { fontSize: FS.label, color: colors.textInverse, fontWeight: '600' },
    progressBg: {
      height: 6, width: '100%', backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: R.full, marginBottom: Sp[2], overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: colors.textInverse, borderRadius: R.full },
    progressLabel: { fontSize: FS.caption, color: 'rgba(250,247,244,0.75)' },
    sectionLabel: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary, marginBottom: Sp[3] },
    rewardRow: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4],
      flexDirection: 'row', alignItems: 'center', gap: Sp[3], marginBottom: Sp[3],
    },
    rewardIcon: {
      width: 44, height: 44, borderRadius: R.md, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center',
    },
    rewardIconLocked: { opacity: 0.6 },
    rewardInfo: { flex: 1 },
    rewardName: { fontSize: FS.body, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    rewardNameLocked: { color: colors.textDisabled },
    rewardCost: { fontSize: FS.caption, color: colors.textSecondary },
    redeemBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md, paddingHorizontal: Sp[3], paddingVertical: 8,
    },
    redeemBtnDisabled: { backgroundColor: colors.bgSubtle },
    redeemBtnText: { fontSize: FS.label, fontWeight: '700', color: colors.textInverse },
    redeemBtnTextDisabled: { color: colors.textDisabled },
    historyCard: { backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4] },
    historyRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Sp[3] + 1,
    },
    historyInfo: {},
    historyLabel: { fontSize: FS.body, fontWeight: '500', color: colors.textPrimary, marginBottom: 2 },
    historyDate: { fontSize: FS.caption, color: colors.textSecondary },
    historyPoints: { fontSize: FS.headingSm, fontWeight: '700' },
    historyPointsPos: { color: colors.statusSuccess },
    historyPointsNeg: { color: colors.statusError },
    divider: { height: 1, backgroundColor: colors.bgSubtle },
  });
}
