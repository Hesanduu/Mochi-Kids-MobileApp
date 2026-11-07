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
import { Mochi } from '@/components/Mochi';
import { TextField } from '@/components/TextField';
import { colors, fonts, TAP_TARGET } from '@/constants/theme';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consent, setConsent] = useState(false);

  // Go back to login. If the screen was opened directly (no history),
  // replace with /login instead.
  const goToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  // No auth yet: go straight to the dashboard.
  const handleCreate = () => router.replace('/home');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
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
            height={50}
            password
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <ConsentCheckbox checked={consent} onChange={setConsent} />

          <ChunkyButton label="Create account" onPress={handleCreate} height={56} style={styles.button} />
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
