// Child-safety checks run on EVERY search and picture request, before we call
// Unsplash or OpenAI. Order: simple rules → blocked words → AI check.
import { isSafeForKids } from './ai.js';

export const GENTLE_NO =
  "Let's pick something else to look at! How about animals, space or flowers?";

// Words that are never OK for a 3–5 year old. Matched as WHOLE words (plus common
// endings like -s, -ing) after "cleaning" the text (see normalize below), so
// "Gun", "g.u.n", "g u n" and "guns" are caught, but "warm" or "stripes" are not.
// Trickier wording is left to the AI check, which understands context.
const BLOCKED = new Set([
  // adult / sexual
  'sex', 'sexy', 'nude', 'nudes', 'naked', 'nsfw', 'porn', 'porno', 'xxx', 'boob', 'boobs',
  'breast', 'breasts', 'bikini', 'lingerie', 'underwear', 'erotic', 'stripper', 'onlyfans',
  'fetish', 'hentai', 'hot girl', 'kissing',
  // violence / weapons
  'kill', 'killer', 'murder', 'dead', 'death', 'die', 'blood', 'bloody', 'gore', 'gory', 'gun',
  'rifle', 'pistol', 'knife', 'weapon', 'bomb', 'explosion', 'shoot', 'shooting', 'stab', 'war',
  'punch', 'attack', 'terror', 'terrorist', 'torture', 'injury', 'injured', 'wound', 'corpse',
  // scary
  'horror', 'scary', 'zombie', 'demon', 'devil', 'creepy', 'nightmare', 'satan', 'evil',
  // drugs / alcohol / smoking / gambling
  'drug', 'weed', 'cocaine', 'heroin', 'meth', 'alcohol', 'beer', 'wine', 'vodka', 'drunk',
  'cigarette', 'smoking', 'vape', 'casino', 'gamble', 'gambling',
  // self-harm / hate
  'suicide', 'selfharm', 'hate', 'racist', 'nazi', 'slur',
  // tricks aimed at the AI
  'ignore', 'instructions', 'prompt', 'jailbreak',
]);

const ENDINGS = ['', 's', 'es', 'ed', 'ing', 'er', 'y'];

// Lowercase, turn common look-alike characters into letters, drop symbols.
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[0@]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[^a-z\s]/g, '') // "g.u.n" → "gun"
    .replace(/\s+/g, ' ')
    .trim()
    // Join letters typed one at a time: "s e x" → "sex"
    .replace(/\b([a-z]) (?=[a-z]\b)/g, '$1');
}

// True if a word is a blocked word, or a blocked word plus a common ending.
function isBlocked(word) {
  return ENDINGS.some(
    (end) => word.endsWith(end) && BLOCKED.has(word.slice(0, word.length - end.length)),
  );
}

function hasBlockedWord(text) {
  const words = normalize(text).split(' ');
  // Check single words and two-word phrases (e.g. "hot girl").
  return words.some((w, i) => isBlocked(w) || (i > 0 && BLOCKED.has(`${words[i - 1]} ${w}`)));
}

// This message is for parents, who type the lesson topics.
export const LESSON_NO = 'Please add something suitable for ages 3–5 to create an activity.';

// Lesson topics get the same checks as everything else, with messages for parents.
export async function checkLessonTopic(raw) {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text.length < 2) return { ok: false, message: 'Please type a lesson name first.' };
  if (text.length > 40) return { ok: false, message: 'Please use just a word or two for the lesson name.' };

  const check = await checkRequest(text);
  if (!check.ok && check.message === GENTLE_NO) return { ok: false, message: LESSON_NO };
  return check;
}

// True if anything the AI wrote for a lesson contains a blocked word.
export function lessonHasBlockedWord(plan) {
  return [plan.title, ...plan.items.flatMap((item) => [item.word, item.question, item.picture])].some(
    hasBlockedWord,
  );
}

// Returns { ok: true, text } or { ok: false, message }.
export async function checkRequest(raw) {
  const text = typeof raw === 'string' ? raw.trim() : '';

  // 1. Simple rules: short, plain text only.
  if (text.length < 2) return { ok: false, message: 'Type a word or two first!' };
  if (text.length > 100) return { ok: false, message: 'That is a bit long. Try fewer words!' };
  if (!/^[\p{L}\p{N}\s.,!?'-]+$/u.test(text)) return { ok: false, message: GENTLE_NO };
  if (/https?:|www\./i.test(text)) return { ok: false, message: GENTLE_NO };

  // 2. Blocked words.
  if (hasBlockedWord(text)) return { ok: false, message: GENTLE_NO };

  // 3. AI check. If it fails for any reason, we block ("fail closed").
  try {
    const safe = await isSafeForKids(text);
    if (!safe) return { ok: false, message: GENTLE_NO };
  } catch (err) {
    console.error('AI safety check failed:', err.message);
    return { ok: false, message: "Mochi couldn't check that right now. Please try again." };
  }

  return { ok: true, text };
}
