import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SegmentedToggle } from '@/components/SegmentedToggle';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { useChildren } from '@/context/ChildrenContext';
import { PRESET_LESSONS } from '@/data/lessons';
import { formatDateTime, useAttempts } from '@/lib/attempts';
import { useSpeechAttempts } from '@/lib/speechAttempts';

type Part = 'activities' | 'speaking';

const PARTS: { value: Part; label: string }[] = [
  { value: 'activities', label: 'Activities' },
  { value: 'speaking', label: 'Speaking' },
];

// Two parts for the selected child: lesson scores, and Talk with Mochi scores.
export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { selectedChild } = useChildren();
  const [part, setPart] = useState<Part>('activities');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>{selectedChild ? `${selectedChild.nickname}'s progress` : 'Progress'}</Text>

      {!selectedChild ? (
        <Text style={styles.empty}>Add a child to see their scores here.</Text>
      ) : (
        <>
          <SegmentedToggle options={PARTS} value={part} onChange={setPart} />
          {part === 'activities' ? (
            <ActivitiesProgress childId={selectedChild.id} />
          ) : (
            <SpeakingProgress childId={selectedChild.id} />
          )}
        </>
      )}
    </ScrollView>
  );
}

function ActivitiesProgress({ childId }: { childId: string }) {
  const { attempts, loading } = useAttempts(childId);
  if (loading) return null;

  // Every ready-made lesson, plus any other lesson this child has played.
  const lessons = PRESET_LESSONS.map(({ id, title }) => ({ id, title }));
  for (const attempt of attempts) {
    if (!lessons.some((lesson) => lesson.id === attempt.lessonId)) {
      lessons.push({ id: attempt.lessonId, title: attempt.lessonTitle });
    }
  }

  return lessons.map((lesson) => {
    // The list is newest first, so the first match is the last attempt.
    const last = attempts.find((attempt) => attempt.lessonId === lesson.id);
    return (
      <ProgressCard
        key={lesson.id}
        title={lesson.title}
        last={last}
        onHistory={() => router.push({ pathname: '/history/[lessonId]', params: { lessonId: lesson.id } })}
      />
    );
  });
}

function SpeakingProgress({ childId }: { childId: string }) {
  const { items: attempts, loading } = useSpeechAttempts(childId);
  if (loading) return null;

  if (attempts.length === 0) return <Text style={styles.empty}>Nothing played yet in Talk with Mochi.</Text>;

  // Only sets this child has played. The list is newest first, so the first
  // attempt found for each set is its last attempt.
  const lastPerSet = attempts.filter(
    (attempt, index) => attempts.findIndex((other) => other.setId === attempt.setId) === index,
  );

  return lastPerSet.map((last) => (
    <ProgressCard
      key={last.setId}
      title={last.setTitle}
      last={last}
      onHistory={() => router.push({ pathname: '/speech-history/[setId]', params: { setId: last.setId } })}
    />
  ));
}

type ProgressCardProps = {
  title: string;
  last?: { score: number; stars: number; maxStars: number; finishedAt: Date };
  onHistory: () => void;
};

function ProgressCard({ title, last, onHistory }: ProgressCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardText}>
        <Text style={styles.lessonTitle}>{title}</Text>
        {last ? (
          <>
            <Text style={styles.score}>
              Last: {last.score}% · {last.stars}/{last.maxStars} stars
            </Text>
            <Text style={styles.date}>{formatDateTime(last.finishedAt)}</Text>
          </>
        ) : (
          <Text style={styles.date}>Not played yet</Text>
        )}
      </View>
      {last ? (
        <Pressable
          onPress={onHistory}
          accessibilityRole="button"
          accessibilityLabel={`See ${title} history`}
          style={styles.historyButton}
        >
          <SymbolView
            name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
            size={24}
            tintColor={colors.primary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 14,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  lessonTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  score: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    color: colors.text,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
  },
  historyButton: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    borderRadius: TAP_TARGET / 2,
    backgroundColor: colors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
