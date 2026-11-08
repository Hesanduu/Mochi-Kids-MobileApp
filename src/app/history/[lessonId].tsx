import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarRow } from '@/components/game/StarRow';
import { ScreenBanner } from '@/components/ScreenBanner';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { useChildren } from '@/context/ChildrenContext';
import { formatDateTime, formatDuration, useAttempts, type Attempt } from '@/lib/attempts';
import type { PageResult } from '@/lib/game';

// Every attempt at one lesson, newest first. Each shows what went wrong,
// and a dropdown opens every page, right and wrong.
export default function LessonHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { selectedChild } = useChildren();
  const { attempts, loading } = useAttempts(selectedChild?.id);
  const lessonAttempts = attempts.filter((attempt) => attempt.lessonId === lessonId);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/progress'));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
    >
      <ScreenBanner onBack={goBack} backLabel="Back to progress" />

      <Text style={styles.title}>{lessonAttempts[0]?.lessonTitle ?? 'History'}</Text>

      {!loading && lessonAttempts.length === 0 ? <Text style={styles.date}>No attempts yet.</Text> : null}

      {lessonAttempts.map((attempt, index) => (
        <AttemptCard key={attempt.id} attempt={attempt} number={lessonAttempts.length - index} />
      ))}
    </ScrollView>
  );
}

function AttemptCard({ attempt, number }: { attempt: Attempt; number: number }) {
  const [expanded, setExpanded] = useState(false);

  // A page needs attention if the first try wasn't right.
  const missed = attempt.pages.filter((page) => page.tries > 1);
  const pagesToShow = expanded ? attempt.pages : missed;

  return (
    <View style={styles.card}>
      <Text style={styles.attemptTitle}>Attempt {number}</Text>
      <Text style={styles.date}>{formatDateTime(attempt.finishedAt)}</Text>
      <Text style={styles.score}>
        {attempt.score}% · {attempt.stars}/{attempt.maxStars} stars · {formatDuration(attempt.durationSeconds)}
      </Text>

      {missed.length === 0 ? <Text style={styles.allRight}>Everything right on the first try!</Text> : null}

      {pagesToShow.length > 0 ? (
        <View style={styles.pageList}>
          {pagesToShow.map((page) => (
            <PageRow key={page.answer} page={page} />
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={styles.dropdown}
      >
        <Text style={styles.dropdownLabel}>{expanded ? 'Show less' : `Show all ${attempt.pages.length} pages`}</Text>
        <SymbolView
          name={
            expanded
              ? { ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }
              : { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }
          }
          size={18}
          tintColor={colors.primary}
        />
      </Pressable>
    </View>
  );
}

function PageRow({ page }: { page: PageResult }) {
  const right = page.tries === 1;

  return (
    <View style={styles.pageRow}>
      <SymbolView
        name={
          right
            ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
            : { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }
        }
        size={22}
        tintColor={right ? colors.greenDark : colors.error}
      />
      <View style={styles.pageText}>
        <View style={styles.pageHeading}>
          <Text style={styles.word}>{page.answer}</Text>
          <StarRow stars={page.stars} size={18} />
        </View>
        <Text style={styles.picked}>
          {right ? 'Right on the first try' : `Picked ${page.wrongPicks.join(', ')} first`}
        </Text>
      </View>
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
    gap: 14,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  card: {
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
    gap: 2,
  },
  attemptTitle: {
    fontFamily: fonts.heading,
    fontSize: 19,
    lineHeight: 25,
    color: colors.text,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
  },
  score: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  allRight: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.greenDark,
    marginTop: 6,
  },
  pageList: {
    marginTop: 8,
    gap: 10,
  },
  pageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pageText: {
    flex: 1,
    gap: 1,
  },
  pageHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  word: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    color: colors.text,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: TAP_TARGET,
    marginTop: 6,
  },
  dropdownLabel: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.primary,
  },
  picked: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
});
