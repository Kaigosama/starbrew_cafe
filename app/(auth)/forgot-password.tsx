import { useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Could not send code', error.message);
      return;
    }
    router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim() } });
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
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a verification code to reset your password.
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
                returnKeyType="done"
                onSubmitEditing={handleSendCode}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
              onPress={handleSendCode}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.sendBtnText}>{loading ? 'Sending…' : 'Send Code'}</Text>
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
    sendBtn: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.md,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: Sp[2],
    },
    sendBtnDisabled: { opacity: 0.6 },
    sendBtnText: {
      color: colors.textInverse,
      fontSize: FS.bodyLg,
      fontWeight: '700',
    },
  });
}
