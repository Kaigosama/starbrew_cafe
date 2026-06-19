import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow, cardShadowMd } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

type FeaturedItem = { id: string; name: string; price: number };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const LOGO = isDark
    ? require('../../assets/starbrew-logo_dark.png')
    : require('../../assets/starbrew-logo_light.png');

  const user = useAuthStore((s) => s.user);
  const firstName = user?.user_metadata?.firstName as string | undefined;

  const [featured, setFeatured] = useState<FeaturedItem[]>([]);

  useEffect(() => {
    supabase
      .from('menu_items')
      .select('id, name, base_price')
      .eq('is_available', true)
      .limit(2)
      .then(({ data, error }) => {
        if (error) console.error('featured fetch error:', error.message);
        if (data) {
          setFeatured(data.map(d => ({ id: String(d.id), name: d.name, price: d.base_price })));
        }
      });
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
            <View>
              <Text style={styles.headerTitle}>
                {getGreeting()}{firstName ? `, ${firstName}` : ''}!
              </Text>
              <Text style={styles.headerSub}>It's a great day for coffee</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(customer)/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>StarBrew Info</Text>
        <View style={[styles.infoCard, cardShadow]}>
          <View style={styles.infoCardInner}>
            <View style={styles.infoIconBg}>
              <Ionicons name="storefront-outline" size={24} color={colors.brandPrimary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>StarBrew Cafe Makati</Text>
              <Text style={styles.infoDetail}>Open · Closes 10 PM</Text>
              <Text style={styles.infoDetail}>Ayala Ave, Makati City</Text>
            </View>
          </View>
        </View>

        {featured.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Featured drinks</Text>
            <View style={styles.featuredRow}>
              {featured.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.featuredCard, cardShadowMd]}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/(customer)/item-detail' as any,
                      params: { id: item.id, name: item.name, price: item.price.toString() },
                    })
                  }
                >
                  <View style={styles.featuredImgPlaceholder} />
                  <Text style={styles.featuredName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.featuredPrice}>₱{item.price}.00</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.menuCta, cardShadow]}
          onPress={() => router.push('/(customer)/menu' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="cafe-outline" size={22} color={colors.textInverse} />
          <Text style={styles.menuCtaText}>Browse full menu</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
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
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Sp[3] },
    headerLogo: { width: 40, height: 40 },
    headerTitle: { fontSize: FS.headingMd, fontWeight: '700', color: colors.textPrimary },
    headerSub: { fontSize: FS.caption, color: colors.textSecondary, marginTop: 1 },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    sectionLabel: {
      fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary,
      marginTop: Sp[5], marginBottom: Sp[3],
    },
    infoCard: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4],
    },
    infoCardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: Sp[3] },
    infoIconBg: {
      width: 44, height: 44, borderRadius: R.md, backgroundColor: colors.bgSubtle,
      alignItems: 'center', justifyContent: 'center',
    },
    infoText: { flex: 1, gap: 4 },
    infoTitle: { fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary },
    infoDetail: { fontSize: FS.caption, color: colors.textSecondary, lineHeight: 18 },
    featuredRow: { flexDirection: 'row', gap: Sp[3] },
    featuredCard: {
      flex: 1, backgroundColor: colors.bgSurface, borderRadius: R.lg,
      overflow: 'hidden', paddingBottom: Sp[3],
    },
    featuredImgPlaceholder: { height: 120, backgroundColor: colors.bgSubtle },
    featuredName: {
      fontSize: FS.label, fontWeight: '600', color: colors.textPrimary,
      paddingHorizontal: Sp[3], marginTop: Sp[2], marginBottom: 2, lineHeight: 18,
    },
    featuredPrice: {
      fontSize: FS.label, fontWeight: '700', color: colors.brandSecondary,
      paddingHorizontal: Sp[3],
    },
    menuCta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Sp[3], backgroundColor: colors.brandPrimary, borderRadius: R.lg,
      padding: Sp[4], marginTop: Sp[5],
    },
    menuCtaText: { flex: 1, fontSize: FS.bodyLg, fontWeight: '700', color: colors.textInverse },
  });
}
