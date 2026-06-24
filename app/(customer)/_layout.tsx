import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FS, Sp } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { registerForPushNotificationsAsync } from '../../lib/push';

const TABS = [
  { name: 'index',    label: 'Home',     icon: 'home' as const,         outline: 'home-outline' as const },
  { name: 'menu',     label: 'Menu',     icon: 'cafe' as const,         outline: 'cafe-outline' as const },
  { name: 'activity', label: 'Activity', icon: 'receipt' as const,      outline: 'receipt-outline' as const },
  { name: 'account',  label: 'Account',  icon: 'person' as const,       outline: 'person-outline' as const },
];

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[
      styles.bar,
      {
        paddingBottom: Math.max(insets.bottom, 8),
        backgroundColor: colors.bgSurface,
        borderTopColor: colors.border,
      },
    ]}>
      {TABS.map(tab => {
        const idx = state.routes.findIndex((r: any) => r.name === tab.name);
        if (idx === -1) return null;
        const active = state.index === idx;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: state.routes[idx].key,
                canPreventDefault: true,
              });
              if (!active && !event.defaultPrevented) navigation.navigate(tab.name);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={active ? tab.icon : tab.outline}
              size={22}
              color={active ? colors.brandPrimary : colors.textSecondary}
            />
            <Text style={[
              styles.label,
              { color: active ? colors.brandPrimary : colors.textSecondary },
              active && styles.labelActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function CustomerLayout() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    registerForPushNotificationsAsync(user.id).catch((e) =>
      console.error('push registration error:', e)
    );
  }, [user]);

  return (
    <Tabs
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
      backBehavior="history"
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="account" />
      <Tabs.Screen name="cart"               options={{ href: null }} />
      <Tabs.Screen name="item-detail"        options={{ href: null }} />
      <Tabs.Screen name="checkout"           options={{ href: null }} />
      <Tabs.Screen name="order-confirmation" options={{ href: null }} />
      <Tabs.Screen name="order-status"       options={{ href: null }} />
      <Tabs.Screen name="order-history"      options={{ href: null }} />
      <Tabs.Screen name="notifications"      options={{ href: null }} />
      <Tabs.Screen name="edit-profile"       options={{ href: null }} />
      <Tabs.Screen name="legal"              options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Sp[2] + 2,
    paddingBottom: Sp[2],
    gap: 3,
  },
  label: {
    fontSize: FS.overline,
    fontWeight: '500',
  },
  labelActive: { fontWeight: '600' },
});
