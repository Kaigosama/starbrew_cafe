import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type Mode = 'light' | 'dark';

const MODES: { id: Mode; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'light', label: 'Light Mode', desc: 'Bright & classic',  icon: 'sunny-outline' },
  { id: 'dark',  label: 'Dark Mode',  desc: 'Easy on the eyes',  icon: 'moon-outline' },
];

export default function ThemeSelectScreen() {
  const { colors, isDark, setDarkMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { role } = useLocalSearchParams<{ role?: string }>();

  const [selected, setSelected] = useState<Mode>(isDark ? 'dark' : 'light');

  function handleSelect(mode: Mode) {
    setSelected(mode);
    setDarkMode(mode === 'dark');
  }

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
          <Text style={styles.title}>Pick your look</Text>
          <Text style={styles.subtitle}>You can change this anytime in Account settings</Text>

          <View style={styles.cards}>
            {MODES.map(mode => {
              const active = selected === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => handleSelect(mode.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
                    <Ionicons
                      name={mode.icon}
                      size={30}
                      color={active ? colors.textInverse : colors.brandPrimary}
                    />
                  </View>
                  <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                    {mode.label}
                  </Text>
                  <Text style={[styles.modeDesc, active && styles.modeDescActive]}>
                    {mode.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueBtn, cardShadow]}
            onPress={() => router.push({ pathname: '/(auth)/signin', params: { role } })}
            activeOpacity={0.85}
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
    modeLabel: {
      fontSize: FS.headingMd,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: Sp[1],
    },
    modeLabelActive: { color: colors.brandPrimary },
    modeDesc: {
      fontSize: FS.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 17,
    },
    modeDescActive: { color: colors.brandSecondary },
    footer: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    continueBtn: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    continueBtnText: {
      color: colors.textInverse,
      fontSize: FS.bodyLg,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });
}
