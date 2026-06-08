import { useMemo } from 'react';
import {
  Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow, cardShadowMd } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const QUICK_ITEMS = [
  { id: '1', name: 'Cold Brew' },
  { id: '2', name: 'Vanilla Latte' },
  { id: '3', name: 'Caramel Frap' },
];

const FEATURED = [
  { id: '1', name: 'Nitro Cold Brew', price: 195, tag: 'Popular' },
  { id: '2', name: 'Hazelnut Mocha',  price: 185, tag: 'New' },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const LOGO = isDark
    ? require('../../assets/starbrew-logo_dark.png')
    : require('../../assets/starbrew-logo_light.png');

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
            <View>
              <Text style={styles.headerTitle}>Good morning!</Text>
              <Text style={styles.headerSub}>It's a great day for coffee</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(customer)/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.sectionLabel}>Order again</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
        >
          {QUICK_ITEMS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickChip}
              activeOpacity={0.8}
              onPress={() => router.push('/(customer)/menu' as any)}
            >
              <Ionicons name="refresh-outline" size={13} color={colors.brandPrimary} />
              <Text style={styles.quickChipText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>StarBrew Info</Text>
        <View style={[styles.infoCard, cardShadow]}>
          <View style={styles.infoCardInner}>
            <View style={styles.infoIconBg}>
              <Ionicons name="storefront-outline" size={24} color={colors.brandPrimary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>StarBrew Cafe Makati</Text>
              <Text style={styles.infoDetail}>
                <Ionicons name="time-outline" size={12} /> Open · Closes 10 PM
              </Text>
              <Text style={styles.infoDetail}>
                <Ionicons name="location-outline" size={12} /> Ayala Ave, Makati City
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>StarBrew Rewards</Text>
        <TouchableOpacity
          style={[styles.rewardsCard, cardShadow]}
          activeOpacity={0.85}
          onPress={() => router.push('/(customer)/rewards' as any)}
        >
          <View style={styles.rewardsTop}>
            <View>
              <Text style={styles.rewardsPoints}>240</Text>
              <Text style={styles.rewardsLabel}>Stars earned</Text>
            </View>
            <View style={styles.rewardsBadge}>
              <Ionicons name="star" size={14} color={colors.textInverse} />
              <Text style={styles.rewardsBadgeText}>Gold</Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.progressLabel}>60 more stars to Platinum</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Featured drinks</Text>
        <View style={styles.featuredRow}>
          {FEATURED.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.featuredCard, cardShadowMd]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/(customer)/item-detail' as any,
                  params: { name: item.name, price: item.price.toString() },
                })
              }
            >
              <View style={styles.featuredImgPlaceholder} />
              <View style={styles.featuredTagRow}>
                <View style={styles.featuredTag}>
                  <Text style={styles.featuredTagText}>{item.tag}</Text>
                </View>
              </View>
              <Text style={styles.featuredName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.featuredPrice}>₱{item.price}.00</Text>
              <TouchableOpacity style={styles.featuredAddBtn} activeOpacity={0.8}>
                <Ionicons name="add" size={18} color={colors.textInverse} />
              </TouchableOpacity>
            </TouchableOpacity>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Sp[5],
      paddingVertical: Sp[3],
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Sp[3] },
    headerLogo: { width: 40, height: 40 },
    headerTitle: {
      fontSize: FS.headingMd,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    headerSub: { fontSize: FS.caption, color: colors.textSecondary, marginTop: 1 },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    sectionLabel: {
      fontSize: FS.headingSm,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: Sp[5],
      marginBottom: Sp[3],
    },
    quickRow: { gap: Sp[2], paddingBottom: Sp[1] },
    quickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.bgSurface,
      borderRadius: R.full,
      paddingHorizontal: Sp[3],
      paddingVertical: Sp[2],
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickChipText: { fontSize: FS.label, color: colors.brandPrimary, fontWeight: '500' },
    infoCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: R.lg,
      padding: Sp[4],
      marginBottom: Sp[1],
    },
    infoCardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: Sp[3] },
    infoIconBg: {
      width: 44,
      height: 44,
      borderRadius: R.md,
      backgroundColor: colors.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoText: { flex: 1, gap: 4 },
    infoTitle: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary },
    infoDetail: { fontSize: FS.caption, color: colors.textSecondary, lineHeight: 18 },
    rewardsCard: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.lg,
      padding: Sp[5],
      marginBottom: Sp[1],
    },
    rewardsTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Sp[4],
    },
    rewardsPoints: {
      fontSize: FS.display,
      fontWeight: '800',
      color: colors.textInverse,
    },
    rewardsLabel: { fontSize: FS.label, color: 'rgba(250,247,244,0.7)' },
    rewardsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: R.full,
      paddingHorizontal: Sp[3],
      paddingVertical: Sp[1],
    },
    rewardsBadgeText: { fontSize: FS.label, color: colors.textInverse, fontWeight: '600' },
    progressBg: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: R.full,
      marginBottom: Sp[2],
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.textInverse,
      borderRadius: R.full,
    },
    progressLabel: { fontSize: FS.caption, color: 'rgba(250,247,244,0.75)' },
    featuredRow: { flexDirection: 'row', gap: Sp[3] },
    featuredCard: {
      flex: 1,
      backgroundColor: colors.bgSurface,
      borderRadius: R.lg,
      overflow: 'hidden',
      paddingBottom: Sp[3],
    },
    featuredImgPlaceholder: {
      height: 120,
      backgroundColor: colors.bgSubtle,
    },
    featuredTagRow: { paddingHorizontal: Sp[3], paddingTop: Sp[2], marginBottom: 2 },
    featuredTag: {
      alignSelf: 'flex-start',
      backgroundColor: colors.statusWarningBg,
      borderRadius: R.sm,
      paddingHorizontal: Sp[2],
      paddingVertical: 2,
    },
    featuredTagText: {
      fontSize: FS.overline,
      fontWeight: '700',
      color: colors.statusWarning,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    featuredName: {
      fontSize: FS.label,
      fontWeight: '600',
      color: colors.textPrimary,
      paddingHorizontal: Sp[3],
      marginBottom: 2,
    },
    featuredPrice: {
      fontSize: FS.label,
      fontWeight: '700',
      color: colors.brandSecondary,
      paddingHorizontal: Sp[3],
    },
    featuredAddBtn: {
      position: 'absolute',
      bottom: Sp[3],
      right: Sp[3],
      width: 28,
      height: 28,
      borderRadius: R.full,
      backgroundColor: colors.brandPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
