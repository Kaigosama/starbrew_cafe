import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

type OrderCustomizations = {
  size?: string;
  milk?: string;
  addOns?: string[];
  temperature?: 'Hot' | 'Cold' | null;
} | null;

type OrderItemRow = {
  quantity: number;
  unit_price: number;
  menu_item_id: number;
  customizations: OrderCustomizations;
  menu_items: { name: string; image_url: string | null } | null;
};
type Order = {
  id: string;
  queue_position: number;
  status: string;
  total_price: number;
  estimated_eta_min: number;
  created_at: string;
  order_items: OrderItemRow[];
};

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  'Order Received':   { text: 'Received',    color: '#3A6B8A', bg: 'rgba(58,107,138,0.10)' },
  'Crafting':          { text: 'In Progress', color: '#C48A2F', bg: 'rgba(196,138,47,0.12)' },
  'Ready for Pickup':  { text: 'Ready',       color: '#4A7C59', bg: 'rgba(74,124,89,0.10)' },
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) +
    '  ·  ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

function orderDisplayName(items: OrderItemRow[]) {
  if (!items || items.length === 0) return 'Order';
  const first = items[0]?.menu_items?.name ?? 'Item';
  if (items.length === 1) return first;
  return `${first} +${items.length - 1} more`;
}

export default function ActivityScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clear);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    // Most recent non-completed order
    const { data: active, error: activeError } = await supabase
      .from('orders')
      .select('id, queue_position, status, total_price, estimated_eta_min, created_at, order_items(quantity, unit_price, menu_item_id, customizations, menu_items(name, image_url))')
      .eq('customer_id', user.id)
      .neq('status', 'Picked Up')
      .neq('status', 'Cancelled Remake In Progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (activeError) console.error('activity active order error:', activeError.message);

    // Recent completed or cancelled orders
    const { data: recent, error: recentError } = await supabase
      .from('orders')
      .select('id, queue_position, status, total_price, estimated_eta_min, created_at, order_items(quantity, unit_price, menu_item_id, customizations, menu_items(name, image_url))')
      .eq('customer_id', user.id)
      .in('status', ['Picked Up', 'Cancelled Remake In Progress'])
      .order('created_at', { ascending: false })
      .limit(5);
    if (recentError) console.error('activity recent orders error:', recentError.message);

    setActiveOrder(active as Order | null);
    setRecentOrders((recent ?? []) as Order[]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    (async () => {
      setLoading(true);
      await fetchOrders();
      if (isMounted) setLoading(false);
    })();

    const channel = supabase
      .channel(`activity-orders-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
        () => {
          if (isMounted) fetchOrders();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);

  function handleReorder(order: Order) {
    clearCart();
    order.order_items.forEach(oi => {
      const c = oi.customizations ?? {};
      for (let i = 0; i < oi.quantity; i++) {
        addItem({
          id: String(oi.menu_item_id),
          menuItemId: oi.menu_item_id,
          name: oi.menu_items?.name ?? 'Item',
          price: oi.unit_price,
          size: c.size ?? '',
          milk: c.milk ?? '',
          addOns: c.addOns ?? [],
          imageUrl: oi.menu_items?.image_url ?? null,
          temperature: c.temperature ?? null,
        });
      }
    });
    router.push('/(customer)/checkout' as any);
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Activity</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.brandPrimary} size="large" />
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>My Order</Text>
            {activeOrder ? (
              <TouchableOpacity
                style={[styles.orderCard, cardShadow]}
                onPress={() => router.push({ pathname: '/(customer)/order-status' as any, params: { id: activeOrder.id } })}
                activeOpacity={0.85}
              >
                <View style={styles.orderCardTop}>
                  <View style={styles.orderImgPlaceholder}>
                    <Ionicons name="cafe-outline" size={28} color={colors.brandMuted} />
                  </View>
                  <View style={styles.orderCardInfo}>
                    <Text style={styles.orderCardDrink} numberOfLines={1}>
                      {orderDisplayName(activeOrder.order_items)}
                    </Text>
                    <Text style={styles.orderCardLocation}>StarBrew Cafe Makati</Text>
                    {STATUS_LABEL[activeOrder.status] && (
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_LABEL[activeOrder.status].bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_LABEL[activeOrder.status].color }]} />
                        <Text style={[styles.statusText, { color: STATUS_LABEL[activeOrder.status].color }]}>
                          {STATUS_LABEL[activeOrder.status].text}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.orderCardPrice}>₱{activeOrder.total_price}.00</Text>
                </View>

                <View style={styles.orderCardDivider} />

                <View style={styles.orderCardFooter}>
                  <View style={styles.footerTile}>
                    <Ionicons name="list-outline" size={18} color={colors.brandPrimary} />
                    <Text style={styles.footerTileLabel} numberOfLines={1}>Queue Number</Text>
                    <Text style={styles.footerTileValue} numberOfLines={1}>#{activeOrder.queue_position}</Text>
                  </View>
                  <View style={styles.footerTileSep} />
                  <View style={styles.footerTile}>
                    <Ionicons name="time-outline" size={18} color={colors.brandPrimary} />
                    <Text style={styles.footerTileLabel} numberOfLines={1}>Estimated Time</Text>
                    <Text style={styles.footerTileValue} numberOfLines={1}>
                      {activeOrder.estimated_eta_min} min
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.emptyOrderCard, cardShadow]}>
                <Ionicons name="cafe-outline" size={32} color={colors.textDisabled} />
                <Text style={styles.emptyOrderText}>No active orders</Text>
                <TouchableOpacity
                  style={styles.orderNowBtn}
                  onPress={() => router.push('/(customer)/menu' as any)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.orderNowText}>Order now</Text>
                </TouchableOpacity>
              </View>
            )}

            {recentOrders.length > 0 && (
              <>
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
                  {recentOrders.map((order, idx) => {
                    const isCancelled = order.status === 'Cancelled Remake In Progress';
                    return (
                      <View key={order.id}>
                        <TouchableOpacity
                          style={styles.recentRow}
                          onPress={() => router.push({ pathname: '/(customer)/order-detail' as any, params: { id: order.id } })}
                          activeOpacity={0.8}
                        >
                          <View style={styles.recentImg}>
                            <Ionicons name="cafe-outline" size={20} color={colors.brandMuted} />
                          </View>
                          <View style={styles.recentInfo}>
                            <View style={styles.recentNameRow}>
                              <Text style={styles.recentName} numberOfLines={1}>
                                {orderDisplayName(order.order_items)}
                              </Text>
                              {isCancelled && (
                                <View style={styles.recentCancelledBadge}>
                                  <Text style={styles.recentCancelledText}>Cancelled</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.recentDate} numberOfLines={1}>{formatDateTime(order.created_at)}</Text>
                            <TouchableOpacity
                              style={styles.reorderBtn}
                              activeOpacity={0.7}
                              onPress={() => handleReorder(order)}
                            >
                              <Text style={styles.reorderText}>Reorder</Text>
                              <Ionicons name="arrow-forward" size={12} color={colors.brandPrimary} />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.recentPrice} numberOfLines={1}>₱{order.total_price}.00</Text>
                        </TouchableOpacity>
                        {idx < recentOrders.length - 1 && <View style={styles.divider} />}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
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
    centered: { alignItems: 'center', paddingTop: Sp[12] },
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
    etaInline: { fontSize: FS.caption, color: colors.textSecondary, marginTop: 4 },
    statusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
      borderRadius: R.sm, paddingHorizontal: Sp[2], paddingVertical: 3,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: {
      fontSize: FS.overline, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3,
    },
    orderCardPrice: { fontSize: FS.headingSm, fontWeight: '700', color: colors.brandSecondary, flexShrink: 0 },
    orderCardDivider: { height: 1, backgroundColor: colors.bgSubtle },
    orderCardFooter: { flexDirection: 'row' },
    footerTile: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      gap: 4, paddingVertical: Sp[3], paddingHorizontal: Sp[2],
    },
    footerTileLabel: { fontSize: FS.caption, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
    footerTileValue: { fontSize: FS.label, fontWeight: '700', color: colors.brandPrimary, textAlign: 'center' },
    footerTileTrackRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerTileSep: { width: 1, backgroundColor: colors.bgSubtle },
    emptyOrderCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[6],
      alignItems: 'center', gap: Sp[3], marginBottom: Sp[5],
    },
    emptyOrderText: { fontSize: FS.body, color: colors.textSecondary },
    orderNowBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md,
      paddingHorizontal: Sp[5], paddingVertical: 10,
    },
    orderNowText: { fontSize: FS.label, fontWeight: '700', color: colors.textInverse },
    recentHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sp[3],
    },
    viewAllText: { fontSize: FS.label, color: colors.brandSecondary, fontWeight: '600' },
    recentCard: { backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4] },
    recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Sp[4], gap: Sp[3] },
    recentImg: {
      width: 48, height: 48, borderRadius: R.md, backgroundColor: colors.bgSubtle, flexShrink: 0,
      alignItems: 'center', justifyContent: 'center',
    },
    recentInfo: { flex: 1, minWidth: 0 },
    recentNameRow: { flexDirection: 'row', alignItems: 'center', gap: Sp[2] },
    recentName: { flexShrink: 1, fontSize: FS.label, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    recentCancelledBadge: {
      backgroundColor: colors.statusErrorBg, borderRadius: R.sm,
      paddingHorizontal: Sp[2], paddingVertical: 2, flexShrink: 0,
    },
    recentCancelledText: {
      fontSize: FS.overline, fontWeight: '700', color: colors.statusError,
      textTransform: 'uppercase', letterSpacing: 0.3,
    },
    recentDate: { fontSize: FS.caption, color: colors.textSecondary, marginBottom: Sp[2] },
    reorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    reorderText: { fontSize: FS.label, color: colors.brandPrimary, fontWeight: '600' },
    recentPrice: { fontSize: FS.label, fontWeight: '700', color: colors.textPrimary, flexShrink: 0 },
    divider: { height: 1, backgroundColor: colors.bgSubtle },
  });
}
