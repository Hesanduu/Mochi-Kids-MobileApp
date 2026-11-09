import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { colors, fonts, radius } from '@/constants/theme';
import { useAttempts } from '@/lib/attempts';
import { useSpeechAttempts } from '@/lib/speechAttempts';

type TileProps = {
  title: string;
  icon: { ios: SFSymbol; android: AndroidSymbol };
  count: number;
  loading: boolean;
  tileStyle: object;
  iconColor: string;
  onPress: () => void;
};

function Tile({ title, icon, count, loading, tileStyle, iconColor, onPress }: TileProps) {
  const played = count === 0 ? 'Not played yet' : `${count} played`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${played}. See progress.`}
      style={({ pressed }) => [styles.tile, tileStyle, pressed && styles.pressed]}
    >
      <View style={styles.iconCircle}>
        <SymbolView name={{ ...icon, web: icon.android }} size={22} tintColor={iconColor} />
      </View>

      <Text style={styles.tileTitle}>{title}</Text>
      {/* A space keeps the tile the same height while the count loads. */}
      <Text style={styles.count}>{loading ? ' ' : played}</Text>

      <View style={styles.footer}>
        <Text style={styles.link}>See progress</Text>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={15}
          tintColor={colors.primary}
        />
      </View>
    </Pressable>
  );
}

// Progress used to be its own tab. These two tiles open the full scores and history.
export function ProgressOverviewCard({ childId }: { childId: string }) {
  const { attempts, loading: loadingAttempts } = useAttempts(childId);
  const { items: speechAttempts, loading: loadingSpeech } = useSpeechAttempts(childId);

  const open = (part: 'activities' | 'speaking') => router.push({ pathname: '/progress', params: { part } });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Progress</Text>
      <View style={styles.row}>
        <Tile
          title="Activities"
          icon={{ ios: 'square.grid.2x2.fill', android: 'apps' }}
          count={attempts.length}
          loading={loadingAttempts}
          tileStyle={styles.activitiesTile}
          iconColor={colors.yellowShadow}
          onPress={() => open('activities')}
        />
        <Tile
          title="Speaking"
          icon={{ ios: 'mic.fill', android: 'mic' }}
          count={speechAttempts.length}
          loading={loadingSpeech}
          tileStyle={styles.speakingTile}
          iconColor={colors.greenDark}
          onPress={() => open('speaking')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 21,
    lineHeight: 28,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    padding: 14,
    borderRadius: radius.xxl,
    borderWidth: 1.5,
  },
  activitiesTile: {
    backgroundColor: colors.yellowSoft,
    borderColor: colors.yellow,
  },
  speakingTile: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  count: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 10,
  },
  link: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.primary,
  },
});
