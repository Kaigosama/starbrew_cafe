import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

type Customizations = { size?: string; milk?: string; addOns?: string[] } | null;
type OrderItemRow = {
  quantity: number;
  unit_price: number;
  customizations: Customizations;
  menu_items: { name: string } | null;
};
type Order = {
  id: string;
  queue_position: number;
  status: string;
  pickup_method: string;
  total_price: number;
  created_at: string;
  order_items: OrderItemRow[];
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) +
    '  ·  ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

function itemSubtitle(item: OrderItemRow) {
  const parts = [item.customizations?.size, item.customizations?.milk].filter(Boolean);
  return parts.length ? `${parts.join(' · ')} · Qty ${item.quantity}` : `Qty ${item.quantity}`;
}

export default function OrderDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, queue_position, status, pickup_method, total_price, created_at, order_items(quantity, unit_price, customizations, menu_items(name))')
        .eq('customer_id', user.id)
        .eq('id', id)
        .maybeSingle();
      if (error) console.error('order-detail fetch error:', error.message);
      setOrder(data as unknown as Order | null);
      setLoading(false);
    })();
  }, [user, id]);

  const isCancelled = order?.status === 'Cancelled Remake In Progress';

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : !order ? (
        <View style={styles.centered}>
          <Ionicons name="receipt-outline" size={40} color={colors.textDisabled} />
          <Text style={styles.emptyText}>Order not found</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={[styles.statusCard, cardShadow]}>
            <Ionicons
              name={isCancelled ? 'close-circle' : 'checkmark-circle'}
              size={36}
              color={isCancelled ? colors.statusError : colors.statusSuccess}
            />
            <Text style={styles.statusTitle}>{isCancelled ? 'Order Cancelled' : 'Order Completed'}</Text>
            <Text style={styles.statusMeta}>{formatDateTime(order.created_at)}</Text>
          </View>

          <Text style={styles.sectionLabel}>Order Info</Text>
          <View style={[styles.infoCard, cardShadow]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Queue</Text>
              <Text style={styles.infoValue}>#{order.queue_position}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fulfillment</Text>
              <Text style={styles.infoValue}>
                {order.pickup_method === 'in-store' ? 'In-Store' : 'Drive-Thru'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Items</Text>
          <View style={[styles.itemsCard, cardShadow]}>
            {(order.order_items ?? []).map((item, idx) => (
              <View key={idx}>
                <View style={styles.itemRow}>
                  <View style={styles.itemImg}>
                    <Ionicons name="cafe-outline" size={18} color={colors.brandMuted} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.menu_items?.name ?? 'Item'}
                    </Text>
                    <Text style={styles.itemQty}>{itemSubtitle(item)}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₱{item.unit_price * item.quantity}.00</Text>
                </View>
                {idx < order.order_items.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <View style={[styles.totalCard, cardShadow]}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₱{order.total_price}.00</Text>
          </View>
        </ScrollView>
      )}
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
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Sp[3] },
    emptyText: { fontSize: FS.body, color: colors.textSecondary },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    statusCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[5],
      alignItems: 'center', gap: Sp[2], marginBottom: Sp[5],
    },
    statusTitle: { fontSize: FS.headingMd, fontWeight: '700', color: colors.textPrimary },
    statusMeta: { fontSize: FS.caption, color: colors.textSecondary },
    sectionLabel: {
      fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary, marginBottom: Sp[3],
    },
    infoCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4], marginBottom: Sp[5],
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Sp[3] },
    infoLabel: { fontSize: FS.body, color: colors.textSecondary },
    infoValue: { fontSize: FS.body, fontWeight: '600', color: colors.textPrimary },
    itemsCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4], marginBottom: Sp[5],
    },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: Sp[3], paddingVertical: Sp[3] + 1 },
    itemImg: {
      width: 40, height: 40, borderRadius: R.md, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    itemInfo: { flex: 1 },
    itemName: { fontSize: FS.label, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    itemQty: { fontSize: FS.caption, color: colors.textSecondary },
    itemPrice: { fontSize: FS.label, fontWeight: '700', color: colors.brandSecondary, flexShrink: 0 },
    divider: { height: 1, backgroundColor: colors.bgSubtle },
    totalCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4],
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    totalLabel: { fontSize: FS.bodyLg, fontWeight: '600', color: colors.textPrimary },
    totalValue: { fontSize: FS.headingMd, fontWeight: '800', color: colors.brandPrimary },
  });
}
