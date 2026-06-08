import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FS, Sp } from '../../constants/theme';

const TABS = [
  { name: 'dashboard', label: 'Orders',   icon: 'list' as const,      outline: 'list-outline' as const },
  { name: 'stats',     label: 'Stats',    icon: 'bar-chart' as const, outline: 'bar-chart-outline' as const },
  { name: 'settings',  label: 'Settings', icon: 'settings' as const,  outline: 'settings-outline' as const },
];

function BaristaTabBar({ state, navigation }: any) {
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

export default function BaristaLayout() {
  return (
    <Tabs
      tabBar={props => <BaristaTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="settings" />
      <Tabs.Screen name="qr-scanner" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1 },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: Sp[2] + 2, paddingBottom: Sp[2], gap: 3,
  },
  label: { fontSize: FS.overline, fontWeight: '500' },
  labelActive: { fontWeight: '600' },
});
