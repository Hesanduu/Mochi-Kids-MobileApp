import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { colors, fonts, radius } from '@/constants/theme';
import { canUseGoogleSignIn, friendlyAuthError, signInWithGoogle } from '@/lib/auth';

// "or" divider and "Continue with Google". Hidden in Expo Go, where it can't work.
export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  if (!canUseGoogleSignIn) return null;

  const handlePress = async () => {
    setLoading(true);
    setError(undefined);
    try {
      // On success the app moves on by itself, so the spinner can keep going.
      const signedIn = await signInWithGoogle();
      if (!signedIn) setLoading(false);
    } catch (err) {
      if (__DEV__) console.warn('Google sign-in failed:', err);
      setError(friendlyAuthError(err));
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.or}>or</Text>
        <View style={styles.line} />
      </View>

      <Pressable
        onPress={handlePress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        accessibilityState={{ disabled: loading, busy: loading }}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Image source={require('@/assets/images/google-g.svg')} style={styles.logo} contentFit="contain" />
        )}
        <Text style={styles.label}>Continue with Google</Text>
      </Pressable>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  or: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textMuted,
  },
  button: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  buttonPressed: {
    backgroundColor: colors.skySoft,
  },
  logo: {
    width: 22,
    height: 22,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 17,
    color: colors.text,
  },
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.error,
    textAlign: 'center',
  },
});
