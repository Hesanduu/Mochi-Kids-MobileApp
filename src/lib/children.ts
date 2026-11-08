// Child profiles. CLAUDE.md: we only ever store a nickname and an age.
import { addDoc, collection, getCountFromServer, serverTimestamp } from 'firebase/firestore';

import { FriendlyError } from '@/lib/api';
import { db } from '@/lib/firebase';

export const MAX_CHILDREN = 5;
export const MAX_NICKNAME_LENGTH = 20;

export type AgeBand = '3' | '4' | '5';

export type Child = {
  id: string;
  nickname: string;
  ageBand: AgeBand;
};

export function childrenCollection(uid: string) {
  return collection(db, 'parents', uid, 'children');
}

// Firestore keeps waiting when the phone is offline, so we stop after a while.
export function withTimeout<T>(work: Promise<T>, ms = 15_000) {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new FriendlyError("Mochi can't connect right now. Please try again in a moment.")), ms);
  });
  return Promise.race([work, timeout]);
}

export async function addChild(uid: string, nickname: string, ageBand: AgeBand) {
  const children = childrenCollection(uid);

  // Ask the database, so the limit also holds if another phone just added a child.
  const count = await withTimeout(getCountFromServer(children));
  if (count.data().count >= MAX_CHILDREN) {
    throw new FriendlyError(`You can add up to ${MAX_CHILDREN} children.`);
  }

  await withTimeout(addDoc(children, { nickname, ageBand, createdAt: serverTimestamp() }));
}
