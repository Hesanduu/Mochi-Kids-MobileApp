import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Dots } from '@/components/Dots';
import { Mochi } from '@/components/Mochi';
import { colors, TAP_TARGET } from '@/constants/theme';

type ScreenBannerProps = {
  onBack: () => void;
  backLabel: string;
};

// The light blue strip with a back button and a small Mochi.
export function ScreenBanner({ onBack, backLabel }: ScreenBannerProps) {
  return (
    <View style={styles.banner}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={backLabel} style={styles.backButton}>
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back_ios_new' }}
          size={20}
          tintColor={colors.text}
        />
      </Pressable>
      <Dots
        dots={[
          { size: 12, color: colors.yellow, left: 120, top: 22 },
          { size: 9, color: colors.green, left: 168, top: 62 },
          { size: 8, color: colors.red, opacity: 0.7, left: 214, top: 30 },
        ]}
      />
      <View style={styles.spacer} />
      <Mochi size={104} style={styles.mochi} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.skySoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 12,
    overflow: 'hidden',
  },
  backButton: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    borderRadius: TAP_TARGET / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  mochi: {
    marginTop: 10,
  },
});
