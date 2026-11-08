import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { ScreenBanner } from '@/components/ScreenBanner';
import { TextField } from '@/components/TextField';
import { colors, fonts, radius } from '@/constants/theme';
import { changePassword, friendlyAuthError, isWrongPasswordError } from '@/lib/auth';

type FieldErrors = {
  current?: string;
  next?: string;
  confirm?: string;
};

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  const handleChange = async () => {
    const nextErrors: FieldErrors = {};
    if (!current) nextErrors.current = 'Please enter your current password.';
    if (next.length < 8) nextErrors.next = 'Use at least 8 characters.';
    else if (next === current) nextErrors.next = 'Choose a password different from your current one.';
    if (confirm !== next) nextErrors.confirm = 'The passwords don’t match.';

    setErrors(nextErrors);
    setFormError(undefined);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (err) {
      if (isWrongPasswordError(err)) setErrors({ current: 'That password isn’t right.' });
      else setFormError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenBanner onBack={goBack} backLabel="Back to profile" />

        <Text style={styles.title}>Change password</Text>

        {done ? (
          <>
            <View style={styles.successBox}>
              <Text style={styles.successText} accessibilityLiveRegion="polite">
                Your password has been changed.
              </Text>
            </View>
            <ChunkyButton label="Done" onPress={goBack} />
          </>
        ) : (
          <View style={styles.form}>
            <TextField
              label="Current password"
              placeholder="Your current password"
              value={current}
              onChangeText={setCurrent}
              error={errors.current}
              password
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
            />
            <TextField
              label="New password"
              placeholder="At least 8 characters"
              value={next}
              onChangeText={setNext}
              error={errors.next}
              password
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <TextField
              label="Confirm new password"
              placeholder="Type it again"
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              password
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
            />

            {formError ? (
              <Text style={styles.formError} accessibilityLiveRegion="polite">
                {formError}
              </Text>
            ) : null}

            <ChunkyButton label="Change password" onPress={handleChange} loading={loading} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    gap: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  form: {
    gap: 14,
  },
  formError: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.error,
    textAlign: 'center',
  },
  successBox: {
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.greenSoft,
    borderWidth: 1.5,
    borderColor: colors.green,
  },
  successText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
});
