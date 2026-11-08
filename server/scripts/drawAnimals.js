// One-off script: draws the pictures for the ready-made Animals lesson, using
// the same safe drawPicture as the rest of the app. The files are bundled with the app.
// Run from server/:  node --env-file=.env scripts/drawAnimals.js
// Pictures that already exist are skipped, so running it again costs nothing extra.
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { drawPicture } from '../ai.js';

const ANIMALS = ['dog', 'cat', 'cow', 'duck', 'fish', 'rabbit', 'elephant', 'lion'];
const OUTPUT_FOLDER = join(import.meta.dirname, '../../assets/lessons/animals');

async function drawAnimal(animal) {
  const file = join(OUTPUT_FOLDER, `${animal}.jpg`);
  if (existsSync(file)) {
    console.log(`Skipped ${animal} (already drawn)`);
    return;
  }

  const picture = await drawPicture(
    `one happy smiling ${animal}, whole body, centred, on a plain soft pastel background`,
  );
  if (!picture) throw new Error(`No picture came back for ${animal}`);

  writeFileSync(file, Buffer.from(picture.imageBase64, 'base64'));
  console.log(`Drew ${animal}`);
}

const results = await Promise.allSettled(ANIMALS.map(drawAnimal));
const failed = results.filter((result) => result.status === 'rejected');
failed.forEach((result) => console.error(result.reason.message));
process.exit(failed.length > 0 ? 1 : 0);
