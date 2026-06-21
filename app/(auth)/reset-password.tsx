import { useEffect, useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/forgot-password');
    }
  }, [email]);

  async function handleResendCode() {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setResending(false);
    if (error) {
      Alert.alert('Could not resend code', error.message);
      return;
    }
    Alert.alert('Code sent', 'A new verification code has been sent to your email.');
  }

  async function handleReset() {
    if (!email) return;
    if (!code.trim()) {
      Alert.alert('Missing code', 'Please enter the verification code sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords don't match", 'Please re-enter the same password in both fields.');
      return;
    }

    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'recovery',
    });
    if (verifyError) {
      setLoading(false);
      Alert.alert('Invalid code', verifyError.message);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setLoading(false);
      Alert.alert('Could not reset password', updateError.message);
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);

    Alert.alert(
      'Password reset',
      'You can now sign in with your new password.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/signin') }]
    );
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
          <View style={styles.card}>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>
              Enter the code sent to {email} and choose a new password.
            </Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Verification Code</Text>
              <TextInput
                style={styles.input}
                placeholder="8-digit code"
                placeholderTextColor={colors.textDisabled}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={8}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={styles.pwInput}
                  placeholder="Create a new password"
                  placeholderTextColor={colors.textDisabled}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  returnKeyType="next"
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

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={styles.pwInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.textDisabled}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
              onPress={handleReset}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.resetBtnText}>{loading ? 'Resetting…' : 'Reset Password'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendRow}
              onPress={handleResendCode}
              activeOpacity={0.7}
              disabled={resending}
            >
              <Text style={styles.resendText}>
                {resending ? 'Sending…' : "Didn't get a code? Resend"}
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
      paddingTop: Sp[8],
      paddingBottom: Sp[10],
    },
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
    resetBtn: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.md,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: Sp[2],
    },
    resetBtnDisabled: { opacity: 0.6 },
    resetBtnText: {
      color: colors.textInverse,
      fontSize: FS.bodyLg,
      fontWeight: '700',
    },
    resendRow: { alignItems: 'center', marginTop: Sp[4] },
    resendText: {
      fontSize: FS.body,
      color: colors.brandPrimary,
      fontWeight: '600',
    },
  });
}
