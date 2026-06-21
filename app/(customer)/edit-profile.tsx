import { useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function EditProfileScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);

  const [firstName, setFirstName] = useState((user?.user_metadata?.firstName as string) ?? '');
  const [lastName, setLastName] = useState((user?.user_metadata?.lastName as string) ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!firstName.trim()) {
      Alert.alert('Missing name', 'Please enter your first name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        Alert.alert('Weak password', 'Password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Passwords don't match", 'Please re-enter the same password in both fields.');
        return;
      }
    }

    setSaving(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const emailChanged = email.trim() !== (user?.email ?? '');

    const payload: { email?: string; password?: string; data: Record<string, string> } = {
      data: { firstName: firstName.trim(), lastName: lastName.trim(), full_name: fullName },
    };
    if (emailChanged) payload.email = email.trim();
    if (newPassword) payload.password = newPassword;

    const { error } = await supabase.auth.updateUser(payload);
    if (error) {
      setSaving(false);
      Alert.alert('Could not save changes', error.message);
      return;
    }

    if (user?.id) {
      const { error: profileError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id);
      if (profileError) console.error('users update error:', profileError.message);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) setSession(session);

    setSaving(false);
    setNewPassword('');
    setConfirmPassword('');

    Alert.alert(
      'Profile updated',
      emailChanged
        ? 'Your changes were saved. Check your inbox to confirm your new email address.'
        : 'Your changes were saved.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Personal Info</Text>
          <View style={[styles.card, cardShadow]}>
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
          </View>

          <Text style={styles.sectionLabel}>Change Password</Text>
          <Text style={styles.sectionHint}>Leave blank to keep your current password.</Text>
          <View style={[styles.card, cardShadow]}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={styles.pwInput}
                  placeholder="New password"
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

            <View style={[styles.field, { marginBottom: 0 }]}>
              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={styles.pwInput}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textDisabled}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>
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
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Sp[5], paddingVertical: Sp[3],
    },
    backBtn: { padding: Sp[1] },
    headerTitle: { fontSize: FS.headingMd, fontWeight: '700', color: colors.textPrimary },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: Sp[8] },
    sectionLabel: {
      fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary, marginBottom: Sp[2],
    },
    sectionHint: { fontSize: FS.caption, color: colors.textSecondary, marginBottom: Sp[3] },
    card: {
      backgroundColor: colors.bgSurface, borderRadius: R.lg, padding: Sp[4], marginBottom: Sp[5],
    },
    nameRow: { flexDirection: 'row', gap: Sp[3] },
    field: { marginBottom: Sp[4] },
    halfField: { flex: 1 },
    fieldLabel: { fontSize: FS.label, fontWeight: '500', color: colors.textSecondary, marginBottom: Sp[2] },
    input: {
      backgroundColor: colors.bgSubtle, borderRadius: R.md, paddingHorizontal: Sp[4], paddingVertical: 14,
      fontSize: FS.body, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
    },
    pwRow: {
      backgroundColor: colors.bgSubtle, borderRadius: R.md, paddingHorizontal: Sp[4], paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, gap: Sp[2],
    },
    pwInput: { flex: 1, fontSize: FS.body, color: colors.textPrimary },
    saveBtn: {
      backgroundColor: colors.brandPrimary, borderRadius: R.md, paddingVertical: 15, alignItems: 'center',
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: colors.textInverse, fontSize: FS.bodyLg, fontWeight: '700' },
  });
}
