import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type NotifType = 'order' | 'reward' | 'promo';

type Notif = {
  id: string; type: NotifType;
  title: string; message: string;
  time: string; read: boolean;
};

const NOTIFS: Notif[] = [
  { id: '1', type: 'order',  title: 'Order Ready!',      message: 'Your Cold Brew is ready for pick-up. Queue #12.',          time: '2 min ago',  read: false },
  { id: '2', type: 'reward', title: 'Stars Earned',       message: 'You earned 12 stars from your last order.',                 time: '1 hr ago',   read: false },
  { id: '3', type: 'promo',  title: 'Happy Hour ☕',      message: 'Get 20% off all iced drinks today from 2 PM – 4 PM.',      time: 'Yesterday',  read: true },
  { id: '4', type: 'order',  title: 'Order Confirmed',    message: 'Your order #SB-2047 has been received and is being prepared.', time: 'Yesterday', read: true },
];

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const TYPE_ICON: Record<NotifType, keyof typeof Ionicons.glyphMap> = {
    order: 'cafe-outline', reward: 'star-outline', promo: 'pricetag-outline',
  };
  const TYPE_COLOR: Record<NotifType, string> = {
    order: colors.brandPrimary, reward: colors.statusWarning, promo: colors.statusInfo,
  };
  const TYPE_BG: Record<NotifType, string> = {
    order: colors.bgSubtle, reward: colors.statusWarningBg, promo: colors.statusInfoBg,
  };

  const unread = NOTIFS.filter(n => !n.read).length;

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {unread > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>{unread} unread</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {NOTIFS.map(notif => (
          <TouchableOpacity
            key={notif.id}
            style={[styles.notifCard, cardShadow, notif.read && styles.notifCardRead]}
            activeOpacity={0.8}
          >
            <View style={[styles.notifIcon, { backgroundColor: TYPE_BG[notif.type] }]}>
              <Ionicons name={TYPE_ICON[notif.type]} size={20} color={TYPE_COLOR[notif.type]} />
            </View>
            <View style={styles.notifContent}>
              <View style={styles.notifHeader}>
                <Text style={[styles.notifTitle, notif.read && styles.notifTitleRead]}>
                  {notif.title}
                </Text>
                <Text style={styles.notifTime}>{notif.time}</Text>
              </View>
              <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
            </View>
            {!notif.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
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
    markAllText: { fontSize: FS.label, color: colors.brandSecondary, fontWeight: '600' },
    unreadBanner: { marginHorizontal: Sp[5], marginBottom: Sp[2] },
    unreadText: { fontSize: FS.caption, color: colors.textSecondary, fontWeight: '500' },
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
