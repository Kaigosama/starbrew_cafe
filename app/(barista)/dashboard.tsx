import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

type OrderStatus = 'received' | 'crafting' | 'ready' | 'completed';
type FulfillType = 'pickup' | 'delivery';

type Order = {
  id: string;
  queue_num: number;
  customer_name: string;
  items: string;
  status: OrderStatus;
  fulfill: FulfillType;
  created_at: string;
};

const STATUS_CONFIG: Record<OrderStatus, {
  label: string; color: string; bg: string; action?: string; next?: OrderStatus;
}> = {
  received:  { label: 'Received',    color: '#3A6B8A', bg: 'rgba(58,107,138,0.10)', action: 'Start Crafting', next: 'crafting' },
  crafting:  { label: 'In Progress', color: '#C48A2F', bg: 'rgba(196,138,47,0.12)', action: 'Mark Ready',     next: 'ready' },
  ready:     { label: 'Ready',       color: '#4A7C59', bg: 'rgba(74,124,89,0.10)',  action: 'Finish',         next: 'completed' },
  completed: { label: 'Completed',   color: '#B0A099', bg: 'rgba(176,160,153,0.1)' },
};

const FALLBACK_ORDERS: Order[] = [
  { id: '1', queue_num: 12, customer_name: 'Maria S.', items: 'Cold Brew · Grande',            status: 'received', fulfill: 'pickup',   created_at: new Date().toISOString() },
  { id: '2', queue_num: 11, customer_name: 'James R.', items: 'Vanilla Latte · Venti',          status: 'crafting', fulfill: 'delivery', created_at: new Date().toISOString() },
  { id: '3', queue_num: 10, customer_name: 'Ana P.',   items: 'Caramel Frappuccino · Grande',   status: 'ready',    fulfill: 'pickup',   created_at: new Date().toISOString() },
];

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff === 1) return '1 min';
  return `${diff} min`;
}

export default function BaristaDashboard() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [orders, setOrders] = useState<Order[]>(FALLBACK_ORDERS);
  const [showCompleted, setShowCompleted] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true });

      if (data && !error && isMounted) {
        setOrders(data as Order[]);
        setRealtimeConnected(true);
      }
    }

    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [...prev, payload.new as Order]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function advanceOrder(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const next = STATUS_CONFIG[order.status].next;
    if (!next) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: next } : o))
    );

    // Persist to Supabase (no-op if table doesn't exist yet)
    await supabase.from('orders').update({ status: next }).eq('id', id);
  }

  const active = orders.filter((o) => o.status !== 'completed');
  const completed = orders.filter((o) => o.status === 'completed');

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Orders</Text>
            <Text style={styles.headerSub}>Oldest orders at the top</Text>
          </View>
          <View style={styles.headerRight}>
            {realtimeConnected && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {active.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.textDisabled} />
            <Text style={styles.emptyText}>All caught up!</Text>
          </View>
        )}

        {active.map(order => {
          const cfg = STATUS_CONFIG[order.status];
          return (
            <View key={order.id} style={[styles.orderCard, cardShadow]}>
              <View style={styles.cardTop}>
                <View style={styles.customerCol}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={18} color={colors.brandMuted} />
                  </View>
                  <Text style={styles.queueNum}>#{order.queue_num}</Text>
                  <Text style={styles.customerName} numberOfLines={1}>{order.customer_name}</Text>
                </View>

                <View style={styles.detailsCol}>
                  <Text style={styles.itemsText} numberOfLines={2}>{order.items}</Text>
                  <View style={styles.fulfillRow}>
                    <Ionicons
                      name={order.fulfill === 'pickup' ? 'storefront-outline' : 'bicycle-outline'}
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.fulfillText}>
                      {order.fulfill === 'pickup' ? 'Pick-up' : 'Delivery'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionCol}>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  {cfg.action && (
                    <TouchableOpacity
                      style={[styles.actionBtn, order.status === 'ready' && styles.actionBtnReady]}
                      onPress={() => advanceOrder(order.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.actionBtnText}>{cfg.action}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Ionicons name="time-outline" size={12} color={colors.textDisabled} />
                <Text style={styles.timeAgo}>{timeAgo(order.created_at)} ago</Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.completedHeader}
          onPress={() => setShowCompleted(v => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.completedTitle}>Recently Completed ({completed.length})</Text>
          <Ionicons
            name={showCompleted ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {showCompleted && completed.map(order => (
          <View key={order.id} style={[styles.completedCard, cardShadow]}>
            <View style={styles.completedAvatar}>
              <Ionicons name="person" size={14} color={colors.brandMuted} />
            </View>
            <View style={styles.completedInfo}>
              <Text style={styles.completedName}>{order.customer_name}</Text>
              <Text style={styles.completedItems} numberOfLines={1}>{order.items}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.bgSubtle }]}>
              <Text style={[styles.statusText, { color: colors.textDisabled }]}>Done</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.qrFab}
        onPress={() => router.push('/(barista)/qr-scanner' as any)}
        activeOpacity={0.9}
      >
        <Ionicons name="qr-code-outline" size={22} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    headerArea: { backgroundColor: colors.bgBase },
    headerRow: {
      flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
      paddingHorizontal: Sp[5], paddingVertical: Sp[3],
    },
    headerTitle: { fontSize: FS.headingLg, fontWeight: '800', color: colors.textPrimary },
    headerSub: { fontSize: FS.caption, color: colors.textSecondary, marginTop: 2 },
    headerRight: { paddingTop: 4 },
    liveBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.statusSuccessBg, borderRadius: R.full,
      paddingHorizontal: Sp[3], paddingVertical: Sp[1] + 1,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.statusSuccess },
    liveText: { fontSize: FS.overline, color: colors.statusSuccess, fontWeight: '700' },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: 90 },
    empty: { alignItems: 'center', paddingTop: Sp[12], gap: Sp[3] },
    emptyText: { fontSize: FS.body, color: colors.textSecondary },
    orderCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4], marginBottom: Sp[3],
    },
    cardTop: { flexDirection: 'row', gap: Sp[3] },
    customerCol: { alignItems: 'center', width: 56 },
    avatar: {
      width: 40, height: 40, borderRadius: R.full, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center', marginBottom: 3,
    },
    queueNum: { fontSize: FS.overline, fontWeight: '700', color: colors.brandPrimary, letterSpacing: 0.2 },
    customerName: { fontSize: FS.overline, color: colors.textSecondary, textAlign: 'center' },
    detailsCol: { flex: 1 },
    itemsText: { fontSize: FS.body, fontWeight: '600', color: colors.textPrimary, marginBottom: Sp[2], lineHeight: 19 },
    fulfillRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    fulfillText: { fontSize: FS.caption, color: colors.textSecondary },
    actionCol: { alignItems: 'flex-end', gap: Sp[2] },
    statusBadge: { borderRadius: R.sm, paddingHorizontal: Sp[2], paddingVertical: 3 },
    statusText: { fontSize: FS.overline, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
    actionBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md,
      paddingHorizontal: Sp[3], paddingVertical: 7,
    },
    actionBtnReady: { backgroundColor: colors.statusSuccess },
    actionBtnText: { fontSize: FS.overline, fontWeight: '700', color: colors.textInverse, letterSpacing: 0.2 },
    cardFooter: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      marginTop: Sp[3], paddingTop: Sp[2], borderTopWidth: 1, borderTopColor: colors.bgSubtle,
    },
    timeAgo: { fontSize: FS.overline, color: colors.textDisabled },
    completedHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: Sp[3], marginBottom: Sp[2],
    },
    completedTitle: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textSecondary },
    completedCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[3] + 1,
      flexDirection: 'row', alignItems: 'center', gap: Sp[3], marginBottom: Sp[2], opacity: 0.75,
    },
    completedAvatar: {
      width: 32, height: 32, borderRadius: R.full, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center',
    },
    completedInfo: { flex: 1 },
    completedName: { fontSize: FS.label, fontWeight: '600', color: colors.textPrimary },
    completedItems: { fontSize: FS.caption, color: colors.textSecondary },
    qrFab: {
      position: 'absolute', bottom: 80, right: Sp[5], width: 52, height: 52,
      borderRadius: R.full, backgroundColor: colors.brandPrimary,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.brandPrimary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
  });
}
