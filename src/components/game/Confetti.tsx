import { useState } from 'react';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors } from '@/constants/theme';

const PIECE_COUNT = 34;
const PIECE_COLORS = [colors.yellow, colors.sky, colors.green, colors.red, colors.primary];

function makePieces(width: number, height: number) {
  return Array.from({ length: PIECE_COUNT }, (_, i) => {
    const drift = -40 + Math.random() * 80;
    const turns = 360 + Math.random() * 540;
    return {
      id: i,
      left: Math.random() * width,
      size: 9 + Math.random() * 8,
      round: i % 3 === 0,
      color: PIECE_COLORS[i % PIECE_COLORS.length],
      duration: 2000 + Math.random() * 1600,
      delay: Math.random() * 1200,
      fall: {
        from: { transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }] },
        to: { transform: [{ translateX: drift }, { translateY: height + 60 }, { rotate: `${turns}deg` }] },
      },
    };
  });
}

// Pieces of paper falling behind Mochi. Only transforms animate, so it stays
// smooth even on older phones.
export function Confetti() {
  const { width, height } = useWindowDimensions();
  const [pieces] = useState(() => makePieces(width, height));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (
        <Animated.View
          key={piece.id}
          style={{
            position: 'absolute',
            top: -30,
            left: piece.left,
            width: piece.size,
            height: piece.round ? piece.size : piece.size * 1.5,
            borderRadius: piece.round ? piece.size / 2 : 3,
            backgroundColor: piece.color,
            animationName: piece.fall,
            animationDuration: piece.duration,
            animationDelay: piece.delay,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
          }}
        />
      ))}
    </View>
  );
}
