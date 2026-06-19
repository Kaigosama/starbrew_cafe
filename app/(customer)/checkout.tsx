import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { estimateWaitMinutes } from '../../lib/eta';

type FulfillType = 'in-store' | 'drive-thru';
type PaymentMethod = 'gcash' | 'cash';
const TIP_PRESETS = [0, 25, 50, 75] as const;
type TipPreset = typeof TIP_PRESETS[number];

export default function CheckoutScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  const [fulfill, setFulfill] = useState<FulfillType>('in-store');
  const [tipMode, setTipMode] = useState<'preset' | 'custom'>('preset');
  const [tipPreset, setTipPreset] = useState<TipPreset>(0);
  const [customTip, setCustomTip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [loading, setLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const [storeStatus, setStoreStatus] = useState<{
    isOpen: boolean; pickupEnabled: boolean; deliveryEnabled: boolean;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('store_status')
      .select('is_open, pickup_enabled, delivery_enabled')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('store_status fetch error:', error.message);
        if (data) {
          setStoreStatus({
            isOpen: data.is_open,
            pickupEnabled: data.pickup_enabled,
            deliveryEnabled: data.delivery_enabled,
          });
          if (!data.pickup_enabled && data.delivery_enabled) setFulfill('drive-thru');
          else if (data.pickup_enabled && !data.delivery_enabled) setFulfill('in-store');
        }
        setStatusLoading(false);
      });
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const fee = 15;
  const tipAmount = tipMode === 'custom' ? Math.max(0, parseInt(customTip, 10) || 0) : tipPreset;
  const total = subtotal + fee + tipAmount;

  function handleOpenPayment() {
    if (items.length === 0) return;
    if (!storeStatus?.isOpen) return;
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

    // Generate a queue position from today's order count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());
    const queuePosition = (count ?? 0) + 1;

    const itemCount = items.length;
    const etaMin = estimateWaitMinutes('Order Received', itemCount);

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user?.id,
        queue_position: queuePosition,
        status: 'Order Received',
        pickup_method: fulfill,
        estimated_eta_min: etaMin,
        total_price: total,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      setLoading(false);
      Alert.alert('Order failed', orderError?.message ?? 'Could not place your order. Please try again.');
      return;
    }

    // Insert order items
    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.qty,
        unit_price: item.price,
        customizations: { size: item.size, milk: item.milk, addOns: item.addOns },
      }))
    );

    if (itemsError) {
      setLoading(false);
      Alert.alert('Order failed', itemsError.message);
      return;
    }

    setLoading(false);
    clear();
    router.replace({
      pathname: '/(customer)/order-confirmation' as any,
      params: { queueNum: queuePosition.toString(), itemCount: itemCount.toString(), total: total.toString() },
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

      {statusLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : !storeStatus?.isOpen ? (
        <View style={styles.centered}>
          <Ionicons name="storefront-outline" size={48} color={colors.textDisabled} />
          <Text style={styles.closedTitle}>StarBrew Cafe is closed</Text>
          <Text style={styles.closedText}>
            We're not accepting orders right now. Please check back later.
          </Text>
          <TouchableOpacity
            style={styles.closedBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.closedBtnText}>Back to Cart</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>How do you want it?</Text>
        <View style={[styles.toggleCard, cardShadow]}>
          {(['in-store', 'drive-thru'] as FulfillType[]).map(opt => {
            const enabled = opt === 'in-store' ? storeStatus.pickupEnabled : storeStatus.deliveryEnabled;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.toggleBtn, fulfill === opt && styles.toggleBtnActive, !enabled && styles.toggleBtnDisabled]}
                onPress={() => enabled && setFulfill(opt)}
                activeOpacity={0.85}
                disabled={!enabled}
              >
                <Ionicons
                  name={opt === 'in-store' ? 'storefront-outline' : 'car-outline'}
                  size={18}
                  color={fulfill === opt ? colors.textInverse : colors.textSecondary}
                />
                <Text style={[styles.toggleBtnText, fulfill === opt && styles.toggleBtnTextActive]}>
                  {opt === 'in-store' ? 'In-Store' : 'Drive-Thru'}{!enabled ? ' (Unavailable)' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
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
                    {item.size && item.milk ? `${item.size} · ${item.milk} · ` : ''}Qty {item.qty}
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
          {TIP_PRESETS.map(t => {
            const active = tipMode === 'preset' && tipPreset === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tipBtn, active && styles.tipBtnActive]}
                onPress={() => { setTipMode('preset'); setTipPreset(t); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipBtnText, active && styles.tipBtnTextActive]}>
                  {t === 0 ? 'None' : `₱${t}`}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.tipBtn, tipMode === 'custom' && styles.tipBtnActive]}
            onPress={() => setTipMode('custom')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tipBtnText, tipMode === 'custom' && styles.tipBtnTextActive]}>
              Custom
            </Text>
          </TouchableOpacity>
        </View>
        {tipMode === 'custom' && (
          <View style={[styles.customTipRow, cardShadow]}>
            <Text style={styles.customTipPeso}>₱</Text>
            <TextInput
              style={styles.customTipInput}
              keyboardType="number-pad"
              placeholder="Enter tip amount"
              placeholderTextColor={colors.textDisabled}
              value={customTip}
              onChangeText={setCustomTip}
            />
          </View>
        )}

        <Text style={styles.sectionLabel}>Payment</Text>
        <View style={[styles.card, cardShadow]}>
          {(['gcash', 'cash'] as PaymentMethod[]).map((pm, idx) => (
            <View key={pm}>
              <TouchableOpacity
                style={styles.paymentRow}
                onPress={() => setPaymentMethod(pm)}
                activeOpacity={0.7}
              >
                <View style={styles.paymentLeft}>
                  <Ionicons
                    name={pm === 'gcash' ? 'phone-portrait-outline' : 'cash-outline'}
                    size={20}
                    color={colors.brandSecondary}
                  />
                  <Text style={styles.paymentLabel}>
                    {pm === 'gcash' ? 'GCash · Mock Payment' : 'Cash · Mock Payment'}
                  </Text>
                </View>
                <View style={[styles.radioCircle, paymentMethod === pm && styles.radioCircleActive]}>
                  {paymentMethod === pm && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
              {idx === 0 && <View style={styles.divider} />}
            </View>
          ))}
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
              <Text style={styles.summaryLabel}>Tip</Text>
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
      )}

      {!statusLoading && storeStatus?.isOpen && (
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
      )}

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
              This is a simulated {paymentMethod === 'gcash' ? 'GCash' : 'Cash'} payment for demo purposes. No real money is charged.
            </Text>
            <Text style={styles.modalAmount}>₱{total}.00</Text>

            <TouchableOpacity
              style={styles.modalSuccessBtn}
              onPress={() => handlePaymentResult(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.textInverse} />
              <Text style={styles.modalSuccessBtnText}>Successful Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalFailBtn}
              onPress={() => handlePaymentResult(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.statusError} />
              <Text style={styles.modalFailBtnText}>Failed Payment</Text>
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
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Sp[3], paddingHorizontal: Sp[6] },
    closedTitle: { fontSize: FS.headingMd, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
    closedText: { fontSize: FS.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    closedBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md,
      paddingHorizontal: Sp[5], paddingVertical: 12, marginTop: Sp[2],
    },
    closedBtnText: { fontSize: FS.body, fontWeight: '700', color: colors.textInverse },
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
    toggleBtnDisabled: { opacity: 0.4 },
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
    customTipRow: {
      flexDirection: 'row', alignItems: 'center', gap: Sp[2],
      backgroundColor: colors.bgSurface, borderRadius: R.lg,
      paddingHorizontal: Sp[4], paddingVertical: Sp[1], marginTop: Sp[3],
    },
    customTipPeso: { fontSize: FS.bodyLg, fontWeight: '700', color: colors.brandSecondary },
    customTipInput: {
      flex: 1, fontSize: FS.body, color: colors.textPrimary, paddingVertical: Sp[3],
    },
    paymentRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Sp[4],
    },
    paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: Sp[3] },
    paymentLabel: { fontSize: FS.body, color: colors.textPrimary, fontWeight: '500' },
    radioCircle: {
      width: 20, height: 20, borderRadius: R.full, borderWidth: 2,
      borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },
    radioCircleActive: { borderColor: colors.brandPrimary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brandPrimary },
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
