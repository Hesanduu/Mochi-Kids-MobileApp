import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';

import type { Picture } from '@/lib/api';

// Saves a generated picture to the phone's Photos.
// 1. Write the picture (base64 text) to a temporary file.
// 2. Ask for permission to ADD photos only (we never read the library).
// 3. Copy the file into Photos.
// Returns true if saved, false if permission was refused.
export async function savePictureToPhotos(picture: Picture): Promise<boolean> {
  const permission = await requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) return false;

  const ext = picture.mimeType === 'image/png' ? 'png' : 'jpg';
  const file = new File(Paths.cache, `mochi-picture-${Date.now()}.${ext}`);
  file.create({ overwrite: true });
  await file.write(picture.imageBase64, { encoding: 'base64' });

  try {
    await Asset.create(file.uri);
  } finally {
    file.delete(); // the temporary copy is no longer needed
  }
  return true;
}
