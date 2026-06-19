import { useMemo } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

type Row = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress?: () => void;
};
type Section = { title: string; rows: Row[] };

export default function AccountScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);

  const firstName = (user?.user_metadata?.firstName as string) ?? '';
  const lastName = (user?.user_metadata?.lastName as string) ?? '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'My Account';
  const email = user?.email ?? '';

  const SECTIONS: Section[] = [
    {
      title: 'Orders',
      rows: [
        { label: 'My Orders', icon: 'receipt-outline', onPress: () => router.push('/(customer)/order-history' as any) },
      ],
    },
    {
      title: 'Account',
      rows: [
        { label: 'Edit Profile',    icon: 'person-outline' },
        { label: 'Saved Addresses', icon: 'location-outline' },
        { label: 'Notifications',   icon: 'notifications-outline', onPress: () => router.push('/(customer)/notifications' as any) },
      ],
    },
    {
      title: 'Support',
      rows: [
        { label: 'About StarBrew Cafe', icon: 'information-circle-outline' },
        { label: 'Terms & Conditions',  icon: 'document-text-outline' },
        { label: 'Privacy Policy',      icon: 'shield-outline' },
      ],
    },
  ];

  async function handleSignOut() {
    setSession(null);
    router.replace('/(auth)/login');
    await supabase.auth.signOut().catch(() => {});
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.profileCard, cardShadow]}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.brandMuted} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
        </View>

        {SECTIONS.map(section => (
          <View key={section.title} style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={[styles.sectionCard, cardShadow]}>
              {section.rows.map((row, idx) => (
                <View key={row.label}>
                  <TouchableOpacity
                    style={styles.menuRow}
                    onPress={row.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuRowLeft}>
                      <View style={styles.menuIconWrap}>
                        <Ionicons name={row.icon} size={18} color={row.color ?? colors.brandSecondary} />
                      </View>
                      <Text style={[styles.menuRowText, row.color && { color: row.color }]}>
                        {row.label}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                  </TouchableOpacity>
                  {idx < section.rows.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={[styles.sectionCard, cardShadow]}>
            <View style={styles.menuRow}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny-outline'}
                    size={18}
                    color={colors.brandSecondary}
                  />
                </View>
                <Text style={styles.menuRowText}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.brandPrimary }}
                thumbColor={colors.bgSurface}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.statusError} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    headerArea: { backgroundColor: colors.bgBase },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Sp[5], paddingVertical: Sp[3],
    },
    headerTitle: { fontSize: FS.headingLg, fontWeight: '800', color: colors.textPrimary },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    profileCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4],
      flexDirection: 'row', alignItems: 'center', gap: Sp[3], marginBottom: Sp[5],
    },
    avatarWrap: {},
    avatar: {
      width: 56, height: 56, borderRadius: R.full, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center',
    },
    profileInfo: { flex: 1 },
    profileName: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
    profileEmail: { fontSize: FS.caption, color: colors.textSecondary },
    sectionGroup: { marginBottom: Sp[4] },
    sectionTitle: {
      fontSize: FS.overline, fontWeight: '700', color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Sp[2],
    },
    sectionCard: { backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4] },
    menuRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: Sp[3] + 2,
    },
    menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Sp[3] },
    menuIconWrap: {
      width: 32, height: 32, borderRadius: R.sm, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center',
    },
    menuRowText: { fontSize: FS.body, color: colors.textPrimary, fontWeight: '500' },
    divider: { height: 1, backgroundColor: colors.bgSubtle },
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Sp[2], paddingVertical: Sp[4], marginTop: Sp[2],
    },
    logoutText: { fontSize: FS.body, color: colors.statusError, fontWeight: '600' },
  });
}
