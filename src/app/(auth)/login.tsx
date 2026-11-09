import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  Text, useWindowDimensions, View, } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { Dots } from '@/components/Dots';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Mochi } from '@/components/Mochi';
import { TextField } from '@/components/TextField';
import { colors, fonts } from '@/constants/theme';
import { friendlyAuthError, logIn, looksLikeEmail } from '@/lib/auth';

// The header takes whatever height the form leaves free, so the whole screen
// fits without scrolling. The form needs about this much room.
const FORM_HEIGHT = 518;
const MIN_HEADER_HEIGHT = 130;
const MAX_HEADER_HEIGHT = 340; // tall phones: the header takes the spare room, not the form
const MAX_MOCHI_SIZE = 236;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // iPhones report more room at the bottom than the home bar really needs.
  const bottomPadding = Platform.OS === 'ios' ? Math.min(insets.bottom, 20) : Math.max(insets.bottom, 12);
  const headerHeight = Math.min(
    Math.max(height - insets.top - bottomPadding - FORM_HEIGHT, MIN_HEADER_HEIGHT),
    MAX_HEADER_HEIGHT,
  );
  const mochiSize = Math.min(headerHeight - 44, MAX_MOCHI_SIZE);
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
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Light blue header with Mochi */}
        <View style={[styles.header, { height: headerHeight + insets.top }]}>
          <Dots
            dots={[
              { size: 16, color: colors.yellow, left: 34, top: insets.top + headerHeight * 0.15 },
              { size: 12, color: colors.green, right: 46, top: insets.top + headerHeight * 0.23 },
              { size: 10, color: colors.sky, left: 70, top: insets.top + headerHeight * 0.59 },
              { size: 9, color: colors.red, opacity: 0.7, right: 74, top: insets.top + headerHeight * 0.64 },
            ]}
          />
          <View style={[styles.mochiShadow, { width: mochiSize * 0.76 }]} />
          <Mochi size={mochiSize} style={styles.mochi} />
        </View>

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Welcome back!</Text>
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
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.skyShadow,
  },
  mochi: {
    marginBottom: 8,
  },
  body: {
    flexGrow: 1,
    paddingTop: 18,
    paddingHorizontal: 28,
    gap: 16,
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
  },
  form: {
    gap: 14,
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
    marginTop: -12, // closer to the Google button than the normal row gap
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
