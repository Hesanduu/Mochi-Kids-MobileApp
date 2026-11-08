import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { colors } from '@/constants/theme';
import { MAX_STARS_PER_PAGE } from '@/lib/game';

const POP_IN = {
  from: { opacity: 0, transform: [{ scale: 0.6 }] },
  '60%': { opacity: 1, transform: [{ scale: 1.2 }] },
  to: { opacity: 1, transform: [{ scale: 1 }] },
};

type StarRowProps = {
  stars: number;
  size: number;
  // How many stars to show. Talk with Mochi uses 5.
  total?: number;
  // Stars pop in one after another (used in the celebration).
  pop?: boolean;
};

export function StarRow({ stars, size, total = MAX_STARS_PER_PAGE, pop = false }: StarRowProps) {
  const reducedMotion = useReducedMotion();

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${stars} out of ${total} stars`}
    >
      {Array.from({ length: total }, (_, i) => (
        <Animated.View
          key={i}
          style={
            pop && !reducedMotion
              ? {
                  animationName: POP_IN,
                  animationDuration: 420,
                  animationDelay: 150 + i * 160,
                  animationFillMode: 'both',
                }
              : undefined
          }
        >
          <SymbolView
            name={{ ios: 'star.fill', android: 'star', web: 'star' }}
            size={size}
            tintColor={i < stars ? colors.yellow : colors.divider}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
});
