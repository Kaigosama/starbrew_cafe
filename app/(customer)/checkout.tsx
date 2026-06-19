import { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

type FulfillType = 'pickup' | 'delivery';
type TipOption = 0 | 10 | 15 | 20;

export default function CheckoutScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  const [fulfill, setFulfill] = useState<FulfillType>('pickup');
  const [tip, setTip] = useState<TipOption>(0);
  const [loading, setLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const fee = 15;
  const tipAmount = Math.round(subtotal * tip / 100);
  const total = subtotal + fee + tipAmount;

  function handleOpenPayment() {
    if (items.length === 0) return;
    setPaymentModalVisible(true);
  }

  async function handlePaymentResult(success: boolean) {
    setPaymentModalVisible(false);
    if (!success) {
      Alert.alert('Payment Failed', 'Your mock payment could not be processed. Please try again.');
      return;
    }
    await placeOrder();
  }

  async function placeOrder() {
    setLoading(true);

    // Generate queue number from total order count
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true });
    const queueNum = ((count ?? 0) % 99) + 1;

    // Build customer display name
    const firstName = (user?.user_metadata?.firstName as string) ?? 'Customer';
    const lastInitial = (user?.user_metadata?.lastName as string)?.[0] ?? '';
    const customerName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;

    // Build items summary for barista display
    const itemsSummary = items.map(i => `${i.name} · ${i.size}`).join(', ');

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id,
        queue_num: queueNum,
        customer_name: customerName,
        items: itemsSummary,
        status: 'received',
        fulfill,
        total,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      setLoading(false);
      Alert.alert('Order failed', orderError?.message ?? 'Could not place your order. Please try again.');
      return;
    }

    // Insert order items
    await supabase.from('order_items').insert(
      items.map(item => ({
        order_id: order.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        customizations: { size: item.size, milk: item.milk, addOns: item.addOns },
      }))
    );

    const itemCount = items.length;
    setLoading(false);
    clear();
    router.replace({
      pathname: '/(customer)/order-confirmation' as any,
      params: { queueNum: queueNum.toString(), itemCount: itemCount.toString(), total: total.toString() },
    });
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
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Ionicons name="card-outline" size={20} color={colors.brandSecondary} />
              <Text style={styles.paymentLabel}>GCash · Mock Payment</Text>
            </View>
          </View>
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
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={handleOpenPayment}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.confirmBtnText}>
            {loading ? 'Placing order…' : `Proceed to Payment · ₱${total}.00`}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, cardShadow]}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="card-outline" size={28} color={colors.brandPrimary} />
            </View>
            <Text style={styles.modalTitle}>Mock Payment</Text>
            <Text style={styles.modalSubtitle}>
              This is a simulated GCash payment for demo purposes. No real money is charged.
            </Text>
            <Text style={styles.modalAmount}>₱{total}.00</Text>

            <TouchableOpacity
              style={styles.modalSuccessBtn}
              onPress={() => handlePaymentResult(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.textInverse} />
              <Text style={styles.modalSuccessBtnText}>Simulate Successful Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalFailBtn}
              onPress={() => handlePaymentResult(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.statusError} />
              <Text style={styles.modalFailBtnText}>Simulate Failed Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setPaymentModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    confirmBtnDisabled: { opacity: 0.6 },
    confirmBtnText: { color: colors.textInverse, fontSize: FS.bodyLg, fontWeight: '700' },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: Sp[5],
    },
    modalCard: {
      width: '100%', backgroundColor: colors.bgSurface, borderRadius: R.xl,
      padding: Sp[6], alignItems: 'center',
    },
    modalIconWrap: {
      width: 56, height: 56, borderRadius: R.full, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center', marginBottom: Sp[3],
    },
    modalTitle: { fontSize: FS.headingMd, fontWeight: '700', color: colors.textPrimary, marginBottom: Sp[2] },
    modalSubtitle: {
      fontSize: FS.caption, color: colors.textSecondary, textAlign: 'center',
      lineHeight: 18, marginBottom: Sp[4],
    },
    modalAmount: {
      fontSize: FS.display, fontWeight: '800', color: colors.brandPrimary, marginBottom: Sp[5],
    },
    modalSuccessBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Sp[2],
      backgroundColor: colors.statusSuccess, borderRadius: R.md,
      paddingVertical: 14, width: '100%', marginBottom: Sp[3],
    },
    modalSuccessBtnText: { color: colors.textInverse, fontSize: FS.body, fontWeight: '700' },
    modalFailBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Sp[2],
      borderWidth: 1.5, borderColor: colors.statusError, borderRadius: R.md,
      paddingVertical: 14, width: '100%', marginBottom: Sp[3],
    },
    modalFailBtnText: { color: colors.statusError, fontSize: FS.body, fontWeight: '700' },
    modalCancelBtn: { paddingVertical: Sp[2] },
    modalCancelBtnText: { color: colors.textSecondary, fontSize: FS.body, fontWeight: '500' },
  });
}
