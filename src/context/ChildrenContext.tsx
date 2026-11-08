import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';

import { useAuth } from '@/context/AuthContext';
import { childrenCollection, type Child } from '@/lib/children';
import { db } from '@/lib/firebase';

type ChildrenContextValue = {
  children: Child[];
  // The child who is playing now. Null only when no child has been added.
  selectedChild: Child | null;
  selectChild: (childId: string) => void;
  // True until the first answer from Firestore arrives.
  loading: boolean;
};

const ChildrenContext = createContext<ChildrenContextValue | null>(null);

// Each result remembers which parent it belongs to, so one parent's children
// can never show for a moment after a different parent logs in.
type ChildrenResult = { uid: string; list: Child[] };
type SelectionResult = { uid: string; childId: string | null };

export function ChildrenProvider({ children: content }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [childrenResult, setChildrenResult] = useState<ChildrenResult | null>(null);
  const [selectionResult, setSelectionResult] = useState<SelectionResult | null>(null);

  // onSnapshot is a live listener: Firestore calls us now, and again whenever
  // the data changes. Returning the "unsubscribe" stops it on logout.
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(childrenCollection(uid), orderBy('createdAt')),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Child);
        setChildrenResult({ uid, list });
      },
      () => setChildrenResult({ uid, list: [] }),
    );
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(db, 'parents', uid),
      (snapshot) => setSelectionResult({ uid, childId: snapshot.data()?.selectedChildId ?? null }),
      () => setSelectionResult({ uid, childId: null }),
    );
  }, [uid]);

  const isCurrent = uid !== undefined && childrenResult?.uid === uid && selectionResult?.uid === uid;
  const list = isCurrent ? childrenResult.list : [];
  const selectedId = isCurrent ? selectionResult.childId : null;

  // The saved choice if that child exists, otherwise the first child.
  const selectedChild = list.find((child) => child.id === selectedId) ?? list[0] ?? null;

  const selectChild = (childId: string) => {
    if (!uid) return;
    // merge: only change this one field on the parent's document.
    setDoc(doc(db, 'parents', uid), { selectedChildId: childId }, { merge: true }).catch((err) =>
      console.warn('Could not save the selected child:', err.code),
    );
  };

  const loading = uid !== undefined && !isCurrent;

  return (
    <ChildrenContext.Provider value={{ children: list, selectedChild, selectChild, loading }}>
      {content}
    </ChildrenContext.Provider>
  );
}

// Use this in any screen: const { selectedChild } = useChildren();
export function useChildren() {
  const value = useContext(ChildrenContext);
  if (!value) throw new Error('useChildren must be used inside ChildrenProvider');
  return value;
}
