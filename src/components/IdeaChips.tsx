import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';

export type Idea = { emoji: string; label: string; value: string };

type IdeaChipsProps = {
  ideas: Idea[];
  onPick: (idea: Idea) => void;
  disabled?: boolean;
};

// A row of tappable ideas, so little ones can play without typing.
export function IdeaChips({ ideas, onPick, disabled }: IdeaChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {ideas.map((idea) => (
        <Pressable
          key={idea.value}
          onPress={() => onPick(idea)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={idea.label}
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed, disabled && styles.chipDisabled]}
        >
          <Text style={styles.emoji}>{idea.emoji}</Text>
          <Text style={styles.label}>{idea.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TAP_TARGET,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.yellowSoft,
    borderWidth: 1.5,
    borderColor: colors.yellow,
  },
  chipPressed: {
    backgroundColor: colors.yellow,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.text,
  },
});
