// The word sets for Talk with Mochi. They reuse the lesson pictures and colours.
import { ANIMALS, COLOURS, type Lesson, type LessonVisual } from '@/data/lessons';
import { toSpeechTarget } from '@/lib/talkGame';

export type TalkWord = {
  id: string;
  word: string; // shown on screen, e.g. "Yellow"
  target: string; // what the AI checks for, e.g. "yellow"
  teachLine: string; // what Mochi says first
  visual: LessonVisual;
};

export type TalkSet = {
  id: string;
  title: string;
  words: TalkWord[];
};

const COLOUR_WORDS: TalkWord[] = COLOURS.items.map(({ id, word, visual }) => ({
  id,
  word,
  target: word.toLowerCase(),
  teachLine: `This is ${word} colour. Say ${word.toLowerCase()} colour.`,
  visual,
}));

function thingLine(word: string) {
  const lower = word.toLowerCase();
  if (lower === 'grapes') return 'These are grapes. Say grapes.';
  const article = /^[aeiou]/.test(lower) ? 'an' : 'a';
  return `This is ${article} ${lower}. Say ${lower}.`;
}

// A word with its own picture, drawn by server/scripts/drawPictures.js.
function pictureWord(word: string, source: number): TalkWord {
  return {
    id: word.toLowerCase(),
    word,
    target: word.toLowerCase(),
    teachLine: thingLine(word),
    visual: { type: 'image', source },
  };
}

const ANIMAL_WORDS: TalkWord[] = ANIMALS.items.map(({ id, word, visual }) => ({
  id,
  word,
  target: word.toLowerCase(),
  teachLine: thingLine(word),
  visual,
}));

const FRUIT_WORDS: TalkWord[] = [
  pictureWord('Apple', require('@/assets/talk/fruits/apple.jpg')),
  pictureWord('Banana', require('@/assets/talk/fruits/banana.jpg')),
  pictureWord('Orange', require('@/assets/talk/fruits/orange.jpg')),
  pictureWord('Grapes', require('@/assets/talk/fruits/grapes.jpg')),
  pictureWord('Strawberry', require('@/assets/talk/fruits/strawberry.jpg')),
  pictureWord('Pear', require('@/assets/talk/fruits/pear.jpg')),
  pictureWord('Watermelon', require('@/assets/talk/fruits/watermelon.jpg')),
  pictureWord('Mango', require('@/assets/talk/fruits/mango.jpg')),
];

const VEHICLE_WORDS: TalkWord[] = [
  pictureWord('Car', require('@/assets/talk/vehicles/car.jpg')),
  pictureWord('Bus', require('@/assets/talk/vehicles/bus.jpg')),
  pictureWord('Train', require('@/assets/talk/vehicles/train.jpg')),
  pictureWord('Boat', require('@/assets/talk/vehicles/boat.jpg')),
  pictureWord('Bike', require('@/assets/talk/vehicles/bike.jpg')),
  pictureWord('Airplane', require('@/assets/talk/vehicles/airplane.jpg')),
  pictureWord('Truck', require('@/assets/talk/vehicles/truck.jpg')),
  pictureWord('Helicopter', require('@/assets/talk/vehicles/helicopter.jpg')),
];

export const TALK_SETS: TalkSet[] = [
  { id: 'colours', title: 'Colours', words: COLOUR_WORDS },
  { id: 'animals', title: 'Animals', words: ANIMAL_WORDS },
  { id: 'fruits', title: 'Fruits', words: FRUIT_WORDS },
  { id: 'vehicles', title: 'Vehicles', words: VEHICLE_WORDS },
];

// Turns a category a parent made with AI into a set Mochi can teach. The wording
// has no "a" or "an", so it works for any word, including ones like "blocks".
export function talkSetFromSaved(saved: Lesson): TalkSet {
  return {
    id: saved.id,
    title: saved.title,
    words: saved.items.map(({ id, word, visual }) => ({
      id,
      word,
      target: toSpeechTarget(word),
      teachLine: `Look! ${word}. Say ${toSpeechTarget(word)}.`,
      visual,
    })),
  };
}

export function getTalkSet(id: string) {
  return TALK_SETS.find((set) => set.id === id);
}
