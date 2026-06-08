import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type Role = 'customer' | 'barista';

const ROLES: { id: Role; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'customer', label: 'Customer', desc: 'Browse the menu & place orders', icon: 'cafe-outline' },
  { id: 'barista',  label: 'Barista',  desc: 'Manage orders & the queue',     icon: 'person-outline' },
];

export default function RoleSelectScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selected, setSelected] = useState<Role | null>(null);

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>I am a…</Text>
          <Text style={styles.subtitle}>Choose your role to continue</Text>

          <View style={styles.cards}>
            {ROLES.map(role => {
              const active = selected === role.id;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => setSelected(role.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
                    <Ionicons
                      name={role.icon}
                      size={30}
                      color={active ? colors.textInverse : colors.brandPrimary}
                    />
                  </View>
                  <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>
                    {role.label}
                  </Text>
                  <Text style={[styles.roleDesc, active && styles.roleDescActive]}>
                    {role.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
            onPress={() =>
              selected &&
              router.push({ pathname: '/(auth)/signin', params: { role: selected } })
            }
            activeOpacity={0.85}
            disabled={!selected}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    safe: { flex: 1 },
    header: { paddingHorizontal: Sp[5], paddingTop: Sp[3], paddingBottom: Sp[2] },
    backBtn: { padding: Sp[1] },
    body: { flex: 1, paddingHorizontal: Sp[5], paddingTop: Sp[6] },
    title: {
      fontSize: FS.display,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: Sp[2],
    },
    subtitle: {
      fontSize: FS.body,
      color: colors.textSecondary,
      marginBottom: Sp[8],
      lineHeight: 20,
    },
    cards: { flexDirection: 'row', gap: Sp[3] },
    card: {
      flex: 1,
      backgroundColor: colors.bgSurface,
      borderRadius: R.lg,
      padding: Sp[5],
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      ...cardShadow,
    },
    cardActive: { borderColor: colors.brandPrimary, backgroundColor: colors.bgSubtle },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: R.full,
      backgroundColor: colors.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Sp[3],
    },
    iconCircleActive: { backgroundColor: colors.brandPrimary },
    roleLabel: {
      fontSize: FS.headingMd,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: Sp[1],
    },
    roleLabelActive: { color: colors.brandPrimary },
    roleDesc: {
      fontSize: FS.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 17,
    },
    roleDescActive: { color: colors.brandSecondary },
    footer: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    continueBtn: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    continueBtnDisabled: { opacity: 0.35 },
    continueBtnText: {
      color: colors.textInverse,
      fontSize: FS.bodyLg,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });
}
