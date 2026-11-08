import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';

// What Mochi is saying, for grown-ups and children who are starting to read.
export function SpeechBubble({ text }: { text: string }) {
  return (
    <View style={styles.bubble}>
      <View style={styles.tail} />
      <Text
        style={styles.text}
        numberOfLines={5}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        accessibilityLiveRegion="polite"
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.sky,
  },
  // A small turned square that pokes out of the left edge, towards Mochi.
  tail: {
    position: 'absolute',
    left: -9,
    top: '50%',
    width: 16,
    height: 16,
    backgroundColor: colors.surface,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.sky,
    transform: [{ rotate: '45deg' }],
  },
  text: {
    fontFamily: fonts.heading,
    fontSize: 25,
    lineHeight: 32,
    color: colors.text,
  },
});
