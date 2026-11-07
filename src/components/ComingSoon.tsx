import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Mochi } from '@/components/Mochi';
import { colors, fonts } from '@/constants/theme';

// Placeholder for tabs we haven't built yet.
export function ComingSoon({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Mochi size={160} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>Coming soon with Mochi!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textMuted,
  },
});
