// Saves finished lessons and reads them back for the Progress tab.
// Attempts live at parents/{uid}/children/{childId}/attempts/{attemptId}.
import { useEffect, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';

import { useAuth } from '@/context/AuthContext';
import type { Lesson } from '@/data/lessons';
import { db } from '@/lib/firebase';
import { MAX_STARS_PER_PAGE, scorePercent, type PageResult, type PlanLink } from '@/lib/game';

export type Attempt = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  finishedAt: Date;
  durationSeconds: number;
  score: number; // 0–100
  stars: number;
  maxStars: number;
  pages: PageResult[];
};

export function attemptsCollection(uid: string, childId: string) {
  return collection(db, 'parents', uid, 'children', childId, 'attempts');
}

// The words are copied into the attempt, so history stays correct even if the
// lesson changes later. Only the words are stored, never pictures.
export async function saveAttempt(
  uid: string,
  childId: string,
  lesson: Lesson,
  results: PageResult[],
  startedAt: number,
  planLink?: PlanLink,
) {
  await addDoc(attemptsCollection(uid, childId), {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    finishedAt: serverTimestamp(),
    durationSeconds: Math.round((Date.now() - startedAt) / 1000),
    score: scorePercent(results),
    stars: results.reduce((total, page) => total + page.stars, 0),
    maxStars: results.length * MAX_STARS_PER_PAGE,
    pages: results,
    ...(planLink && { planWeek: planLink.weekId, planItem: planLink.itemId }),
  });
}

// Live list of one child's attempts, newest first.
export function useAttempts(childId: string | undefined) {
  const { user } = useAuth();
  const uid = user?.uid;
  const key = uid && childId ? `${uid}/${childId}` : null;

  // The result remembers whose it is, so one child's scores never show for another.
  const [result, setResult] = useState<{ key: string; attempts: Attempt[] } | null>(null);

  useEffect(() => {
    if (!uid || !childId || !key) return;
    return onSnapshot(
      query(attemptsCollection(uid, childId), orderBy('finishedAt', 'desc')),
      (snapshot) => {
        const attempts = snapshot.docs.map((d) => {
          // 'estimate': a just-saved attempt has no server time yet, so use the phone's.
          const data = d.data({ serverTimestamps: 'estimate' });
          return { ...data, id: d.id, finishedAt: data.finishedAt.toDate() } as Attempt;
        });
        setResult({ key, attempts });
      },
      () => setResult({ key, attempts: [] }),
    );
  }, [uid, childId, key]);

  const isCurrent = key !== null && result?.key === key;
  return { attempts: isCurrent ? result.attempts : [], loading: key !== null && !isCurrent };
}

// e.g. "8 Nov 2026, 4:30 PM"
export function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// e.g. "2 min 5 sec"
export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
}
