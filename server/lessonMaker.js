// Makes a whole lesson from one topic word: safety checks, words, then pictures.
// The Create screens and the Learning Path Agent both come through here, so
// everything a child can see goes through exactly the same checks.
import { drawPicture, planLesson } from './ai.js';
import { checkLessonTopic, lessonHasBlockedWord, LESSON_NO } from './safety.js';

// Returns { ok: true, lesson }, or { ok: false, error, drewPictures }.
// drewPictures says if OpenAI was already asked for pictures, which costs money.
export async function makeLesson(rawTopic) {
  const check = await checkLessonTopic(rawTopic);
  if (!check.ok) return { ok: false, error: check.message, drewPictures: false };

  const plan = await planLesson(check.text);
  if (!plan || lessonHasBlockedWord(plan)) return { ok: false, error: LESSON_NO, drewPictures: false };

  const pictures = await Promise.all(plan.items.map((item) => drawPicture(item.picture, { forLesson: true })));
  // No half-finished lessons: every picture must have passed its safety check.
  if (pictures.some((picture) => !picture)) {
    return { ok: false, error: "Mochi couldn't draw that lesson. Please try a different topic.", drewPictures: true };
  }

  return {
    ok: true,
    lesson: {
      title: plan.title,
      topic: check.text,
      items: plan.items.map((item, index) => ({
        id: `item-${index + 1}`,
        word: item.word.trim().replace(/^./, (first) => first.toUpperCase()),
        question: item.question.trim(),
        ...pictures[index],
      })),
    },
  };
}
