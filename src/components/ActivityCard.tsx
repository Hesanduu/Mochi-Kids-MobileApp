import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { colors, fonts, radius } from '@/constants/theme';

type ActivityCardProps = {
  title: string;
  subtitle: string;
  icon: { ios: SFSymbol; android: AndroidSymbol };
  onPress: () => void;
  compact?: boolean; // a shorter card, for screens with little room
};

// A big, friendly card that opens an activity (used on Home and in Activities).
export function ActivityCard({ title, subtitle, icon, onPress, compact = false }: ActivityCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconTile, compact && styles.iconTileCompact]}>
        <SymbolView name={{ ...icon, web: icon.android }} size={26} tintColor={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={18}
        tintColor={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    minHeight: 84,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.sky,
  },
  cardCompact: {
    minHeight: 68,
    padding: 10,
  },
  cardPressed: {
    backgroundColor: colors.skySoft,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileCompact: {
    width: 44,
    height: 44,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 19,
    lineHeight: 25,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
