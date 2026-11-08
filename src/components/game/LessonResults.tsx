import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { StarRow } from '@/components/game/StarRow';
import { Mochi } from '@/components/Mochi';
import { colors, fonts, radius } from '@/constants/theme';
import { MAX_STARS_PER_PAGE, scorePercent } from '@/lib/game';

type LessonResultsProps = {
  results: { answer: string; stars: number }[];
  starsPerPage?: number;
  // True if the score could not be stored, so the parent isn't misled.
  saveFailed: boolean;
  onPlayAgain: () => void;
  onDone: () => void;
};

// The end of a lesson: total score, then the stars for each page.
export function LessonResults({
  results,
  starsPerPage = MAX_STARS_PER_PAGE,
  saveFailed,
  onPlayAgain,
  onDone,
}: LessonResultsProps) {
  const insets = useSafeAreaInsets();
  const earned = results.reduce((total, page) => total + page.stars, 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Mochi size={170} />
      <Text style={styles.title}>All done!</Text>
      <Text style={styles.percent}>{scorePercent(results, starsPerPage)}%</Text>
      <Text style={styles.total}>
        {earned} of {results.length * starsPerPage} stars
      </Text>

      <View style={styles.card}>
        {results.map((page, index) => (
          <View key={page.answer} style={[styles.row, index < results.length - 1 && styles.rowDivider]}>
            <Text style={styles.word}>{page.answer}</Text>
            <StarRow stars={page.stars} total={starsPerPage} size={22} />
          </View>
        ))}
      </View>

      {saveFailed ? <Text style={styles.saveFailed}>This score couldn&apos;t be saved.</Text> : null}

      <View style={styles.buttons}>
        <ChunkyButton label="Play again" onPress={onPlayAgain} />
        <ChunkyButton label="Done" variant="fun" onPress={onDone} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 4,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
  },
  percent: {
    fontFamily: fonts.headingBold,
    fontSize: 56,
    lineHeight: 66,
    color: colors.primary,
  },
  total: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textMuted,
    marginBottom: 12,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerSoft,
  },
  word: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 17,
    color: colors.text,
  },
  saveFailed: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.error,
    marginTop: 12,
  },
  buttons: {
    alignSelf: 'stretch',
    gap: 14,
    marginTop: 20,
  },
});
