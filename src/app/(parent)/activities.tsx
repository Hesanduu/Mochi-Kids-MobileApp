import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ActivityCard';
import { ChunkyButton } from '@/components/ChunkyButton';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useChildren } from '@/context/ChildrenContext';
import { PRESET_LESSONS } from '@/data/lessons';
import { errorMessage } from '@/lib/api';
import { deleteSavedLesson, useSavedLessons, type SavedLessonSummary } from '@/lib/lessonStore';

// The library of lessons, plus the other things to do with Mochi.
export default function ActivitiesScreen() {
  const insets = useSafeAreaInsets();
  const { selectedChild } = useChildren();
  const savedLessons = useSavedLessons();
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openLesson = (lessonId: string) => {
    if (!selectedChild) {
      Alert.alert('Add a child first', 'Scores are kept for each child, so please add your child before playing.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Add a child', onPress: () => router.push('/add-child') },
      ]);
      return;
    }
    router.push({ pathname: '/play/[lessonId]', params: { lessonId } });
  };

  const deleteLesson = async (lesson: SavedLessonSummary) => {
    if (!user) return;
    setDeletingId(lesson.id);
    try {
      await deleteSavedLesson(user.uid, lesson.id);
    } catch (err) {
      Alert.alert('Could not delete', errorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (lesson: SavedLessonSummary) => {
    Alert.alert(
      `Delete ${lesson.title}?`,
      'This removes the lesson, its pictures and every child\u2019s scores for it. This can\u2019t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteLesson(lesson) },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
    >
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Activities</Text>
        <Text style={styles.subtitle}>Fun things to explore with Mochi.</Text>
      </View>

      <ChunkyButton
        label="Create with AI"
        variant="fun"
        height={52}
        onPress={() => router.push('/create-lesson')}
        icon={<SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={18} tintColor={colors.text} />}
      />

      <Text style={styles.sectionTitle}>Lessons</Text>
      <View style={styles.grid}>
        {PRESET_LESSONS.map((lesson) => (
          <Pressable
            key={lesson.id}
            onPress={() => openLesson(lesson.id)}
            accessibilityRole="button"
            accessibilityLabel={`Play ${lesson.title}`}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          >
            <View style={styles.swatches}>
              {lesson.items.slice(0, 4).map((item) => (
                item.visual.type === 'color' ? (
                  <View key={item.id} style={[styles.swatch, { backgroundColor: item.visual.hex }]} />
                ) : (
                  <Image key={item.id} source={item.visual.source} contentFit="cover" style={styles.swatch} />
                )
              ))}
            </View>
            <Text style={styles.tileTitle}>{lesson.title}</Text>
            <Text style={styles.tileText}>{lesson.items.length} pages</Text>
          </Pressable>
        ))}

        {savedLessons.map((lesson) => (
          <Pressable
            key={lesson.id}
            onPress={() => openLesson(lesson.id)}
            accessibilityRole="button"
            accessibilityLabel={`Play ${lesson.title}`}
            style={({ pressed }) => [styles.tile, styles.aiTile, pressed && styles.tilePressed]}
          >
            <View style={styles.swatches}>
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                size={30}
                tintColor={colors.primary}
              />
            </View>
            <Text style={styles.tileTitle}>{lesson.title}</Text>
            <Text style={styles.tileText}>{lesson.pageCount} pages · Made with AI</Text>

            <Pressable
              onPress={() => confirmDelete(lesson)}
              disabled={deletingId !== null}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${lesson.title}`}
              style={styles.deleteButton}
            >
              {deletingId === lesson.id ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={20} tintColor={colors.error} />
              )}
            </Pressable>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>More fun</Text>
      <ActivityCard
        title="See Images"
        subtitle="Find photos and make pictures"
        icon={{ ios: 'photo.on.rectangle.angled', android: 'photo_library' }}
        onPress={() => router.push('/see-images')}
      />
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
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 21,
    lineHeight: 28,
    color: colors.text,
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
    backgroundColor: colors.yellowSoft,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    justifyContent: 'flex-end',
    gap: 2,
  },
  aiTile: {
    backgroundColor: colors.skySoft,
    borderColor: colors.sky,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: TAP_TARGET,
    height: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
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
