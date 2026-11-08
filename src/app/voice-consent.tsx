import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { ScreenBanner } from '@/components/ScreenBanner';
import { colors, fonts, radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';
import { ensureMicPermission, saveVoiceConsent } from '@/lib/listen';

const POINTS = [
  'Mochi records a few seconds of your child saying the practice word.',
  'The clip goes through our server to OpenAI, whose AI checks how the word was said.',
  'We don’t save the recording or what was heard. It is deleted from this phone straight away.',
  'We only save the words practised and the stars earned, so you can see progress.',
  'If nobody speaks, nothing is sent.',
];

// Asked once, before the microphone is used for the first time.
export default function VoiceConsentScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/talk'));

  const handleAgree = async () => {
    if (!user) return;
    setError(undefined);
    setLoading(true);
    try {
      await saveVoiceConsent(user.uid);
      await ensureMicPermission();
      router.replace({ pathname: '/speak/[setId]', params: { setId } });
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
        <Text style={styles.title}>For grown-ups</Text>
        <Text style={styles.subtitle}>Talk with Mochi uses your child&apos;s voice. Here is what happens:</Text>
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

      <ChunkyButton label="I’m the parent, I agree" onPress={handleAgree} loading={loading} />
      <ChunkyButton label="Not now" variant="fun" onPress={goBack} />
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
