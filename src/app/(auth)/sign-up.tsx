import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ChunkyButton } from '@/components/ChunkyButton';
import { ConsentCheckbox } from '@/components/ConsentCheckbox';
import { Dots } from '@/components/Dots';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Mochi } from '@/components/Mochi';
import { TextField } from '@/components/TextField';
import { colors, fonts, TAP_TARGET } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { friendlyAuthError, looksLikeEmail } from '@/lib/auth';

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  consent?: string;
};

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  // Go back to login. If the screen was opened directly (no history),
  // replace with /login instead.
  const goToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  const handleCreate = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    const nextErrors: FieldErrors = {};
    if (!cleanName) nextErrors.name = 'Please enter your name.';
    if (!looksLikeEmail(cleanEmail)) nextErrors.email = 'Please enter a valid email address.';
    if (password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (confirm !== password) nextErrors.confirm = 'The passwords don’t match.';
    if (!consent) nextErrors.consent = 'Please tick the box to continue.';

    setErrors(nextErrors);
    setFormError(undefined);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      // On success the root layout sees the login and opens the Dashboard.
      await signUp({ name: cleanName, email: cleanEmail, password });
    } catch (err) {
      setFormError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 16) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner with back button and a small Mochi */}
        <View style={styles.banner}>
          <Pressable
            onPress={goToLogin}
            accessibilityRole="button"
            accessibilityLabel="Back to log in"
            style={styles.backButton}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back_ios_new' }}
              size={20}
              tintColor={colors.text}
            />
          </Pressable>
          <Dots
            dots={[
              { size: 12, color: colors.yellow, left: 120, top: 22 },
              { size: 9, color: colors.green, left: 168, top: 62 },
              { size: 8, color: colors.red, opacity: 0.7, left: 214, top: 30 },
            ]}
          />
          <View style={styles.flex} />
          <Mochi size={104} style={styles.mochi} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Create your parent account</Text>
          <Text style={styles.subtitle}>Only grown-ups have accounts. You&apos;ll add your child next.</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Your name"
            placeholder="e.g. Kavindi Perera"
            value={name}
            onChangeText={setName}
            error={errors.name}
            height={50}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />
          <TextField
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            height={50}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <TextField
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            height={50}
            password
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <TextField
            label="Confirm password"
            placeholder="Type it again"
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
            height={50}
            password
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <ConsentCheckbox checked={consent} onChange={setConsent} />
          {errors.consent ? <Text style={styles.error}>{errors.consent}</Text> : null}

          {formError ? (
            <Text style={[styles.error, styles.formError]} accessibilityLiveRegion="polite">
              {formError}
            </Text>
          ) : null}

          <ChunkyButton
            label="Create account"
            onPress={handleCreate}
            loading={loading}
            height={56}
            style={styles.button}
          />

          <GoogleSignInButton />
        </View>

        <View style={styles.flex} />

        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={goToLogin} accessibilityRole="link">
            Log in
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.error,
  },
  formError: {
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    gap: 16,
    backgroundColor: colors.background,
  },
  banner: {
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.skySoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 12,
    overflow: 'hidden',
  },
  backButton: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    borderRadius: TAP_TARGET / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mochi: {
    marginTop: 10,
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
    gap: 12,
  },
  button: {
    marginTop: 4,
  },
  link: {
    fontFamily: fonts.bodyExtraBold,
    color: colors.primary,
  },
  footer: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
