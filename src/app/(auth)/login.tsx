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
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { Dots } from '@/components/Dots';
import { Mochi } from '@/components/Mochi';
import { TextField } from '@/components/TextField';
import { colors, fonts } from '@/constants/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // No auth yet: go straight to the dashboard.
  // `replace` (not `push`) so the back gesture doesn't return to login.
  const handleLogin = () => router.replace('/home');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
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
              password
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
            />

            {/* Does nothing yet. Password reset comes with auth. */}
            <Pressable accessibilityRole="link" style={styles.forgot} hitSlop={8}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>

            <ChunkyButton label="Log in" onPress={handleLogin} />
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
