import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { Dots } from '@/components/Dots';
import { colors, fonts, radius } from '@/constants/theme';
import { useChildren } from '@/context/ChildrenContext';
import { useWeeklyPlans, useWeeklyReports } from '@/lib/agent';

type Tile = {
  title: string;
  detail: string;
  icon: { ios: SFSymbol; android: AndroidSymbol };
  route: '/activities' | '/talk' | '/plan';
  color: string;
  darkColor: string;
};

const TILES: Tile[] = [
  {
    title: 'Activities',
    detail: 'Play and earn stars',
    icon: { ios: 'square.grid.2x2.fill', android: 'apps' },
    route: '/activities',
    color: colors.coral,
    darkColor: colors.coralDark,
  },
  {
    title: 'Talk with Mochi',
    detail: 'Say new words',
    icon: { ios: 'mic.fill', android: 'mic' },
    route: '/talk',
    color: colors.green,
    darkColor: colors.greenDark,
  },
  {
    title: 'Plan',
    detail: 'Reports and progress',
    icon: { ios: 'calendar', android: 'calendar_month' },
    route: '/plan',
    color: colors.lilac,
    darkColor: colors.lilacDark,
  },
];

// Below this height there is only room for the icon and the title.
const HEIGHT_FOR_DETAILS = 150;

// Three bright windows, side by side, that open the main parts of the app.
export function FeatureTiles() {
  const { selectedChild } = useChildren();
  const { items: plans } = useWeeklyPlans(selectedChild?.id);
  const { items: reports } = useWeeklyReports(selectedChild?.id);
  const [showDetails, setShowDetails] = useState(true);

  // Something is waiting for the parent, so the Plan window shows a badge.
  const planHasNews = plans[0]?.status === 'pending_review' || reports[0]?.seenAt === null;

  return (
    <View style={styles.row} onLayout={(event) => setShowDetails(event.nativeEvent.layout.height >= HEIGHT_FOR_DETAILS)}>
      {TILES.map((tile) => {
        const hasBadge = tile.route === '/plan' && planHasNews;
        return (
          <Pressable
            key={tile.route}
            onPress={() => router.push(tile.route)}
            accessibilityRole="button"
            accessibilityLabel={`${tile.title}. ${tile.detail}.${hasBadge ? ' Something new is waiting.' : ''}`}
            style={({ pressed }) => [
              styles.tile,
              { backgroundColor: tile.color, borderBottomColor: tile.darkColor },
              pressed && styles.pressed,
            ]}
          >
            <Dots
              dots={[
                { size: 10, color: colors.surface, opacity: 0.55, left: 10, top: 12 },
                { size: 7, color: colors.surface, opacity: 0.55, right: 12, bottom: 16 },
              ]}
            />

            {hasBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>NEW</Text>
              </View>
            ) : null}

            <View style={styles.iconCircle}>
              <SymbolView name={{ ...tile.icon, web: tile.icon.android }} size={24} tintColor={tile.darkColor} />
            </View>

            <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
              {tile.title}
            </Text>
            {showDetails ? (
              <Text style={styles.detail} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                {tile.detail}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 100,
    maxHeight: 240,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radius.xxl,
    borderBottomWidth: 5,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.surface,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 17,
    lineHeight: 21,
    color: colors.text,
    textAlign: 'center',
  },
  detail: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 19,
    color: colors.text,
    textAlign: 'center',
  },
});
