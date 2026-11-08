// The rules of a lesson, kept apart from the screens so they are easy to read.
import type { Lesson, LessonItem } from '@/data/lessons';

export type GamePage = {
  item: LessonItem; // the right answer
  choices: LessonItem[]; // always 4, in random order
};

// What happened on one page. Stage 3 saves these to the database.
export type PageResult = {
  answer: string;
  stars: number;
  tries: number;
  wrongPicks: string[];
};

export const CHOICES_PER_PAGE = 4;
export const MAX_STARS_PER_PAGE = 3;

const PRAISE = ['Yay! You did it!', 'Great job!', 'Wow, you got it!', 'Hooray! That is right!', 'You are a star!'];

export function randomPraise() {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

function shuffle<T>(list: T[]) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// One page per item: the right answer plus 3 others from the same lesson.
export function buildPages(lesson: Lesson): GamePage[] {
  return shuffle(lesson.items).map((item) => {
    const others = shuffle(lesson.items.filter((other) => other.id !== item.id));
    return { item, choices: shuffle([item, ...others.slice(0, CHOICES_PER_PAGE - 1)]) };
  });
}

// 1st try = 3 stars, 2nd = 2, 3rd = 1, the last choice left = 0.
export function starsForTry(tries: number) {
  return Math.max(MAX_STARS_PER_PAGE + 1 - tries, 0);
}

// Stars earned as a percentage of all the stars available in the lesson.
export function scorePercent(results: PageResult[]) {
  if (results.length === 0) return 0;
  const earned = results.reduce((total, page) => total + page.stars, 0);
  return Math.round((earned / (results.length * MAX_STARS_PER_PAGE)) * 100);
}
