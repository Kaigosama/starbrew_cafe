import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

type Notif = {
  id: string; type: string;
  title: string; message: string;
  created_at: string; is_read: boolean;
};

function timeAgo(iso: string) {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay} days ago`;
}

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);

  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    order: 'cafe-outline',
  };
  const TYPE_COLOR: Record<string, string> = {
    order: colors.brandPrimary,
  };
  const TYPE_BG: Record<string, string> = {
    order: colors.bgSubtle,
  };

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, created_at, is_read')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('notifications fetch error:', error.message);
    setNotifs((data ?? []) as Notif[]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    (async () => {
      setLoading(true);
      await fetchNotifs();
      if (isMounted) setLoading(false);
    })();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `customer_id=eq.${user.id}` },
        () => {
          if (isMounted) fetchNotifs();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifs]);

  const unread = notifs.filter(n => !n.is_read).length;

  async function handleMarkAllRead() {
    if (!user || unread === 0) return;
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('customer_id', user.id)
      .eq('is_read', false);
    if (error) {
      console.error('mark all read error:', error.message);
      fetchNotifs();
    }
  }

  async function handleNotifPress(notif: Notif) {
    if (notif.is_read) return;
    setNotifs(prev => prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n)));
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notif.id);
    if (error) console.error('mark read error:', error.message);
  }

  function handleDeleteAll() {
    if (!user || notifs.length === 0) return;
    Alert.alert(
      'Delete all notifications?',
      'This will permanently remove all your notifications. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setNotifs([]);
            const { error } = await supabase
              .from('notifications')
              .delete()
              .eq('customer_id', user.id);
            if (error) {
              console.error('delete all notifications error:', error.message);
              fetchNotifs();
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllRead} disabled={unread === 0}>
            <Text style={[styles.markAllText, unread === 0 && styles.markAllTextDisabled]}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {notifs.length > 0 && (
        <View style={styles.actionRow}>
          {unread > 0 && (
            <Text style={styles.unreadText}>{unread} unread</Text>
          )}
          <TouchableOpacity activeOpacity={0.7} onPress={handleDeleteAll} style={styles.deleteAllBtn}>
            <Ionicons name="trash-outline" size={14} color={colors.statusError} />
            <Text style={styles.deleteAllText}>Delete all</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : notifs.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-outline" size={40} color={colors.textDisabled} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {notifs.map(notif => {
            const icon = TYPE_ICON[notif.type] ?? 'notifications-outline';
            const color = TYPE_COLOR[notif.type] ?? colors.brandPrimary;
            const bg = TYPE_BG[notif.type] ?? colors.bgSubtle;
            return (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, cardShadow, notif.is_read && styles.notifCardRead]}
                activeOpacity={0.8}
                onPress={() => handleNotifPress(notif)}
              >
                <View style={[styles.notifIcon, { backgroundColor: bg }]}>
                  <Ionicons name={icon} size={20} color={color} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, notif.is_read && styles.notifTitleRead]}>
                      {notif.title}
                    </Text>
                    <Text style={styles.notifTime}>{timeAgo(notif.created_at)}</Text>
                  </View>
                  <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                </View>
                {!notif.is_read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })}
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
    markAllText: { fontSize: FS.label, color: colors.brandSecondary, fontWeight: '600' },
    markAllTextDisabled: { color: colors.textDisabled },
    actionRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginHorizontal: Sp[5], marginBottom: Sp[2],
    },
    unreadText: { fontSize: FS.caption, color: colors.textSecondary, fontWeight: '500' },
    deleteAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
    deleteAllText: { fontSize: FS.caption, color: colors.statusError, fontWeight: '600' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Sp[3] },
    emptyText: { fontSize: FS.body, color: colors.textSecondary },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    notifCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4],
      flexDirection: 'row', alignItems: 'flex-start', gap: Sp[3],
      marginBottom: Sp[3], position: 'relative',
    },
    notifCardRead: { opacity: 0.7 },
    notifIcon: { width: 44, height: 44, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    notifContent: { flex: 1 },
    notifHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4,
    },
    notifTitle: { fontSize: FS.body, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: Sp[2] },
    notifTitleRead: { fontWeight: '500' },
    notifTime: { fontSize: FS.caption, color: colors.textDisabled, flexShrink: 0 },
    notifMessage: { fontSize: FS.caption, color: colors.textSecondary, lineHeight: 18 },
    unreadDot: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brandPrimary,
      position: 'absolute', top: Sp[4], right: Sp[4],
    },
  });
}
