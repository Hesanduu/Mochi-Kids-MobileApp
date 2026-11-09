import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { colors, fonts, radius } from '@/constants/theme';
import type { Lesson } from '@/data/lessons';
import type { PlanItem } from '@/lib/agent';
import { loadSavedLesson } from '@/lib/lessonStore';

// Shows the pictures Mochi made, so a parent can check them before approving.
export function NewContentPreview({ uid, item }: { uid: string; item: PlanItem }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [failed, setFailed] = useState(false);
  const { refId, kind } = item;

  useEffect(() => {
    let active = true; // ignores the answer if the parent has already left
    loadSavedLesson(uid, refId, kind === 'lesson' ? 'lessons' : 'talkSets')
      .then((loaded) => active && setLesson(loaded))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [uid, refId, kind]);

  if (failed) return <Text style={styles.message}>These pictures couldn&apos;t be loaded. Please try again.</Text>;
  if (!lesson) return <ActivityIndicator color={colors.primary} style={styles.spinner} />;

  return (
    <View style={styles.grid}>
      {lesson.items.map((entry) => (
        <View key={entry.id} style={styles.cell}>
          {entry.visual.type === 'image' ? (
            <Image source={entry.visual.source} contentFit="cover" style={styles.picture} accessibilityLabel={entry.word} />
          ) : null}
          <Text style={styles.word} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {entry.word}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  spinner: {
    marginVertical: 12,
  },
  message: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.error,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 4,
  },
  cell: {
    width: '31%',
    gap: 2,
  },
  picture: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.sm,
  },
  word: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
});
