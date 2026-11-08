// Things a parent created with AI. Everything is in Firestore, so it follows the
// parent's account to any phone. Activities lessons and Talk categories have the
// same shape, and are kept in separate collections:
//   parents/{uid}/{lessons or talkSets}/{id}               title and words
//   parents/{uid}/{lessons or talkSets}/{id}/pictures/{id} one picture each
// Pictures have their own documents because a document can only hold about 1 MB.
import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore';

import { useAuth } from '@/context/AuthContext';
import type { Lesson, LessonItem } from '@/data/lessons';
import { FriendlyError, type GeneratedLesson } from '@/lib/api';
import { attemptsCollection } from '@/lib/attempts';
import { childrenCollection, withTimeout } from '@/lib/children';
import { childCollection } from '@/lib/speechAttempts';
import { db } from '@/lib/firebase';

export type SavedKind = 'lessons' | 'talkSets';

export type SavedLessonSummary = { id: string; title: string; pageCount: number };

function savedCollection(uid: string, kind: SavedKind) {
  return collection(db, 'parents', uid, kind);
}

// A batch saves everything together, or nothing, so a lesson can't lose pictures.
export async function saveLesson(uid: string, lesson: GeneratedLesson, kind: SavedKind = 'lessons') {
  const lessonRef = doc(savedCollection(uid, kind));
  const batch = writeBatch(db);

  batch.set(lessonRef, {
    title: lesson.title,
    topic: lesson.topic,
    items: lesson.items.map(({ id, word, question }) => ({ id, word, question })),
    createdAt: serverTimestamp(),
  });
  for (const item of lesson.items) {
    batch.set(doc(lessonRef, 'pictures', item.id), {
      imageBase64: item.imageBase64,
      mimeType: item.mimeType,
    });
  }

  await withTimeout(batch.commit(), 45_000);
}

// Firestore allows at most 500 changes in one batch.
const DELETES_PER_BATCH = 400;

// Removes something a parent made, its pictures, and every child's scores for it.
// The main document goes last, so if the phone loses signal the parent can try again.
export async function deleteSaved(uid: string, id: string, kind: SavedKind) {
  const savedRef = doc(savedCollection(uid, kind), id);

  const [pictures, children] = await withTimeout(
    Promise.all([getDocs(collection(savedRef, 'pictures')), getDocs(childrenCollection(uid))]),
    30_000,
  );

  // Each child's records that belong to this lesson or category.
  const scoreQueries = children.docs.flatMap((child) =>
    kind === 'lessons'
      ? [query(attemptsCollection(uid, child.id), where('lessonId', '==', id))]
      : [
          query(childCollection(uid, child.id, 'speechAttempts'), where('setId', '==', id)),
          query(childCollection(uid, child.id, 'mispronouncedWords'), where('setId', '==', id)),
        ],
  );
  const scores = await withTimeout(Promise.all(scoreQueries.map((scoreQuery) => getDocs(scoreQuery))), 30_000);

  const toDelete: DocumentReference[] = [
    ...scores.flatMap((snapshot) => snapshot.docs.map((d) => d.ref)),
    ...pictures.docs.map((d) => d.ref),
  ];
  for (let start = 0; start < toDelete.length; start += DELETES_PER_BATCH) {
    const batch = writeBatch(db);
    toDelete.slice(start, start + DELETES_PER_BATCH).forEach((ref) => batch.delete(ref));
    await withTimeout(batch.commit(), 30_000);
  }

  await withTimeout(deleteDoc(savedRef), 30_000);
}

// Live list for the library. Pictures are left out, so this stays quick.
export function useSavedLessons(kind: SavedKind = 'lessons') {
  const { user } = useAuth();
  const uid = user?.uid;
  const [result, setResult] = useState<{ uid: string; lessons: SavedLessonSummary[] } | null>(null);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(savedCollection(uid, kind), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const lessons = snapshot.docs.map((d) => ({
          id: d.id,
          title: d.data().title as string,
          pageCount: (d.data().items as unknown[]).length,
        }));
        setResult({ uid, lessons });
      },
      () => setResult({ uid, lessons: [] }),
    );
  }, [uid, kind]);

  return result !== null && result.uid === uid ? result.lessons : [];
}

// Loads one lesson with its pictures, ready to play.
export async function loadSavedLesson(uid: string, lessonId: string, kind: SavedKind = 'lessons'): Promise<Lesson> {
  const lessonRef = doc(savedCollection(uid, kind), lessonId);
  try {
    const [lessonSnapshot, picturesSnapshot] = await withTimeout(
      Promise.all([getDoc(lessonRef), getDocs(collection(lessonRef, 'pictures'))]),
      30_000,
    );
    const data = lessonSnapshot.data();
    if (!data) throw new Error('Lesson not found');

    const items = (data.items as { id: string; word: string; question: string }[]).map((item): LessonItem => {
      const picture = picturesSnapshot.docs.find((d) => d.id === item.id)?.data();
      if (!picture) throw new Error('Picture not found');
      return {
        ...item,
        visual: { type: 'image', source: { uri: `data:${picture.mimeType};base64,${picture.imageBase64}` } },
      };
    });

    return { id: lessonId, title: data.title, items };
  } catch {
    throw new FriendlyError("Mochi can't open this lesson right now. Please check your internet and try again.");
  }
}
