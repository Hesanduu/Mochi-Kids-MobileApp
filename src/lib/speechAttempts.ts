// Saves finished Talk with Mochi sessions, and each child's mispronounced words.
//   parents/{uid}/children/{childId}/speechAttempts/{attemptId}
//   parents/{uid}/children/{childId}/mispronouncedWords/{setId_wordId}
// Only words and stars are stored, never audio or what the child said.
import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { useAuth } from '@/context/AuthContext';
import type { TalkSet } from '@/data/talkSets';
import { db } from '@/lib/firebase';
import { scorePercent, type PlanLink } from '@/lib/game';
import { MAX_STARS_PER_WORD, type TalkResult } from '@/lib/talkGame';

export type SpeechWordResult = {
  word: string;
  stars: number;
  tries: number;
  mispronounced: number;
  slightSlip: boolean;
  gotIt: boolean;
};

export type SpeechAttempt = {
  id: string;
  setId: string;
  setTitle: string;
  finishedAt: Date;
  durationSeconds: number;
  score: number; // 0–100
  stars: number;
  maxStars: number;
  words: SpeechWordResult[];
};

export type MispronouncedWord = {
  id: string;
  word: string;
  setId: string;
  count: number;
};

export function childCollection(uid: string, childId: string, name: string) {
  return collection(db, 'parents', uid, 'children', childId, name);
}

// The attempt and the word counts are saved together, so they always agree.
export async function saveSpeechAttempt(
  uid: string,
  childId: string,
  set: TalkSet,
  results: TalkResult[],
  startedAt: number,
  planLink?: PlanLink,
) {
  const batch = writeBatch(db);

  batch.set(doc(childCollection(uid, childId, 'speechAttempts')), {
    setId: set.id,
    setTitle: set.title,
    finishedAt: serverTimestamp(),
    durationSeconds: Math.round((Date.now() - startedAt) / 1000),
    score: scorePercent(results, MAX_STARS_PER_WORD),
    stars: results.reduce((total, word) => total + word.stars, 0),
    maxStars: results.length * MAX_STARS_PER_WORD,
    words: results.map(({ answer, stars, tries, mispronounced, slightSlip, gotIt }) => ({
      word: answer,
      stars,
      tries,
      mispronounced,
      slightSlip,
      gotIt,
    })),
    ...(planLink && { planWeek: planLink.weekId, planItem: planLink.itemId }),
  });

  for (const result of results) {
    if (result.mispronounced === 0) continue;
    // The set is part of the id, so "orange" the colour and the fruit stay separate.
    const wordRef = doc(childCollection(uid, childId, 'mispronouncedWords'), `${set.id}_${result.wordId}`);
    batch.set(
      wordRef,
      { word: result.answer, setId: set.id, count: increment(result.mispronounced), lastAt: serverTimestamp() },
      { merge: true },
    );
  }

  await batch.commit();
}

// Live list from one of a child's collections. The result remembers whose it is,
// so one child's words never show for another.
export function useChildList<T>(
  childId: string | undefined,
  name: string,
  order: QueryConstraint,
  toItem: (snapshot: QueryDocumentSnapshot<DocumentData>) => T,
) {
  const { user } = useAuth();
  const uid = user?.uid;
  const key = uid && childId ? `${uid}/${childId}/${name}` : null;
  const [result, setResult] = useState<{ key: string; items: T[] } | null>(null);

  useEffect(() => {
    if (!uid || !childId || !key) return;
    return onSnapshot(
      query(childCollection(uid, childId, name), order),
      (snapshot) => setResult({ key, items: snapshot.docs.map(toItem) }),
      () => setResult({ key, items: [] }),
    );
    // `order` and `toItem` are fixed values defined below, so they never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, childId, key, name]);

  const isCurrent = key !== null && result?.key === key;
  return { items: isCurrent ? result.items : [], loading: key !== null && !isCurrent };
}

const NEWEST_FIRST = orderBy('finishedAt', 'desc');
const MOST_MISTAKES_FIRST = orderBy('count', 'desc');

function toAttempt(snapshot: QueryDocumentSnapshot<DocumentData>) {
  // 'estimate': a just-saved attempt has no server time yet, so use the phone's.
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  return { ...data, id: snapshot.id, finishedAt: data.finishedAt.toDate() } as SpeechAttempt;
}

function toMispronouncedWord(snapshot: QueryDocumentSnapshot<DocumentData>) {
  return { ...snapshot.data(), id: snapshot.id } as MispronouncedWord;
}

export function useSpeechAttempts(childId: string | undefined) {
  return useChildList(childId, 'speechAttempts', NEWEST_FIRST, toAttempt);
}

export function useMispronouncedWords(childId: string | undefined) {
  return useChildList(childId, 'mispronouncedWords', MOST_MISTAKES_FIRST, toMispronouncedWord);
}
