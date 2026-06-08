import { useMemo, useState } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const LOGO = isDark
    ? require('../../assets/starbrew-logo_dark.png')
    : require('../../assets/starbrew-logo_light.png');

  const setSession = useAuthStore((s) => s.setSession);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!firstName || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { firstName, lastName, role: 'customer' },
      },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    if (data.session) {
      setSession(data.session);
    }
    router.replace('/(customer)');
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text style={styles.backLabel}>Sign in</Text>
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Join StarBrew Cafe today</Text>

            <View style={styles.nameRow}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First"
                  placeholderTextColor={colors.textDisabled}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last"
                  placeholderTextColor={colors.textDisabled}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

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
                  placeholder="Create a password"
                  placeholderTextColor={colors.textDisabled}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
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
              style={[styles.signUpBtn, loading && styles.signUpBtnDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.signUpBtnText}>
                {loading ? 'Creating account…' : 'Create account'}
              </Text>
            </TouchableOpacity>
          </View>
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
    nameRow: { flexDirection: 'row', gap: Sp[3] },
    field: { marginBottom: Sp[4] },
    halfField: { flex: 1 },
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
    signUpBtn: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.md,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: Sp[2],
    },
    signUpBtnDisabled: { opacity: 0.6 },
    signUpBtnText: {
      color: colors.textInverse,
      fontSize: FS.bodyLg,
      fontWeight: '700',
    },
  });
}
