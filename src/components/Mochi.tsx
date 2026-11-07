import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

type MochiProps = {
  size: number;
  style?: StyleProp<ImageStyle>;
};

// Mochi the mascot. The .webp is animated and transparent; expo-image plays it
// automatically. The still .png shows for a moment while the animation loads.
export function Mochi({ size, style }: MochiProps) {
  return (
    <Image
      source={require('@/assets/mochi/mochi-idle.webp')}
      placeholder={require('@/assets/mochi/mochi.png')}
      contentFit="contain"
      style={[{ width: size, height: size }, style]}
      accessibilityLabel="Mochi waving hello"
    />
  );
}
