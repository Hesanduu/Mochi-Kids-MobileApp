import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { Mochi } from '@/components/Mochi';
import { ScreenBanner } from '@/components/ScreenBanner';
import { TextField } from '@/components/TextField';
import { colors, fonts, radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { errorMessage, generateLesson, type GeneratedLesson } from '@/lib/api';
import { saveLesson } from '@/lib/lessonStore';

const MAX_TOPIC_LENGTH = 40;

// Parent types a topic, the server makes the lesson, and the parent checks it.
// Nothing is stored until the parent taps Save. Activities and Talk both use this
// screen and the same server route; `kind=talk` makes a Talk category.
export default function CreateLessonScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const forTalk = kind === 'talk';
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(forTalk ? '/talk' : '/activities'));

  const handleCreate = async () => {
    const cleanTopic = topic.trim();
    setError(undefined);
    if (!cleanTopic) {
      setError('Please type a lesson name first.');
      return;
    }
    setGenerating(true);
    try {
      setLesson(await generateLesson(cleanTopic));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !lesson) return;
    setError(undefined);
    setSaving(true);
    try {
      await saveLesson(user.uid, lesson, forTalk ? 'talkSets' : 'lessons');
      goBack();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setLesson(null);
    setError(undefined);
  };

  if (generating) {
    return (
      <View style={styles.waiting}>
        <Mochi size={200} />
        <Text style={styles.title}>Mochi is drawing…</Text>
        <Text style={[styles.subtitle, styles.centred]}>
          This can take a minute or two. Please keep this screen open.
        </Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        <ScreenBanner onBack={goBack} backLabel="Go back" />

        {lesson ? (
          <>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{lesson.title}</Text>
              <Text style={styles.subtitle}>Check each picture matches its word before saving.</Text>
            </View>

            <View style={styles.grid}>
              {lesson.items.map((item) => (
                <View key={item.id} style={styles.previewCard}>
                  <Image
                    source={{ uri: `data:${item.mimeType};base64,${item.imageBase64}` }}
                    contentFit="cover"
                    style={styles.previewImage}
                    accessibilityLabel={item.word}
                  />
                  <Text style={styles.previewWord}>{item.word}</Text>
                  {forTalk ? null : <Text style={styles.previewQuestion}>{item.question}</Text>}
                </View>
              ))}
            </View>

            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <ChunkyButton label={forTalk ? 'Save category' : 'Save lesson'} onPress={handleSave} loading={saving} />
            <ChunkyButton label="Discard" variant="fun" onPress={handleDiscard} />
          </>
        ) : (
          <>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Create with AI</Text>
              <Text style={styles.subtitle}>Just one word or two, for ages 3–5.</Text>
            </View>

            <TextField
              label={forTalk ? 'What should your child practise saying?' : 'What should Mochi teach?'}
              placeholder={forTalk ? 'e.g. Toys' : 'e.g. Numbers'}
              value={topic}
              onChangeText={setTopic}
              maxLength={MAX_TOPIC_LENGTH}
              autoCapitalize="sentences"
              returnKeyType="done"
            />

            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <ChunkyButton label={forTalk ? 'Create category' : 'Create lesson'} onPress={handleCreate} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  waiting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    backgroundColor: colors.skySoft,
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
  centred: {
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.error,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  previewCard: {
    width: '48%',
    padding: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
    gap: 2,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.sm,
  },
  previewWord: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 4,
  },
  previewQuestion: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
