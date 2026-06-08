import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function OrderConfirmationScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={40} color={colors.textInverse} />
            </View>
          </View>

          <Text style={styles.title}>Order Placed!</Text>
          <Text style={styles.subtitle}>
            Your order has been received and is being prepared.
          </Text>

          <View style={[styles.infoCard, cardShadow]}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Order Number</Text>
                <Text style={styles.infoValue}>#SB-2048</Text>
              </View>
              <View style={styles.infoSep} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Queue</Text>
                <Text style={styles.infoValue}>#12</Text>
              </View>
              <View style={styles.infoSep} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Est. Wait</Text>
                <Text style={styles.infoValue}>8 min</Text>
              </View>
            </View>
          </View>

          <View style={[styles.summaryCard, cardShadow]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItemImg} />
              <View style={styles.summaryItemInfo}>
                <Text style={styles.summaryItemName}>Cold Brew</Text>
                <Text style={styles.summaryItemMeta}>Grande · Whole Milk</Text>
              </View>
              <Text style={styles.summaryItemPrice}>₱175.00</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => router.push('/(customer)/order-status' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate-outline" size={18} color={colors.textInverse} />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/(customer)')}
            activeOpacity={0.8}
          >
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    safe: { flex: 1 },
    body: { flex: 1, alignItems: 'center', paddingHorizontal: Sp[5], paddingTop: Sp[10] },
    iconWrap: { marginBottom: Sp[5] },
    iconCircle: {
      width: 88, height: 88, borderRadius: R.full, backgroundColor: colors.statusSuccess,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.statusSuccess, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    title: {
      fontSize: FS.display, fontWeight: '800', color: colors.textPrimary,
      marginBottom: Sp[2], textAlign: 'center',
    },
    subtitle: {
      fontSize: FS.body, color: colors.textSecondary, textAlign: 'center',
      lineHeight: 21, marginBottom: Sp[6], paddingHorizontal: Sp[4],
    },
    infoCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg,
      padding: Sp[4], width: '100%', marginBottom: Sp[4],
    },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoItem: { flex: 1, alignItems: 'center' },
    infoLabel: { fontSize: FS.caption, color: colors.textSecondary, marginBottom: 4 },
    infoValue: { fontSize: FS.headingMd, fontWeight: '800', color: colors.brandPrimary },
    infoSep: { width: 1, height: 36, backgroundColor: colors.bgSubtle },
    summaryCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg,
      padding: Sp[4], width: '100%',
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Sp[3] },
    summaryItemImg: { width: 44, height: 44, borderRadius: R.md, backgroundColor: colors.bgSubtle },
    summaryItemInfo: { flex: 1 },
    summaryItemName: { fontSize: FS.body, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    summaryItemMeta: { fontSize: FS.caption, color: colors.textSecondary },
    summaryItemPrice: { fontSize: FS.body, fontWeight: '700', color: colors.brandSecondary },
    footer: { paddingHorizontal: Sp[5], paddingBottom: Sp[8], gap: Sp[3] },
    trackBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md, paddingVertical: 15,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Sp[2],
    },
    trackBtnText: { color: colors.textInverse, fontSize: FS.bodyLg, fontWeight: '700' },
    homeBtn: {
      borderRadius: R.md, paddingVertical: 15, borderWidth: 1.5,
      borderColor: colors.border, alignItems: 'center',
    },
    homeBtnText: { color: colors.textPrimary, fontSize: FS.bodyLg, fontWeight: '600' },
  });
}
