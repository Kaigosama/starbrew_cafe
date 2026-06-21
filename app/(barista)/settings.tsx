import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function BaristaSettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const baristaName = (user?.user_metadata?.full_name as string) || user?.email || 'Barista';

  const [storeOpen, setStoreOpen] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);

  useEffect(() => {
    supabase
      .from('store_status')
      .select('is_open, pickup_enabled, delivery_enabled')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('store_status fetch error:', error.message);
          return;
        }
        if (data) {
          setStoreOpen(data.is_open);
          setPickupEnabled(data.pickup_enabled);
          setDeliveryEnabled(data.delivery_enabled);
        }
      });
  }, []);

  async function persistStoreStatus(next: { is_open?: boolean; pickup_enabled?: boolean; delivery_enabled?: boolean }) {
    const { error } = await supabase.from('store_status').update(next).eq('id', 1);
    if (error) console.error('store_status update error:', error.message);
  }

  function handleToggleStoreOpen(value: boolean) {
    setStoreOpen(value);
    // Closing the store automatically closes both order channels;
    // reopening restores them.
    setPickupEnabled(value);
    setDeliveryEnabled(value);
    persistStoreStatus({ is_open: value, pickup_enabled: value, delivery_enabled: value });
  }

  function handleTogglePickup(value: boolean) {
    setPickupEnabled(value);
    persistStoreStatus({ pickup_enabled: value });
  }

  function handleToggleDelivery(value: boolean) {
    setDeliveryEnabled(value);
    persistStoreStatus({ delivery_enabled: value });
  }

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
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.profileCard, cardShadow]}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.brandMuted} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{baristaName}</Text>
            <Text style={styles.profileRole}>StarBrew Cafe Makati</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(barista)/edit-profile')} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={18} color={colors.brandSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Store Status</Text>
        <View style={[styles.card, cardShadow]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <View style={[styles.switchIcon, { backgroundColor: storeOpen ? colors.statusSuccessBg : colors.statusErrorBg }]}>
                <Ionicons
                  name="storefront-outline"
                  size={18}
                  color={storeOpen ? colors.statusSuccess : colors.statusError}
                />
              </View>
              <View>
                <Text style={styles.switchLabel}>Store Open</Text>
                <Text style={styles.switchSub}>{storeOpen ? 'Accepting orders' : 'Closed for orders'}</Text>
              </View>
            </View>
            <Switch
              value={storeOpen}
              onValueChange={handleToggleStoreOpen}
              trackColor={{ false: colors.border, true: colors.statusSuccess }}
              thumbColor={colors.bgSurface}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <View style={styles.switchIcon}>
                <Ionicons name="storefront-outline" size={18} color={colors.brandSecondary} />
              </View>
              <Text style={[styles.switchLabel, !storeOpen && styles.switchLabelDisabled]}>In-Store Orders</Text>
            </View>
            <Switch
              value={pickupEnabled}
              onValueChange={handleTogglePickup}
              disabled={!storeOpen}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor={colors.bgSurface}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <View style={styles.switchIcon}>
                <Ionicons name="car-outline" size={18} color={colors.brandSecondary} />
              </View>
              <Text style={[styles.switchLabel, !storeOpen && styles.switchLabelDisabled]}>Drive-Thru Orders</Text>
            </View>
            <Switch
              value={deliveryEnabled}
              onValueChange={handleToggleDelivery}
              disabled={!storeOpen}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor={colors.bgSurface}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={[styles.card, cardShadow]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <View style={styles.switchIcon}>
                <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={18} color={colors.brandSecondary} />
              </View>
              <Text style={styles.switchLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor={colors.bgSurface}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>General</Text>
        <View style={[styles.card, cardShadow]}>
          {[
            { label: 'About StarBrew Cafe', icon: 'information-circle-outline' as const },
            { label: 'Terms & Conditions',  icon: 'document-text-outline' as const },
            { label: 'Privacy Policy',      icon: 'shield-outline' as const },
          ].map((row, idx, arr) => (
            <View key={row.label}>
              <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
                <View style={styles.menuRowLeft}>
                  <View style={styles.switchIcon}>
                    <Ionicons name={row.icon} size={18} color={colors.brandSecondary} />
                  </View>
                  <Text style={styles.menuRowText}>{row.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
              </TouchableOpacity>
              {idx < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.statusError} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
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
    profileCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4],
      flexDirection: 'row', alignItems: 'center', gap: Sp[3], marginBottom: Sp[5],
    },
    avatar: {
      width: 52, height: 52, borderRadius: R.full, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center',
    },
    profileInfo: { flex: 1 },
    profileName: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
    profileRole: { fontSize: FS.caption, color: colors.textSecondary },
    sectionTitle: {
      fontSize: FS.overline, fontWeight: '700', color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Sp[2],
    },
    card: { backgroundColor: colors.bgSurface, borderRadius: R.lg, paddingHorizontal: Sp[4], marginBottom: Sp[4] },
    switchRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Sp[3] + 1,
    },
    switchLeft: { flexDirection: 'row', alignItems: 'center', gap: Sp[3] },
    switchIcon: {
      width: 32, height: 32, borderRadius: R.sm, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center',
    },
    switchLabel: { fontSize: FS.body, fontWeight: '500', color: colors.textPrimary },
    switchLabelDisabled: { color: colors.textDisabled },
    switchSub: { fontSize: FS.caption, color: colors.textSecondary, marginTop: 1 },
    divider: { height: 1, backgroundColor: colors.bgSubtle },
    menuRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Sp[3] + 1,
    },
    menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Sp[3] },
    menuRowText: { fontSize: FS.body, fontWeight: '500', color: colors.textPrimary },
    signOutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Sp[2], paddingVertical: Sp[4], marginTop: Sp[2],
    },
    signOutText: { fontSize: FS.body, color: colors.statusError, fontWeight: '600' },
  });
}
