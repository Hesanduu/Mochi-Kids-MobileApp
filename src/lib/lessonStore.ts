// Lessons a parent created with AI. Everything is in Firestore, so a lesson
// follows the parent's account to any phone:
//   parents/{uid}/lessons/{lessonId}               title and words
//   parents/{uid}/lessons/{lessonId}/pictures/{id} one picture each
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
import { db } from '@/lib/firebase';

export type SavedLessonSummary = { id: string; title: string; pageCount: number };

function lessonsCollection(uid: string) {
  return collection(db, 'parents', uid, 'lessons');
}

// A batch saves everything together, or nothing, so a lesson can't lose pictures.
export async function saveLesson(uid: string, lesson: GeneratedLesson) {
  const lessonRef = doc(lessonsCollection(uid));
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

// Removes a lesson, its pictures, and every child's scores for it. The lesson
// itself goes last, so if the phone loses signal the parent can simply try again.
export async function deleteSavedLesson(uid: string, lessonId: string) {
  const lessonRef = doc(lessonsCollection(uid), lessonId);

  const [pictures, children] = await withTimeout(
    Promise.all([getDocs(collection(lessonRef, 'pictures')), getDocs(childrenCollection(uid))]),
    30_000,
  );
  const attempts = await withTimeout(
    Promise.all(
      children.docs.map((child) =>
        getDocs(query(attemptsCollection(uid, child.id), where('lessonId', '==', lessonId))),
      ),
    ),
    30_000,
  );

  const toDelete: DocumentReference[] = [
    ...attempts.flatMap((snapshot) => snapshot.docs.map((d) => d.ref)),
    ...pictures.docs.map((d) => d.ref),
  ];
  for (let start = 0; start < toDelete.length; start += DELETES_PER_BATCH) {
    const batch = writeBatch(db);
    toDelete.slice(start, start + DELETES_PER_BATCH).forEach((ref) => batch.delete(ref));
    await withTimeout(batch.commit(), 30_000);
  }

  await withTimeout(deleteDoc(lessonRef), 30_000);
}

// Live list for the library. Pictures are left out, so this stays quick.
export function useSavedLessons() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [result, setResult] = useState<{ uid: string; lessons: SavedLessonSummary[] } | null>(null);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(lessonsCollection(uid), orderBy('createdAt', 'desc')),
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
  }, [uid]);

  return result !== null && result.uid === uid ? result.lessons : [];
}

// Loads one lesson with its pictures, ready to play.
export async function loadSavedLesson(uid: string, lessonId: string): Promise<Lesson> {
  const lessonRef = doc(lessonsCollection(uid), lessonId);
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
