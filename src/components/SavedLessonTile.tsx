import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';
import { deleteSaved, type SavedKind, type SavedLessonSummary } from '@/lib/lessonStore';

type SavedLessonTileProps = {
  lesson: SavedLessonSummary;
  kind: SavedKind;
  onPress: () => void;
};

// A tile for something a parent made with AI, with a bin to delete it.
// Used in both Activities and Talk.
export function SavedLessonTile({ lesson, kind, onPress }: SavedLessonTileProps) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteSaved(user.uid, lesson.id, kind);
    } catch (err) {
      Alert.alert('Could not delete', errorMessage(err));
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    const what = kind === 'talkSets' ? 'category' : 'lesson';
    Alert.alert(
      `Delete ${lesson.title}?`,
      `This removes the ${what}, its pictures and every child’s scores for it. This can’t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ],
    );
  };

  const unit = kind === 'talkSets' ? 'words' : 'pages';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${lesson.title}`}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <SymbolView
          name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
          size={30}
          tintColor={colors.primary}
        />
      </View>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.text}>
        {lesson.pageCount} {unit} · Made with AI
      </Text>

      <Pressable
        onPress={confirmDelete}
        disabled={deleting}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${lesson.title}`}
        style={styles.deleteButton}
      >
        {deleting ? (
          <ActivityIndicator color={colors.error} />
        ) : (
          <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={20} tintColor={colors.error} />
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    minHeight: 160,
    padding: 16,
    borderRadius: radius.xxl,
    backgroundColor: colors.skySoft,
    borderWidth: 1.5,
    borderColor: colors.sky,
    justifyContent: 'flex-end',
    gap: 2,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  icon: {
    marginBottom: 'auto',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 22,
    lineHeight: 29,
    color: colors.text,
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textMuted,
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
});
