import { Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';
import type { LessonItem } from '@/data/lessons';

type ChoiceCardProps = {
  item: LessonItem;
  // wrong = already tried and faded out; glow = the answer, shown to the child
  state: 'normal' | 'wrong' | 'glow';
  disabled: boolean;
  onPress: () => void;
};

const GLOW = {
  from: { transform: [{ scale: 1 }] },
  to: { transform: [{ scale: 1.05 }] },
};

export function ChoiceCard({ item, state, disabled, onPress }: ChoiceCardProps) {
  const reducedMotion = useReducedMotion();
  const glowing = state === 'glow';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={item.word}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: item.visual.type === 'color' ? item.visual.hex : colors.surface },
          glowing && styles.glow,
          // A wrong choice fades away, so fewer choices are left.
          { opacity: state === 'wrong' ? 0.18 : 1, transitionProperty: 'opacity', transitionDuration: 200 },
          glowing && !reducedMotion
            ? {
                animationName: GLOW,
                animationDuration: 550,
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                animationTimingFunction: 'ease-in-out',
              }
            : undefined,
        ]}
      >
        {item.visual.type === 'image' ? (
          // contain: the whole picture always shows, whatever the card's shape.
          <Image source={item.visual.source} contentFit="contain" style={styles.picture} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  card: {
    flex: 1,
    borderRadius: radius.xxl,
    borderWidth: 4,
    borderColor: colors.surface,
    overflow: 'hidden',
  },
  picture: {
    flex: 1,
  },
  glow: {
    borderWidth: 6,
    borderColor: colors.yellowShadow,
  },
});
