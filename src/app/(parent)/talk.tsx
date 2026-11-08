import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { SavedLessonTile } from '@/components/SavedLessonTile';
import { colors, fonts, radius } from '@/constants/theme';
import { useChildren } from '@/context/ChildrenContext';
import { TALK_SETS } from '@/data/talkSets';
import { useSavedLessons } from '@/lib/lessonStore';

// Talk with Mochi has its own tab, separate from Activities.
export default function TalkScreen() {
  const insets = useSafeAreaInsets();
  const { selectedChild, voiceConsent } = useChildren();
  const savedSets = useSavedLessons('talkSets');

  const openSet = (setId: string) => {
    if (!selectedChild) {
      Alert.alert('Add a child first', 'Scores are kept for each child, so please add your child before playing.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Add a child', onPress: () => router.push('/add-child') },
      ]);
      return;
    }
    if (!voiceConsent) {
      router.push({ pathname: '/voice-consent', params: { setId } });
      return;
    }
    router.push({ pathname: '/speak/[setId]', params: { setId } });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Talk with Mochi</Text>
        <Text style={styles.subtitle}>Listen to Mochi, then say the word.</Text>
      </View>

      <ChunkyButton
        label="Create with AI"
        variant="fun"
        height={52}
        onPress={() => router.push({ pathname: '/create-lesson', params: { kind: 'talk' } })}
        icon={<SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={18} tintColor={colors.text} />}
      />

      <View style={styles.grid}>
        {TALK_SETS.map((set) => (
          <Pressable
            key={set.id}
            onPress={() => openSet(set.id)}
            accessibilityRole="button"
            accessibilityLabel={`Talk about ${set.title}`}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          >
            <View style={styles.swatches}>
              {set.words.slice(0, 4).map((word) =>
                word.visual.type === 'color' ? (
                  <View key={word.id} style={[styles.swatch, { backgroundColor: word.visual.hex }]} />
                ) : (
                  <Image key={word.id} source={word.visual.source} contentFit="cover" style={styles.swatch} />
                ),
              )}
            </View>
            <Text style={styles.tileTitle}>{set.title}</Text>
            <Text style={styles.tileText}>{set.words.length} words</Text>
          </Pressable>
        ))}

        {savedSets.map((set) => (
          <SavedLessonTile key={set.id} lesson={set} kind="talkSets" onPress={() => openSet(set.id)} />
        ))}
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
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  tile: {
    width: '48%',
    minHeight: 160,
    padding: 16,
    borderRadius: radius.xxl,
    backgroundColor: colors.greenSoft,
    borderWidth: 1.5,
    borderColor: colors.green,
    justifyContent: 'flex-end',
    gap: 2,
  },
  tilePressed: {
    transform: [{ scale: 0.97 }],
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 'auto',
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  tileTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    lineHeight: 29,
    color: colors.text,
  },
  tileText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textMuted,
  },
});
