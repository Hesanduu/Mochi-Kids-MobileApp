// The agent's alarm clock. Every hour it looks for families whose weekly plan is
// due, and makes the plans one child at a time.
import { adminDb } from '../firebaseAdmin.js';
import { notifyParent } from '../notify.js';
import { startAgentRun, validTimeZone } from './learningPath.js';

const CHECK_EVERY_MS = 60 * 60 * 1000;
const SUNDAY_START_HOUR = 18; // 6 PM, in the parent's own time zone
// If the server was off on Sunday, it can still catch up early in the week.
const CATCH_UP_DAYS = ['Mon', 'Tue', 'Wed'];

export function isWeeklyRunDue(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === 'weekday').value;
  const hour = Number(parts.find((part) => part.type === 'hour').value);

  return weekday === 'Sun' ? hour >= SUNDAY_START_HOUR : CATCH_UP_DAYS.includes(weekday);
}

// Plans each child in turn, then sends the parent one notification for them all.
// `start` and `notify` can be replaced in tests.
export async function runDueForParent(parent, start = startAgentRun, notify = notifyParent) {
  const children = await parent.ref.collection('children').get();
  let anyFinished = false;

  for (const child of children.docs) {
    try {
      // onlyIfNoPlan: the timer never redoes a week, even one that failed or that
      // a parent discarded. It can't get stuck spending money by retrying each hour.
      const { done } = await start(parent.id, child.id, { onlyIfNoPlan: true });
      if (done && (await done)) anyFinished = true;
    } catch (err) {
      console.error('Weekly plan failed for one child:', err.message);
    }
  }

  if (anyFinished) await notify(parent.id);
}

let checking = false; // a slow check must never overlap with the next one

// `db` and `handleParent` can be replaced in tests.
export async function checkDuePlans(now = new Date(), db = adminDb(), handleParent = runDueForParent) {
  if (checking) return;
  checking = true;

  try {
    const parents = await db.collection('parents').where('agentEnabled', '==', true).get();
    for (const parent of parents.docs) {
      if (!isWeeklyRunDue(now, validTimeZone(parent.data().timeZone ?? 'UTC'))) continue;
      try {
        await handleParent(parent);
      } catch (err) {
        console.error('Weekly plans failed for one family:', err.message);
      }
    }
  } catch (err) {
    console.error('Weekly plan check failed:', err.message);
  } finally {
    checking = false;
  }
}

// Returns true if the timer started. It only runs while this server is on.
export function startWeeklyTimer() {
  if (process.env.AGENT_TIMER === 'off') {
    console.log('Weekly plan timer is off (AGENT_TIMER=off)');
    return false;
  }
  console.log('Weekly plan timer is on');
  checkDuePlans(); // straight away, in case the server was off when plans were due
  setInterval(() => checkDuePlans(), CHECK_EVERY_MS);
  return true;
}
