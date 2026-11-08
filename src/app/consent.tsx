import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { ConsentCheckbox } from '@/components/ConsentCheckbox';
import { Mochi } from '@/components/Mochi';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { logOut } from '@/lib/auth';

// Shown once to a first-time Google parent, who skipped the sign-up form's consent box.
export default function ConsentScreen() {
  const insets = useSafeAreaInsets();
  const { giveConsent } = useAuth();
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!consent) {
      setError('Please tick the box to continue.');
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      // On success the root layout opens the Dashboard.
      await giveConsent();
    } catch {
      setError('We couldn’t save that. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      <Mochi size={160} style={styles.mochi} />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>One last step</Text>
        <Text style={styles.subtitle}>Only grown-ups have accounts. Please confirm before you continue.</Text>
      </View>

      <ConsentCheckbox checked={consent} onChange={setConsent} />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <ChunkyButton label="Continue" onPress={handleContinue} loading={loading} />

      <Text style={styles.switchAccount} onPress={logOut} accessibilityRole="button">
        Use a different account
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    gap: 16,
  },
  mochi: {
    alignSelf: 'center',
  },
  titleBlock: {
    alignItems: 'center',
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
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.error,
  },
  switchAccount: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    lineHeight: 48, // keeps the tap area comfortable
    color: colors.primary,
    textAlign: 'center',
  },
});
