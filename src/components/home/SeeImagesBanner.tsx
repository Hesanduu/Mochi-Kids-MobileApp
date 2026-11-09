import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Dots } from '@/components/Dots';
import { colors, fonts, radius } from '@/constants/theme';

// Three of the lesson pictures, laid out like photos on a table.
const PHOTOS = [
  { source: require('@/assets/lessons/animals/dog.jpg'), left: 0, top: 10, rotate: '-10deg' },
  { source: require('@/assets/lessons/animals/cat.jpg'), left: 54, top: 6, rotate: '9deg' },
  { source: require('@/assets/lessons/animals/lion.jpg'), left: 26, top: 44, rotate: '-3deg' },
];

const PHOTO_SIZE = 64; // the positions above are measured at this size

// See Images is the app's star feature on Home, so it gets a bold banner.
export function SeeImagesBanner({ roomy }: { roomy: boolean }) {
  const size = roomy ? PHOTO_SIZE : 48;
  const scale = size / PHOTO_SIZE;

  return (
    <Pressable
      onPress={() => router.push('/see-images')}
      accessibilityRole="button"
      accessibilityLabel="See Images with Mochi. Find photos and make pictures."
      style={({ pressed }) => [styles.banner, roomy ? styles.bannerRoomy : styles.bannerTight, pressed && styles.pressed]}
    >
      <Dots
        dots={[
          { size: 12, color: colors.yellow, left: 170, top: 10 },
          { size: 8, color: colors.green, left: 12, bottom: 8 },
          { size: 7, color: colors.sky, left: 196, bottom: 12 },
        ]}
      />

      <View style={[styles.text, { paddingRight: roomy ? 126 : 96 }]}>
        <Text style={[styles.title, !roomy && styles.titleTight]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
          See Images with Mochi
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          Find photos and make pictures
        </Text>
      </View>

      <View style={[styles.photos, { width: 118 * scale, height: 112 * scale }]}>
        {PHOTOS.map((photo) => (
          <Image
            key={photo.left}
            source={photo.source}
            contentFit="cover"
            style={[
              styles.photo,
              {
                width: size,
                height: size,
                left: photo.left * scale,
                top: photo.top * scale,
                transform: [{ rotate: photo.rotate }],
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.arrow}>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={16}
          tintColor={colors.text}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.xxl,
    backgroundColor: colors.primary,
    borderBottomWidth: 5,
    borderBottomColor: colors.primaryShadow,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerRoomy: {
    minHeight: 124,
    paddingVertical: 14,
    paddingLeft: 18,
  },
  bannerTight: {
    minHeight: 92,
    paddingVertical: 10,
    paddingLeft: 14,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    gap: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 23,
    lineHeight: 28,
    color: colors.surface,
  },
  titleTight: {
    fontSize: 20,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.surface,
  },
  photos: {
    position: 'absolute',
    right: 6,
    top: 4,
  },
  photo: {
    position: 'absolute',
    borderRadius: radius.sm,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  arrow: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
