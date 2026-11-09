// The Learning Path Agent's results, read live from Firestore. The agent itself
// runs on the server. The phone just starts it and watches for the result.
import {
  doc,
  orderBy,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { withTimeout } from '@/lib/children';
import { db } from '@/lib/firebase';
import type { PlanLink } from '@/lib/game';
import { deleteSaved, type SavedKind } from '@/lib/lessonStore';
import { childCollection, useChildList } from '@/lib/speechAttempts';

export type PlanStatus =
  | 'running'
  | 'report_only'
  | 'pending_review'
  | 'approved'
  | 'failed'
  | 'discarded'
  | 'expired';

export type PlanItem = {
  id: string;
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
  kind: 'lesson' | 'talk';
  refId: string; // the lesson or Talk set to open
  title: string;
  reason: string; // why Mochi chose it, for the parent
  focusWords: string[];
  isNew: boolean; // made by the agent, so its pictures need checking
};

export type WeeklyPlan = {
  id: string;
  weekStart: string;
  status: PlanStatus;
  startedAt: Date | null;
  items: PlanItem[];
  doneItems: Record<string, unknown>; // item id -> when it was finished
};

export type WeekBar = {
  weekEnd: string;
  averageScore: number | null;
  sessions: number;
};

export type ReportItem = { label: string; detail: string };

export type WeeklyReport = {
  id: string;
  weekStart: string;
  periodStart: string;
  periodEnd: string;
  stats: {
    sessions: number;
    minutes: number;
    activeDays: number;
    averageScore: number | null;
    previousAverageScore: number | null;
    change: number | null;
    starsEarned: number;
    maxStars: number;
  };
  weeklyHistory: WeekBar[];
  headline: string;
  overview: string;
  strong: ReportItem[];
  learning: ReportItem[];
  tryAtHome: { title: string; text: string }[];
  seenAt: Date | null;
};

const NEWEST_WEEK_FIRST = orderBy('weekStart', 'desc');
const STALE_RUN_MS = 15 * 60 * 1000; // same limit as the server

function toPlan(snapshot: QueryDocumentSnapshot<DocumentData>): WeeklyPlan {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  return {
    id: snapshot.id,
    weekStart: data.weekStart,
    status: data.status,
    startedAt: data.startedAt?.toDate() ?? null,
    items: data.items ?? [],
    doneItems: data.doneItems ?? {},
  };
}

function toReport(snapshot: QueryDocumentSnapshot<DocumentData>) {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  return { ...data, id: snapshot.id, seenAt: data.seenAt?.toDate() ?? null } as WeeklyReport;
}

export function useWeeklyPlans(childId: string | undefined) {
  return useChildList(childId, 'weeklyPlans', NEWEST_WEEK_FIRST, toPlan);
}

export function useWeeklyReports(childId: string | undefined) {
  return useChildList(childId, 'weeklyReports', NEWEST_WEEK_FIRST, toReport);
}

// True while the agent is really working. A very old "running" means the server
// stopped part-way, so the parent should be able to try again.
export function isPlanRunning(plan: WeeklyPlan | undefined) {
  if (plan?.status !== 'running') return false;
  return plan.startedAt !== null && Date.now() - plan.startedAt.getTime() < STALE_RUN_MS;
}

export async function enableAgent(uid: string) {
  // The timer uses this to run at the right time of day for this family.
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  await withTimeout(
    setDoc(doc(db, 'parents', uid), { agentEnabled: true, agentEnabledAt: serverTimestamp(), timeZone }, { merge: true }),
  );
}

export async function disableAgent(uid: string) {
  await withTimeout(setDoc(doc(db, 'parents', uid), { agentEnabled: false }, { merge: true }));
}

export function markReportSeen(uid: string, childId: string, weekId: string) {
  updateDoc(doc(childCollection(uid, childId, 'weeklyReports'), weekId), { seenAt: serverTimestamp() }).catch(() => {});
}

const savedKindOf = (item: PlanItem): SavedKind => (item.kind === 'lesson' ? 'lessons' : 'talkSets');
const planDoc = (uid: string, childId: string, weekId: string) =>
  doc(childCollection(uid, childId, 'weeklyPlans'), weekId);

// Removes new content the agent made for these items, unless a kept item still uses it.
async function deleteNewContent(uid: string, items: PlanItem[], kept: PlanItem[]) {
  for (const item of items) {
    if (item.isNew && !kept.some((other) => other.refId === item.refId)) {
      await deleteSaved(uid, item.refId, savedKindOf(item));
    }
  }
}

// Publishes the kept activities. Anything removed is remembered, so Mochi can
// avoid it next week.
export async function approvePlan(uid: string, childId: string, plan: WeeklyPlan, removedIds: string[]) {
  const kept = plan.items.filter((item) => !removedIds.includes(item.id));
  const removed = plan.items.filter((item) => removedIds.includes(item.id));

  await deleteNewContent(uid, removed, kept);

  // A batch saves everything together, so a plan can't be approved half way.
  const batch = writeBatch(db);
  for (const item of kept) {
    if (item.isNew) batch.update(doc(db, 'parents', uid, savedKindOf(item), item.refId), { status: 'approved' });
  }
  batch.update(planDoc(uid, childId, plan.id), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    items: kept,
    removedItems: removed.map(({ title, kind, refId }) => ({ title, kind, refId })),
  });
  await withTimeout(batch.commit(), 30_000);
}

// Throws a plan away, so a new one can be made. Content that was already
// approved stays in the library. Only unapproved drafts are deleted.
export async function discardPlan(uid: string, childId: string, plan: WeeklyPlan) {
  if (plan.status === 'pending_review') await deleteNewContent(uid, plan.items, []);
  await withTimeout(updateDoc(planDoc(uid, childId, plan.id), { status: 'discarded' }));
}

// Ticks off a day once its activity is finished.
export function markPlanItemDone(uid: string, childId: string, link: PlanLink) {
  updateDoc(planDoc(uid, childId, link.weekId), { [`doneItems.${link.itemId}`]: serverTimestamp() }).catch(() => {});
}

const dayId = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Which week "Make plan now" would plan, as that week's Monday. It matches the
// server: Monday to Friday is the current week, weekends are the coming one.
export function currentPlanWeekId() {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekday = date.getDay(); // 0 = Sunday, 6 = Saturday
  const daysToMonday = weekday === 0 ? 1 : weekday === 6 ? 2 : 1 - weekday;
  date.setDate(date.getDate() + daysToMonday);
  return dayId(date);
}

// "This week" once the plan's Monday has arrived, otherwise "Next week".
export function planWeekName(weekStart: string) {
  return dayId(new Date()) >= weekStart ? 'This week' : 'Next week';
}

// The AI writes {child} because it is never told the name. The name is only added
// here, on the parent's own phone.
export function fillChildName(text: string, nickname: string) {
  return text.split('{child}').join(nickname);
}

// "2026-11-03" read as a date on this phone, without any time-zone shift.
function parseDay(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

const monthName = (date: Date, month: 'long' | 'short') => date.toLocaleDateString(undefined, { month });

// e.g. "3–9 November", or "28 October – 3 November" across two months.
export function formatPeriod(start: string, end: string) {
  const first = parseDay(start);
  const last = parseDay(end);
  if (first.getMonth() === last.getMonth()) return `${first.getDate()}–${last.getDate()} ${monthName(last, 'long')}`;
  return `${first.getDate()} ${monthName(first, 'long')} – ${last.getDate()} ${monthName(last, 'long')}`;
}

// e.g. "7 Nov"
export function formatShortDay(day: string) {
  const date = parseDay(day);
  return `${date.getDate()} ${monthName(date, 'short')}`;
}
