import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { Mochi } from '@/components/Mochi';
import { colors } from '@/constants/theme';

const RING = {
  from: { opacity: 0.55, transform: [{ scale: 0.82 }] },
  to: { opacity: 0, transform: [{ scale: 1.2 }] },
};

const TILT = {
  from: { transform: [{ rotate: '-5deg' }] },
  to: { transform: [{ rotate: '5deg' }] },
};

// Mochi leaning in to listen, with sound rings and a microphone badge.
export function ListeningMochi({ size }: { size: number }) {
  const reducedMotion = useReducedMotion();

  return (
    <View style={{ width: size, height: size }} accessibilityLabel="Mochi is listening">
      {reducedMotion
        ? null
        : [0, 700].map((delay) => (
            <Animated.View
              key={delay}
              style={[
                styles.ring,
                {
                  animationName: RING,
                  animationDuration: 1400,
                  animationDelay: delay,
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-out',
                },
              ]}
            />
          ))}
      <Animated.View
        style={
          reducedMotion
            ? undefined
            : {
                animationName: TILT,
                animationDuration: 900,
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                animationTimingFunction: 'ease-in-out',
              }
        }
      >
        <Mochi size={size} />
      </Animated.View>
      <View style={styles.badge}>
        <SymbolView name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }} size={20} tintColor={colors.surface} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: colors.sky,
  },
  badge: {
    position: 'absolute',
    right: 2,
    bottom: 6,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
