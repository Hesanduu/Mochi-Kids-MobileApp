import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { Confetti } from '@/components/game/Confetti';
import { StarRow } from '@/components/game/StarRow';
import { Mochi } from '@/components/Mochi';
import { colors, fonts } from '@/constants/theme';

const SPIN = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '360deg' }] },
};

const JUMP = {
  '0%': { transform: [{ translateY: 0 }, { rotate: '-5deg' }] },
  '50%': { transform: [{ translateY: -34 }, { rotate: '0deg' }] },
  '100%': { transform: [{ translateY: 0 }, { rotate: '5deg' }] },
};

const CLAP_LEFT = {
  from: { transform: [{ translateX: -10 }, { rotate: '-18deg' }] },
  to: { transform: [{ translateX: 18 }, { rotate: '8deg' }] },
};

const CLAP_RIGHT = {
  from: { transform: [{ translateX: 10 }, { rotate: '18deg' }] },
  to: { transform: [{ translateX: -18 }, { rotate: '-8deg' }] },
};

const RAY_COUNT = 6; // each ray crosses the middle, so this draws 12 spokes
const RAY_WIDTH = 64;
const HAND_WIDTH = 46;

const loop = (duration: number) =>
  ({
    animationDuration: duration,
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
    animationTimingFunction: 'ease-in-out',
  }) as const;

type CelebrationProps = {
  stars: number;
  praise: string;
  maxStars?: number;
};

// Full-screen party: spinning sun rays and confetti behind a big, jumping,
// clapping Mochi. With "reduce motion" switched on, it stays still.
export function Celebration({ stars, praise, maxStars }: CelebrationProps) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const mochiSize = Math.min(width * 0.74, height * 0.42);
  const raysSize = Math.ceil(Math.hypot(width, height)) + 40;

  return (
    <Animated.View style={styles.screen} entering={FadeIn.duration(180)} accessibilityViewIsModal>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.rays,
          {
            width: raysSize,
            height: raysSize,
            left: (width - raysSize) / 2,
            top: (height - raysSize) / 2,
          },
          reducedMotion
            ? undefined
            : {
                animationName: SPIN,
                animationDuration: 16000,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              },
        ]}
      >
        {Array.from({ length: RAY_COUNT }, (_, i) => (
          <View
            key={i}
            style={[
              styles.ray,
              {
                height: raysSize,
                left: (raysSize - RAY_WIDTH) / 2,
                transform: [{ rotate: `${(i * 180) / RAY_COUNT}deg` }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {reducedMotion ? null : <Confetti />}

      <StarRow stars={stars} total={maxStars} size={maxStars === 5 ? 46 : 58} pop />

      <Animated.View
        style={[
          { width: mochiSize, height: mochiSize },
          reducedMotion ? undefined : { animationName: JUMP, ...loop(420) },
        ]}
      >
        <Mochi size={mochiSize} />
        {reducedMotion ? null : (
          <>
            <Animated.View
              style={[
                styles.hand,
                { left: mochiSize / 2 - HAND_WIDTH - 12, bottom: mochiSize * 0.2 },
                { animationName: CLAP_LEFT, ...loop(210) },
              ]}
            />
            <Animated.View
              style={[
                styles.hand,
                { left: mochiSize / 2 + 12, bottom: mochiSize * 0.2 },
                { animationName: CLAP_RIGHT, ...loop(210) },
              ]}
            />
          </>
        )}
      </Animated.View>

      <Text style={styles.praise} accessibilityLiveRegion="polite">
        {praise}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
    backgroundColor: colors.skySoft,
    overflow: 'hidden',
  },
  rays: {
    position: 'absolute',
  },
  ray: {
    position: 'absolute',
    top: 0,
    width: RAY_WIDTH,
    backgroundColor: colors.yellowSoft,
  },
  hand: {
    position: 'absolute',
    width: HAND_WIDTH,
    height: 62,
    borderRadius: 23,
    backgroundColor: colors.mochiHand,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  praise: {
    fontFamily: fonts.headingBold,
    fontSize: 38,
    lineHeight: 48,
    color: colors.text,
    textAlign: 'center',
  },
});
