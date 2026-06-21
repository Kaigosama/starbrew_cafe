import { useState } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function SignInScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const LOGO = isDark
    ? require('../../assets/starbrew-logo_dark.png')
    : require('../../assets/starbrew-logo_light.png');

  const { role } = useLocalSearchParams<{ role?: string }>();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }
    setSession(data.session);
    // user_metadata.role is set during sign-up; fall back to URL param for predefined accounts
    const userRole = data.session?.user?.user_metadata?.role ?? role;

    const metadata = data.session?.user?.user_metadata ?? {};
    const fullName = (metadata.full_name as string) ||
      [metadata.firstName, metadata.lastName].filter(Boolean).join(' ');
    if (fullName && data.session?.user?.id) {
      const { error: profileError } = await supabase
        .from('users')
        .update({ full_name: fullName, role: userRole ?? 'customer' })
        .eq('id', data.session.user.id);
      if (profileError) console.error('users update error:', profileError.message);
    }

    router.replace(userRole === 'barista' ? '/(barista)/dashboard' : '/(customer)');
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text style={styles.backLabel}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>
              Signing in as a{' '}
              <Text style={styles.roleChip}>
                {role === 'barista' ? 'barista' : 'customer'}
              </Text>
            </Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.textDisabled}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={styles.pwInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textDisabled}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} activeOpacity={0.7}>
                  <Ionicons
                    name={showPw ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotRow}
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleSignIn}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.signInBtnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
            </TouchableOpacity>
          </View>

          {role !== 'barista' && (
            <View style={styles.signUpRow}>
              <Text style={styles.signUpPrompt}>New to StarBrew Cafe? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
                <Text style={styles.signUpLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    flex: { flex: 1 },
    headerRow: {
      paddingHorizontal: Sp[5],
      paddingTop: Sp[3],
      paddingBottom: Sp[2],
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Sp[2],
      paddingVertical: Sp[2],
    },
    backLabel: {
      fontSize: FS.headingMd,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    body: {
      paddingHorizontal: Sp[5],
      paddingTop: Sp[4],
      paddingBottom: Sp[10],
    },
    logoRow: { alignItems: 'center', marginBottom: Sp[6] },
    logo: { width: 80, height: 80 },
    card: {
      backgroundColor: colors.bgSurface,
      borderRadius: R.xl,
      padding: Sp[6],
      marginBottom: Sp[5],
      ...cardShadow,
    },
    title: {
      fontSize: FS.headingLg,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: Sp[2],
    },
    subtitle: {
      fontSize: FS.body,
      color: colors.textSecondary,
      marginBottom: Sp[5],
    },
    roleChip: {
      color: colors.brandPrimary,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    field: { marginBottom: Sp[4] },
    fieldLabel: {
      fontSize: FS.label,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: Sp[2],
    },
    input: {
      backgroundColor: colors.bgSubtle,
      borderRadius: R.md,
      paddingHorizontal: Sp[4],
      paddingVertical: 14,
      fontSize: FS.body,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pwRow: {
      backgroundColor: colors.bgSubtle,
      borderRadius: R.md,
      paddingHorizontal: Sp[4],
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    pwInput: { flex: 1, fontSize: FS.body, color: colors.textPrimary },
    forgotRow: { alignSelf: 'flex-end', marginBottom: Sp[5] },
    forgotText: {
      fontSize: FS.label,
      color: colors.brandSecondary,
      fontWeight: '500',
    },
    signInBtn: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.md,
      paddingVertical: 15,
      alignItems: 'center',
    },
    signInBtnDisabled: { opacity: 0.6 },
    signInBtnText: {
      color: colors.textInverse,
      fontSize: FS.bodyLg,
      fontWeight: '700',
    },
    signUpRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signUpPrompt: { fontSize: FS.body, color: colors.textSecondary },
    signUpLink: {
      fontSize: FS.body,
      color: colors.brandPrimary,
      fontWeight: '700',
    },
  });
}
