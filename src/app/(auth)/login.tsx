import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  Text, View, } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { Dots } from '@/components/Dots';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Mochi } from '@/components/Mochi';
import { TextField } from '@/components/TextField';
import { colors, fonts } from '@/constants/theme';
import { friendlyAuthError, logIn, looksLikeEmail } from '@/lib/auth';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim();
    const badEmail = looksLikeEmail(cleanEmail) ? undefined : 'Please enter your email address.';
    const badPassword = password ? undefined : 'Please enter your password.';
    setEmailError(badEmail);
    setPasswordError(badPassword);
    setFormError(undefined);
    if (badEmail || badPassword) return;

    setLoading(true);
    try {
      // On success the root layout sees the login and opens the Dashboard.
      await logIn(cleanEmail, password);
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
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Light blue header with Mochi */}
        <View style={[styles.header, { height: 280 + insets.top }]}>
          <Dots
            dots={[
              { size: 16, color: colors.yellow, left: 34, top: insets.top + 42 },
              { size: 12, color: colors.green, right: 46, top: insets.top + 64 },
              { size: 10, color: colors.sky, left: 70, top: insets.top + 164 },
              { size: 9, color: colors.red, opacity: 0.7, right: 74, top: insets.top + 178 },
            ]}
          />
          <View style={styles.mochiShadow} />
          <Mochi size={236} style={styles.mochi} />
        </View>

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Log in to plan learning time with Mochi.</Text>
          </View>

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
              returnKeyType="next"
            />
            <TextField
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              password
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
            />

            <Link href="/forgot-password" asChild>
              <Pressable accessibilityRole="link" style={styles.forgot} hitSlop={8}>
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
            </Link>

            {formError ? (
              <Text style={styles.formError} accessibilityLiveRegion="polite">
                {formError}
              </Text>
            ) : null}

            <ChunkyButton label="Log in" onPress={handleLogin} loading={loading} />

            <GoogleSignInButton />
          </View>

          {/* Pushes the sign-up link to the bottom on tall phones */}
          <View style={styles.flex} />

          <Text style={styles.footer}>
            New to Mochi Kids?{' '}
            <Link href="/sign-up" style={styles.link}>
              Create an account
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  formError: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.error,
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.skySoft,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  mochiShadow: {
    position: 'absolute',
    bottom: 18,
    width: 180,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.skyShadow,
  },
  mochi: {
    marginBottom: 8,
  },
  body: {
    flexGrow: 1,
    paddingTop: 26,
    paddingHorizontal: 28,
    gap: 22,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  forgot: {
    alignSelf: 'flex-end',
    minHeight: 32,
    justifyContent: 'center',
  },
  link: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.primary,
  },
  footer: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
