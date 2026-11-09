// The rules of a lesson, kept apart from the screens so they are easy to read.
import type { Lesson, LessonItem } from '@/data/lessons';

export type GamePage = {
  item: LessonItem; // the right answer
  choices: LessonItem[]; // always 4, in random order
};

// What happened on one page. Saved by src/lib/attempts.ts.
export type PageResult = {
  answer: string;
  stars: number;
  tries: number;
  wrongPicks: string[];
};

// Links a finished activity back to the weekly plan that scheduled it.
export type PlanLink = { weekId: string; itemId: string };

// How an activity was opened. From the normal library, both are empty.
export type Practice = { focusWords: string[]; planLink?: PlanLink };

export const CHOICES_PER_PAGE = 4;
export const MAX_STARS_PER_PAGE = 3;
const MIN_ITEMS_WITH_FOCUS = 5;

const PRAISE = ['Yay! You did it!', 'Great job!', 'Wow, you got it!', 'Hooray! That is right!', 'You are a star!'];

export function randomPraise() {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

export function shuffle<T>(list: T[]) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Reads how an activity was opened from its screen address.
export function parsePractice(params: { planWeek?: string; planItem?: string; focus?: string }): Practice {
  const focusWords = params.focus ? params.focus.split('|').filter(Boolean) : [];
  const planLink = params.planWeek && params.planItem ? { weekId: params.planWeek, itemId: params.planItem } : undefined;
  return { focusWords, planLink };
}

// Which words to use. A planned practice starts with its tricky words and tops up
// to a short session. Otherwise it's all the words, in random order.
export function chooseItems<T extends { word: string }>(items: T[], focusWords: string[]): T[] {
  const isFocus = (item: T) => focusWords.includes(item.word);
  const focus = items.filter(isFocus);
  if (focus.length === 0) return shuffle(items);

  const others = shuffle(items.filter((item) => !isFocus(item)));
  return [...shuffle(focus), ...others].slice(0, Math.max(focus.length, MIN_ITEMS_WITH_FOCUS));
}

// One page per chosen item: the right answer plus 3 others from the same lesson.
export function buildPages(lesson: Lesson, focusWords: string[] = []): GamePage[] {
  return chooseItems(lesson.items, focusWords).map((item) => {
    const others = shuffle(lesson.items.filter((other) => other.id !== item.id));
    return { item, choices: shuffle([item, ...others.slice(0, CHOICES_PER_PAGE - 1)]) };
  });
}

// 1st try = 3 stars, 2nd = 2, 3rd = 1, the last choice left = 0.
export function starsForTry(tries: number) {
  return Math.max(MAX_STARS_PER_PAGE + 1 - tries, 0);
}

// Stars earned as a percentage of all the stars available in the lesson.
export function scorePercent(results: { stars: number }[], maxStarsPerPage = MAX_STARS_PER_PAGE) {
  if (results.length === 0) return 0;
  const earned = results.reduce((total, page) => total + page.stars, 0);
  return Math.round((earned / (results.length * maxStarsPerPage)) * 100);
}
