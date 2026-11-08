// One-off script: draws the ready-made pictures, using the same safe drawPicture
// as the rest of the app. The files are bundled with the app.
// Run from server/:  node --env-file=.env scripts/drawPictures.js
// Pictures that already exist are skipped, so running it again costs nothing extra.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { drawPicture } from '../ai.js';

const ASSETS = join(import.meta.dirname, '../../assets');

const SETS = [
  {
    folder: 'lessons/animals',
    describe: (name) => `one happy smiling ${name}, whole body, centred, on a plain soft pastel background`,
    names: ['dog', 'cat', 'cow', 'duck', 'fish', 'rabbit', 'elephant', 'lion'],
  },
  {
    folder: 'talk/fruits',
    describe: (name) => `${name === 'grapes' ? 'one bunch of grapes' : `one ${name}`}, whole fruit, large and centred, on a plain soft pastel background`,
    names: ['apple', 'banana', 'orange', 'grapes', 'strawberry', 'pear', 'watermelon', 'mango'],
  },
  {
    folder: 'talk/vehicles',
    describe: (name) => `one friendly ${name}, the whole vehicle, large and centred, on a plain soft pastel background, no people`,
    names: ['car', 'bus', 'train', 'boat', 'bike', 'airplane', 'truck', 'helicopter'],
  },
];

async function drawOne(set, name) {
  const file = join(ASSETS, set.folder, `${name}.jpg`);
  if (existsSync(file)) {
    console.log(`Skipped ${name} (already drawn)`);
    return;
  }
  const picture = await drawPicture(set.describe(name));
  if (!picture) throw new Error(`No picture came back for ${name}`);
  writeFileSync(file, Buffer.from(picture.imageBase64, 'base64'));
  console.log(`Drew ${name}`);
}

for (const set of SETS) mkdirSync(join(ASSETS, set.folder), { recursive: true });
const results = await Promise.allSettled(SETS.flatMap((set) => set.names.map((name) => drawOne(set, name))));
const failed = results.filter((result) => result.status === 'rejected');
failed.forEach((result) => console.error(result.reason.message));
process.exit(failed.length > 0 ? 1 : 0);
