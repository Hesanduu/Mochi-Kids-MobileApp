import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarRow } from '@/components/game/StarRow';
import { ScreenBanner } from '@/components/ScreenBanner';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { useChildren } from '@/context/ChildrenContext';
import { formatDateTime, formatDuration } from '@/lib/attempts';
import {
  useMispronouncedWords,
  useSpeechAttempts,
  type SpeechAttempt,
  type SpeechWordResult,
} from '@/lib/speechAttempts';
import { MAX_STARS_PER_WORD } from '@/lib/talkGame';

// The words this child finds hardest, then every session, newest first.
export default function SpeechHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const { selectedChild } = useChildren();
  const { items: allAttempts, loading } = useSpeechAttempts(selectedChild?.id);
  const { items: allWords } = useMispronouncedWords(selectedChild?.id);

  const attempts = allAttempts.filter((attempt) => attempt.setId === setId);
  const words = allWords.filter((word) => word.setId === setId); // already most mistakes first

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/progress'));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
    >
      <ScreenBanner onBack={goBack} backLabel="Back to progress" />

      <Text style={styles.title}>{attempts[0]?.setTitle ?? 'History'}</Text>

      {loading ? null : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Most mispronounced</Text>
          {words.length === 0 ? (
            <Text style={styles.detail}>No mispronounced words yet.</Text>
          ) : (
            words.map((word) => (
              <View key={word.id} style={styles.countRow}>
                <Text style={styles.word}>{word.word}</Text>
                <Text style={styles.count}>{word.count}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {attempts.map((attempt, index) => (
        <AttemptCard key={attempt.id} attempt={attempt} number={attempts.length - index} />
      ))}
    </ScrollView>
  );
}

function AttemptCard({ attempt, number }: { attempt: SpeechAttempt; number: number }) {
  const [expanded, setExpanded] = useState(false);

  // Closed, the card shows only the words that need practice.
  const needsPractice = attempt.words.filter((word) => word.mispronounced > 0);
  const wordsToShow = expanded ? attempt.words : needsPractice;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Attempt {number}</Text>
      <Text style={styles.detail}>{formatDateTime(attempt.finishedAt)}</Text>
      <Text style={styles.score}>
        {attempt.score}% · {attempt.stars}/{attempt.maxStars} stars · {formatDuration(attempt.durationSeconds)}
      </Text>

      {needsPractice.length === 0 ? <Text style={styles.allRight}>Every word said properly!</Text> : null}

      {wordsToShow.length > 0 ? (
        <View style={styles.wordList}>
          {wordsToShow.map((word) => (
            <WordRow key={word.word} result={word} />
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={styles.dropdown}
      >
        <Text style={styles.dropdownLabel}>{expanded ? 'Show less' : 'Show all words'}</Text>
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

function describe(result: SpeechWordResult) {
  if (!result.gotIt) return `Not yet, after ${result.tries} tries`;
  if (result.slightSlip) return `Small slip, on try ${result.tries}`;
  return result.tries === 1 ? 'Said properly first time' : `Said properly on try ${result.tries}`;
}

function WordRow({ result }: { result: SpeechWordResult }) {
  const perfect = result.mispronounced === 0;

  return (
    <View style={styles.wordRow}>
      <SymbolView
        name={
          perfect
            ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
            : { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }
        }
        size={22}
        tintColor={perfect ? colors.greenDark : colors.error}
      />
      <View style={styles.wordText}>
        <View style={styles.wordHeading}>
          <Text style={styles.word}>{result.word}</Text>
          <StarRow stars={result.stars} total={MAX_STARS_PER_WORD} size={15} />
        </View>
        <Text style={styles.detail}>
          {describe(result)}
          {result.mispronounced > 0 ? ` · Mispronounced ${result.mispronounced}×` : ''}
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
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 19,
    lineHeight: 25,
    color: colors.text,
  },
  detail: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  score: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  count: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 17,
    color: colors.error,
  },
  allRight: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.greenDark,
    marginTop: 6,
  },
  wordList: {
    marginTop: 8,
    gap: 10,
  },
  wordRow: {
    flexDirection: 'row',
    gap: 10,
  },
  wordText: {
    flex: 1,
    gap: 1,
  },
  wordHeading: {
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
});
