import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { ScreenBanner } from '@/components/ScreenBanner';
import { TextField } from '@/components/TextField';
import { colors, fonts, radius } from '@/constants/theme';
import { friendlyAuthError, looksLikeEmail, sendPasswordReset } from '@/lib/auth';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  const handleSend = async () => {
    const cleanEmail = email.trim();
    const badEmail = looksLikeEmail(cleanEmail) ? undefined : 'Please enter a valid email address.';
    setEmailError(badEmail);
    setFormError(undefined);
    if (badEmail) return;

    setLoading(true);
    try {
      await sendPasswordReset(cleanEmail);
      setSent(true);
    } catch (err) {
      setFormError(friendlyAuthError(err));
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
        <ScreenBanner onBack={goBack} backLabel="Back to log in" />

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Forgot your password?</Text>
          <Text style={styles.subtitle}>Enter your email and we&apos;ll send you a link to choose a new one.</Text>
        </View>

        {sent ? (
          <>
            <View style={styles.successBox}>
              <Text style={styles.successText} accessibilityLiveRegion="polite">
                If an account exists for that email, we&apos;ve sent a reset link. Please check your inbox.
              </Text>
            </View>
            <ChunkyButton label="Back to log in" onPress={goBack} />
          </>
        ) : (
          <View style={styles.form}>
            <TextField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="done"
            />

            {formError ? (
              <Text style={styles.formError} accessibilityLiveRegion="polite">
                {formError}
              </Text>
            ) : null}

            <ChunkyButton label="Send reset link" onPress={handleSend} loading={loading} />
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
  titleBlock: {
    gap: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  form: {
    gap: 16,
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
