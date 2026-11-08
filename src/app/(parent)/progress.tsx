import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { useChildren } from '@/context/ChildrenContext';
import { PRESET_LESSONS } from '@/data/lessons';
import { formatDateTime, useAttempts } from '@/lib/attempts';

// The selected child's last score in each lesson. The clock opens the full history.
export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { selectedChild } = useChildren();
  const { attempts, loading } = useAttempts(selectedChild?.id);

  // Every ready-made lesson, plus any other lesson this child has played.
  const lessons = PRESET_LESSONS.map(({ id, title }) => ({ id, title }));
  for (const attempt of attempts) {
    if (!lessons.some((lesson) => lesson.id === attempt.lessonId)) {
      lessons.push({ id: attempt.lessonId, title: attempt.lessonTitle });
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>
        {selectedChild ? `${selectedChild.nickname}'s progress` : 'Progress'}
      </Text>

      {!selectedChild ? (
        <Text style={styles.empty}>Add a child to see their scores here.</Text>
      ) : loading ? null : (
        lessons.map((lesson) => {
          // The list is newest first, so the first match is the last attempt.
          const last = attempts.find((attempt) => attempt.lessonId === lesson.id);
          return (
            <View key={lesson.id} style={styles.card}>
              <View style={styles.cardText}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
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
                  onPress={() => router.push({ pathname: '/history/[lessonId]', params: { lessonId: lesson.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`See ${lesson.title} history`}
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
        })
      )}
    </ScrollView>
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
