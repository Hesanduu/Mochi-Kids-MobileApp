import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';

type ChunkyButtonProps = {
  label: string;
  onPress: () => void;
  // primary = blue with white text (main actions); fun = yellow with navy text
  variant?: 'primary' | 'fun';
  height?: number;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// The app's main button: a solid "shadow" block sits under the button,
// and the button sinks onto it when pressed, like a real button.
export function ChunkyButton({
  label,
  onPress,
  variant = 'primary',
  height = 58,
  icon,
  style,
}: ChunkyButtonProps) {
  const isFun = variant === 'fun';
  const depth = isFun ? 4 : 5;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[{ height: height + depth }, style]}
    >
      {({ pressed }) => (
        <>
          {/* The shadow block, offset down by `depth` */}
          <View
            style={[
              styles.shadow,
              {
                top: depth,
                height,
                borderRadius: isFun ? radius.md : radius.lg,
                backgroundColor: isFun ? colors.yellowShadow : colors.primaryShadow,
              },
            ]}
          />
          {/* The button face, which moves down when pressed */}
          <View
            style={[
              styles.face,
              {
                height,
                borderRadius: isFun ? radius.md : radius.lg,
                backgroundColor: isFun ? colors.yellow : colors.primary,
                paddingHorizontal: isFun ? 24 : 16,
                transform: [{ translateY: pressed ? depth - 1 : 0 }],
              },
            ]}
          >
            {icon}
            <Text
              style={[
                styles.label,
                {
                  color: isFun ? colors.text : colors.surface,
                  fontFamily: isFun ? fonts.heading : fonts.headingBold,
                  fontSize: isFun ? 18 : 20,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    // Baloo 2 has tall built-in spacing; this keeps the text centred.
    includeFontPadding: false,
    marginTop: 2,
  },
});
