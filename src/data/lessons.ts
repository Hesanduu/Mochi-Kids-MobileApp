// The ready-made lessons in the Activities library.

export type LessonVisual =
  | { type: 'color'; hex: string }
  | { type: 'image'; source: number | { uri: string } }; // bundled (require) or saved picture

export type LessonItem = {
  id: string;
  word: string; // shown to the parent, e.g. "Yellow"
  question: string; // what Mochi says, e.g. "Show me the yellow"
  visual: LessonVisual;
};

export type Lesson = {
  id: string;
  title: string;
  items: LessonItem[];
};

function colorItem(word: string, hex: string): LessonItem {
  return {
    id: word.toLowerCase(),
    word,
    question: `Show me the ${word.toLowerCase()}`,
    visual: { type: 'color', hex },
  };
}

// These hex values are lesson content, not app theme colours. They are strong
// and far apart so a 3-year-old can tell them apart easily.
const COLOURS: Lesson = {
  id: 'colours',
  title: 'Colours',
  items: [
    colorItem('Red', '#E8402F'),
    colorItem('Blue', '#1E88E5'),
    colorItem('Yellow', '#F7CB15'),
    colorItem('Green', '#43B649'),
    colorItem('Orange', '#FF8A1F'),
    colorItem('Purple', '#8E4EC6'),
    colorItem('Pink', '#FF7EB6'),
    colorItem('Brown', '#8B5A2B'),
  ],
};

function animalItem(word: string, source: number): LessonItem {
  return {
    id: word.toLowerCase(),
    word,
    question: `Show me the ${word.toLowerCase()}`,
    visual: { type: 'image', source },
  };
}

// Drawn once by server/scripts/drawAnimals.js and bundled with the app.
const ANIMALS: Lesson = {
  id: 'animals',
  title: 'Animals',
  items: [
    animalItem('Dog', require('@/assets/lessons/animals/dog.jpg')),
    animalItem('Cat', require('@/assets/lessons/animals/cat.jpg')),
    animalItem('Cow', require('@/assets/lessons/animals/cow.jpg')),
    animalItem('Duck', require('@/assets/lessons/animals/duck.jpg')),
    animalItem('Fish', require('@/assets/lessons/animals/fish.jpg')),
    animalItem('Rabbit', require('@/assets/lessons/animals/rabbit.jpg')),
    animalItem('Elephant', require('@/assets/lessons/animals/elephant.jpg')),
    animalItem('Lion', require('@/assets/lessons/animals/lion.jpg')),
  ],
};

export const PRESET_LESSONS: Lesson[] = [COLOURS, ANIMALS];

export function getPresetLesson(id: string) {
  return PRESET_LESSONS.find((lesson) => lesson.id === id);
}
