import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';

type FulfillType = 'pickup' | 'delivery';
type TipOption = 0 | 10 | 15 | 20;

export default function CheckoutScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const [fulfill, setFulfill] = useState<FulfillType>('pickup');
  const [tip, setTip] = useState<TipOption>(0);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const fee = 15;
  const tipAmount = Math.round(subtotal * tip / 100);
  const total = subtotal + fee + tipAmount;

  function handleConfirm() {
    clear();
    router.replace('/(customer)/order-confirmation' as any);
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>How do you want it?</Text>
        <View style={[styles.toggleCard, cardShadow]}>
          {(['pickup', 'delivery'] as FulfillType[]).map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.toggleBtn, fulfill === opt && styles.toggleBtnActive]}
              onPress={() => setFulfill(opt)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={opt === 'pickup' ? 'storefront-outline' : 'bicycle-outline'}
                size={18}
                color={fulfill === opt ? colors.textInverse : colors.textSecondary}
              />
              <Text style={[styles.toggleBtnText, fulfill === opt && styles.toggleBtnTextActive]}>
                {opt === 'pickup' ? 'Pick-up' : 'Delivery'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Order Summary</Text>
        <View style={[styles.card, cardShadow]}>
          {items.map((item, idx) => (
            <View key={item.id}>
              <View style={styles.orderRow}>
                <View style={styles.orderImg} />
                <View style={styles.orderInfo}>
                  <Text style={styles.orderName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.orderQty}>
                    {item.size} · {item.milk} · Qty {item.qty}
                  </Text>
                </View>
                <Text style={styles.orderPrice}>₱{item.price * item.qty}.00</Text>
              </View>
              {idx < items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Add a tip</Text>
        <View style={[styles.tipCard, cardShadow]}>
          {([0, 10, 15, 20] as TipOption[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tipBtn, tip === t && styles.tipBtnActive]}
              onPress={() => setTip(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tipBtnText, tip === t && styles.tipBtnTextActive]}>
                {t === 0 ? 'None' : `${t}%`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Payment</Text>
        <View style={[styles.card, cardShadow]}>
          <TouchableOpacity style={styles.paymentRow} activeOpacity={0.7}>
            <View style={styles.paymentLeft}>
              <Ionicons name="card-outline" size={20} color={colors.brandSecondary} />
              <Text style={styles.paymentLabel}>GCash · •••• 1234</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryCard, cardShadow]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₱{subtotal}.00</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service fee</Text>
            <Text style={styles.summaryValue}>₱{fee}.00</Text>
          </View>
          {tipAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tip ({tip}%)</Text>
              <Text style={styles.summaryValue}>₱{tipAmount}.00</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{total}.00</Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footerArea}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm Order · ₱{total}.00</Text>
        </TouchableOpacity>
      </SafeAreaView>
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
    scroll: { paddingHorizontal: Sp[5], paddingTop: Sp[2], paddingBottom: Sp[4] },
    sectionLabel: {
      fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary,
      marginTop: Sp[4], marginBottom: Sp[3],
    },
    toggleCard: {
      flexDirection: 'row', backgroundColor: colors.bgSurface,
      borderRadius: R.lg, padding: Sp[1], gap: Sp[1],
    },
    toggleBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Sp[2], paddingVertical: Sp[3], borderRadius: R.md,
    },
    toggleBtnActive: { backgroundColor: colors.brandPrimary },
    toggleBtnText: { fontSize: FS.body, fontWeight: '600', color: colors.textSecondary },
    toggleBtnTextActive: { color: colors.textInverse },
    card: { backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4] },
    orderRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: Sp[3] + 1, gap: Sp[3],
    },
    orderImg: { width: 44, height: 44, borderRadius: R.md, backgroundColor: colors.bgSubtle },
    orderInfo: { flex: 1 },
    orderName: { fontSize: FS.label, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    orderQty: { fontSize: FS.caption, color: colors.textSecondary },
    orderPrice: { fontSize: FS.label, fontWeight: '700', color: colors.brandSecondary, flexShrink: 0 },
    divider: { height: 1, backgroundColor: colors.bgSubtle },
    tipCard: {
      flexDirection: 'row', backgroundColor: colors.bgSurface,
      borderRadius: R.lg, padding: Sp[1], gap: Sp[1],
    },
    tipBtn: { flex: 1, paddingVertical: Sp[3], borderRadius: R.md, alignItems: 'center' },
    tipBtnActive: { backgroundColor: colors.brandPrimary },
    tipBtnText: { fontSize: FS.label, fontWeight: '600', color: colors.textSecondary },
    tipBtnTextActive: { color: colors.textInverse },
    paymentRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Sp[4],
    },
    paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: Sp[3] },
    paymentLabel: { fontSize: FS.body, color: colors.textPrimary, fontWeight: '500' },
    summaryCard: { backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4], marginTop: Sp[4] },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Sp[2] },
    summaryLabel: { fontSize: FS.body, color: colors.textSecondary },
    summaryValue: { fontSize: FS.body, fontWeight: '500', color: colors.textPrimary },
    totalLabel: { fontSize: FS.bodyLg, fontWeight: '700', color: colors.textPrimary },
    totalValue: { fontSize: FS.bodyLg, fontWeight: '800', color: colors.brandPrimary },
    footerArea: {
      paddingHorizontal: Sp[5], paddingBottom: Sp[4], paddingTop: Sp[2],
      borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgBase,
    },
    confirmBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md, paddingVertical: 15, alignItems: 'center',
    },
    confirmBtnText: { color: colors.textInverse, fontSize: FS.bodyLg, fontWeight: '700' },
  });
}
