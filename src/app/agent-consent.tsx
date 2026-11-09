import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { ParentGate } from '@/components/ParentGate';
import { ScreenBanner } from '@/components/ScreenBanner';
import { colors, fonts, radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { enableAgent } from '@/lib/agent';
import { errorMessage } from '@/lib/api';
import { registerForNotifications } from '@/lib/notifications';

const POINTS = [
  'Once a week, Mochi looks at your child’s scores and writes you a short report.',
  'Mochi then suggests next week’s activities. Nothing reaches your child until you approve it.',
  'To do this, we send OpenAI your child’s age, the lesson and word names, and their stars and scores.',
  'We never send your child’s name, your account details or any recordings.',
  'When a report is ready, this phone can get a notification. It never includes your child’s name.',
  'You can switch this off at any time in your Profile.',
];

// Asked before the agent reads a child's scores for the first time.
export default function AgentConsentScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/plan'));

  const switchOn = async () => {
    setGateOpen(false);
    if (!user) return;
    setError(undefined);
    setLoading(true);
    try {
      await enableAgent(user.uid);
      registerForNotifications(user.uid, { ask: true }); // so reports can reach this phone
      goBack();
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
    >
      <ScreenBanner onBack={goBack} backLabel="Go back" />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Mochi&apos;s weekly plans</Text>
        <Text style={styles.subtitle}>For grown-ups. Here is what happens if you switch this on:</Text>
      </View>

      <View style={styles.card}>
        {POINTS.map((point) => (
          <Text key={point} style={styles.point}>
            • {point}
          </Text>
        ))}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <ChunkyButton label="I’m the parent, switch it on" onPress={() => setGateOpen(true)} loading={loading} />
      <ChunkyButton label="Not now" variant="fun" onPress={goBack} />

      {gateOpen ? <ParentGate onPass={switchOn} onCancel={() => setGateOpen(false)} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 28,
    gap: 16,
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
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
  },
  card: {
    padding: 16,
    gap: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.greenSoft,
    borderWidth: 1.5,
    borderColor: colors.green,
  },
  point: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 22,
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
