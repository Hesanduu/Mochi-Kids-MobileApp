// What the agent can reuse, and the hidden drafts of anything new it makes.
// A draft sits with the parent's other lessons but stays out of every library
// until a parent approves it.
import { FieldValue } from 'firebase-admin/firestore';

import { adminDb } from '../firebaseAdmin.js';
import { makeLesson } from '../lessonMaker.js';
import { PRESET_LESSONS, PRESET_TALK_SETS } from './catalog.js';

const COLLECTIONS = { lesson: 'lessons', talk: 'talkSets' };
const PLANS_TO_LOOK_BACK = 4;

function savedItems(snapshot, kind) {
  return snapshot.docs
    .filter((item) => item.data().status !== 'draft')
    .map((item) => ({
      kind,
      refId: item.id,
      title: item.data().title,
      words: item.data().items.map((entry) => entry.word),
    }));
}

// What happened to the last plan a parent approved, so the agent can learn from it.
function summariseLastPlan(plan) {
  if (!plan) return { removed: [], finished: [], notFinished: [] };
  const done = plan.doneItems ?? {};
  return {
    removed: (plan.removedItems ?? []).map((item) => item.title),
    finished: plan.items.filter((item) => done[item.id]).map((item) => item.title),
    notFinished: plan.items.filter((item) => !done[item.id]).map((item) => item.title),
  };
}

export async function loadLibrary({ parentRef, childRef, weekId, voiceConsent }) {
  const [lessons, talkSets, plans] = await Promise.all([
    parentRef.collection('lessons').get(),
    parentRef.collection('talkSets').get(),
    childRef.collection('weeklyPlans').orderBy('weekStart', 'desc').limit(PLANS_TO_LOOK_BACK).get(),
  ]);

  const lastApproved = plans.docs
    .map((plan) => plan.data())
    .find((plan) => plan.weekStart < weekId && plan.status === 'approved');

  return {
    lessons: [...PRESET_LESSONS.map((item) => ({ ...item, kind: 'lesson' })), ...savedItems(lessons, 'lesson')],
    // Talk uses the microphone, so it's only planned if a parent has agreed to that.
    talkSets: voiceConsent
      ? [...PRESET_TALK_SETS.map((item) => ({ ...item, kind: 'talk' })), ...savedItems(talkSets, 'talk')]
      : [],
    lastPlan: summariseLastPlan(lastApproved),
  };
}

// Makes new content through the normal safety checks and saves it as a draft.
// Returns { ok: true, draft }, or { ok: false, error, drewPictures }.
export async function createDraft({ parentRef, childId, weekId }, kind, topic) {
  const result = await makeLesson(topic);
  if (!result.ok) return result;

  const { lesson } = result;
  const draftRef = parentRef.collection(COLLECTIONS[kind]).doc();
  const batch = adminDb().batch();

  batch.set(draftRef, {
    title: lesson.title,
    topic: lesson.topic,
    items: lesson.items.map(({ id, word, question }) => ({ id, word, question })),
    createdAt: FieldValue.serverTimestamp(),
    status: 'draft',
    createdByAgent: true,
    forWeek: weekId,
    forChildId: childId,
  });
  for (const item of lesson.items) {
    batch.set(draftRef.collection('pictures').doc(item.id), {
      imageBase64: item.imageBase64,
      mimeType: item.mimeType,
    });
  }
  await batch.commit();

  return {
    ok: true,
    draft: { kind, refId: draftRef.id, title: lesson.title, words: lesson.items.map((item) => item.word) },
  };
}

// Removes any unapproved drafts made for this child's week.
export async function deleteWeekDrafts({ parentRef, childId }, weekId) {
  for (const name of Object.values(COLLECTIONS)) {
    const matches = await parentRef.collection(name).where('forWeek', '==', weekId).get();
    for (const draft of matches.docs) {
      if (draft.data().status !== 'draft' || draft.data().forChildId !== childId) continue;
      const pictures = await draft.ref.collection('pictures').get();
      const batch = adminDb().batch();
      pictures.docs.forEach((picture) => batch.delete(picture.ref));
      batch.delete(draft.ref);
      await batch.commit();
    }
  }
}

// A plan nobody reviewed before a new one starts is out of date. Its drafts are deleted.
export async function expireOldPlans(run) {
  const { childRef, weekId } = run;
  const waiting = await childRef.collection('weeklyPlans').where('status', '==', 'pending_review').get();
  for (const plan of waiting.docs) {
    if (plan.id === weekId) continue;
    await plan.ref.update({ status: 'expired' });
    await deleteWeekDrafts(run, plan.id);
  }
}
