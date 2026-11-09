// Works out what a child should do today from an approved weekly plan. There are
// no screens or database calls here, so the date rules are easy to test.
import type { PlanItem, WeeklyPlan } from '@/lib/agent';

const WEEK = [
  { day: 'mon', letter: 'M', name: 'Monday' },
  { day: 'tue', letter: 'T', name: 'Tuesday' },
  { day: 'wed', letter: 'W', name: 'Wednesday' },
  { day: 'thu', letter: 'T', name: 'Thursday' },
  { day: 'fri', letter: 'F', name: 'Friday' },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const LAST_DAY_OF_WEEK = 6; // Sunday, counting Monday as 0

// done: finished   today: for today   missed: an earlier day, still playable
// upcoming: a later day   none: the parent removed this day's activity
export type DayState = 'done' | 'today' | 'missed' | 'upcoming' | 'none';

export type ScheduleDay = {
  day: PlanItem['day'];
  letter: string;
  name: string;
  state: DayState;
  item: PlanItem | null;
};

export type Schedule = {
  days: ScheduleDay[];
  // What to play now: today's activity first, then the earliest missed one.
  next: { item: PlanItem; isCatchUp: boolean; dayName: string } | null;
  startsInFuture: boolean;
  everythingDone: boolean;
};

// How many days today is after the plan's Monday. Negative means not started yet.
// Counting whole calendar days keeps this right when clocks change.
function dayOffset(weekStart: string, today: Date) {
  const [year, month, date] = weekStart.split('-').map(Number);
  const monday = Date.UTC(year, month - 1, date);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((now - monday) / DAY_MS);
}

export function buildSchedule(plan: Pick<WeeklyPlan, 'weekStart' | 'items' | 'doneItems'>, today: Date): Schedule {
  const offset = dayOffset(plan.weekStart, today);

  const days = WEEK.map(({ day, letter, name }, index): ScheduleDay => {
    const item = plan.items.find((entry) => entry.day === day) ?? null;
    let state: DayState = 'upcoming';
    if (!item) state = 'none';
    else if (plan.doneItems[item.id]) state = 'done';
    else if (index === offset) state = 'today';
    else if (index < offset) state = 'missed';
    return { day, letter, name, state, item };
  });

  const todayEntry = days.find((entry) => entry.state === 'today');
  const missedEntry = days.find((entry) => entry.state === 'missed');
  const nextEntry = todayEntry ?? missedEntry;

  return {
    days,
    next: nextEntry?.item ? { item: nextEntry.item, isCatchUp: !todayEntry, dayName: nextEntry.name } : null,
    startsInFuture: offset < 0,
    everythingDone: plan.items.every((item) => plan.doneItems[item.id]),
  };
}

// The approved plan to follow: this week's, or next week's if already approved.
// `plans` is newest first.
export function findActivePlan(plans: WeeklyPlan[], today: Date) {
  return plans.find((plan) => plan.status === 'approved' && dayOffset(plan.weekStart, today) <= LAST_DAY_OF_WEEK);
}

// The same two, for screens to use with today's date.
export const activePlanToday = (plans: WeeklyPlan[]) => findActivePlan(plans, new Date());
export const scheduleToday = (plan: WeeklyPlan) => buildSchedule(plan, new Date());
