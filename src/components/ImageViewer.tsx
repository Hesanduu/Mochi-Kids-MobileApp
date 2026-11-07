import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { colors, fonts, TAP_TARGET } from '@/constants/theme';
import type { Photo, Picture } from '@/lib/api';
import { savePictureToPhotos } from '@/lib/savePicture';

// What the viewer is showing: an Unsplash photo (view only)
// or a picture Mochi drew (can be saved).
export type ViewerItem = { kind: 'photo'; photo: Photo } | { kind: 'picture'; picture: Picture };

type SaveState = 'idle' | 'saving' | 'saved' | 'denied' | 'failed';

type ImageViewerProps = {
  item: ViewerItem | null; // null = closed
  onClose: () => void;
};

export function ImageViewer({ item, onClose }: ImageViewerProps) {
  const insets = useSafeAreaInsets();
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Reset the "Saved!" message on close, so the next image starts fresh.
  const close = () => {
    setSaveState('idle');
    onClose();
  };

  const uri =
    item?.kind === 'photo'
      ? item.photo.fullUrl
      : item
        ? `data:${item.picture.mimeType};base64,${item.picture.imageBase64}`
        : undefined;

  const handleSave = async () => {
    if (item?.kind !== 'picture') return;
    setSaveState('saving');
    try {
      const saved = await savePictureToPhotos(item.picture);
      setSaveState(saved ? 'saved' : 'denied');
    } catch {
      setSaveState('failed');
    }
  };

  return (
    <Modal visible={item !== null} animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.closeButton}
        >
          <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={20} tintColor={colors.text} />
        </Pressable>

        <View style={styles.imageArea}>
          {uri && (
            <Image
              source={{ uri }}
              style={[
                styles.image,
                item?.kind === 'photo' && { backgroundColor: item.photo.color },
              ]}
              contentFit="contain"
              accessibilityLabel={item?.kind === 'photo' ? item.photo.alt || 'Photo' : 'Picture Mochi drew'}
            />
          )}
        </View>

        {item?.kind === 'photo' && (
          // Plain text credit: no external links in kid screens (claude.md).
          <Text style={styles.credit}>
            Photo by {item.photo.photographer} on Unsplash
          </Text>
        )}

        {item?.kind === 'picture' && (
          <View style={styles.saveArea}>
            {saveState === 'saved' ? (
              <Text style={[styles.status, styles.statusGood]}>Saved to your photos!</Text>
            ) : (
              <ChunkyButton
                label={saveState === 'saving' ? 'Saving…' : 'Save to phone'}
                variant="fun"
                height={54}
                onPress={saveState === 'saving' ? () => {} : handleSave}
                icon={
                  <SymbolView
                    name={{ ios: 'square.and.arrow.down', android: 'download', web: 'download' }}
                    size={20}
                    tintColor={colors.text}
                  />
                }
              />
            )}
            {saveState === 'denied' && (
              <Text style={styles.status}>
                To save pictures, allow Mochi Kids to add photos in your phone&apos;s Settings.
              </Text>
            )}
            {saveState === 'failed' && (
              <Text style={styles.status}>Saving didn&apos;t work. Please try again.</Text>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.skySoft,
    paddingHorizontal: 20,
    gap: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: TAP_TARGET,
    height: TAP_TARGET,
    borderRadius: TAP_TARGET / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  credit: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  saveArea: {
    gap: 10,
  },
  status: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statusGood: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 17,
    color: colors.greenDark,
    paddingVertical: 14,
  },
});
