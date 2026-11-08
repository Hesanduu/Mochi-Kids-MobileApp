// The scoring rules for Talk with Mochi.
export const MAX_TRIES_PER_WORD = 5;
export const MAX_STARS_PER_WORD = 5;

// What happened with one word. Saved by src/lib/speechAttempts.ts.
export type TalkResult = {
  wordId: string;
  answer: string;
  stars: number;
  tries: number;
  mispronounced: number; // wrong tries plus a slight slip
  slightSlip: boolean;
  gotIt: boolean;
};

// The word the AI checks for: lowercase letters and spaces only, e.g. "Ice-cream" → "ice cream".
export function toSpeechTarget(word: string) {
  return word
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24)
    .trim();
}

// Properly said: 1st try = 5 stars, down to 5th try = 1.
// A slight slip earns one star less, but always at least 1.
export function starsForWord(tries: number, slightSlip: boolean) {
  const stars = MAX_STARS_PER_WORD + 1 - tries;
  return slightSlip ? Math.max(stars - 1, 1) : stars;
}
