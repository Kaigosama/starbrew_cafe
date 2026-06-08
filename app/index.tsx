import { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { R, FS, Sp } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function SplashScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const LOGO = isDark
    ? require('../assets/starbrew-logo_dark.png')
    : require('../assets/starbrew-logo_light.png');

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tagline}>A great morning starts{'\n'}with great coffee.</Text>
        </View>
        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Get started</Text>
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
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Sp[5],
    },
    logo: { width: 200, height: 200, marginBottom: Sp[5] },
    tagline: {
      color: colors.textSecondary,
      fontSize: FS.bodyLg,
      textAlign: 'center',
      lineHeight: 24,
    },
    bottom: {
      paddingHorizontal: Sp[5],
      paddingBottom: Sp[10],
    },
    btn: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    btnText: {
      color: colors.textInverse,
      fontSize: FS.bodyLg,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });
}
