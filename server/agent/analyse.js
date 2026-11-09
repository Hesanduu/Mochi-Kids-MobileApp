// The numbers behind the weekly report. They are all calculated here in plain
// code, so the AI can describe a child's progress but can never invent it.
import { adminDb } from '../firebaseAdmin.js';

export const STRONG_SCORE = 80; // average % to count as strong
export const MIN_STRONG_SESSIONS = 2; // ...over at least this many sessions
export const LEARNING_SCORE = 60; // below this average %, still learning
export const TRICKY_WORD_SESSIONS = 2; // a word missed in this many sessions is tricky
export const MIN_SESSIONS_EVER = 3; // fewer than this and there is nothing to analyse
export const MUST_HAVE_PLAYED_WITHIN_DAYS = 14;

const SKILL_WINDOW_DAYS = 28; // how far back a skill is judged
const HISTORY_WEEKS = 6; // bars on the report
const TREND_POINTS = 10; // a change this big counts as going up or down
const DAY_MS = 24 * 60 * 60 * 1000;

const NOT_ENOUGH_PLAY = 'Play a few more activities first, then Mochi can plan.';

function average(numbers) {
  if (numbers.length === 0) return null;
  return Math.round(numbers.reduce((total, n) => total + n, 0) / numbers.length);
}

// The calendar date in the parent's time zone, e.g. "2026-11-09".
export function localDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

// Which week a run belongs to, as that week's Monday. Monday to Friday plans the
// current week; Saturday and Sunday plan the coming one.
export function planWeekId(now, timeZone) {
  const [year, month, day] = localDate(now, timeZone).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const daysToMonday = weekday === 0 ? 1 : weekday === 6 ? 2 : 1 - weekday;
  date.setUTCDate(date.getUTCDate() + daysToMonday);
  return date.toISOString().slice(0, 10);
}

// Activities and Talk sessions are stored differently. This gives them one shape.
function toSessions({ attempts, speechAttempts }) {
  const lessons = attempts.map((attempt) => ({
    kind: 'lesson',
    refId: attempt.lessonId,
    title: attempt.lessonTitle,
    finishedAt: attempt.finishedAt,
    durationSeconds: attempt.durationSeconds,
    score: attempt.score,
    stars: attempt.stars,
    maxStars: attempt.maxStars,
    missedWords: attempt.pages.filter((page) => page.tries > 1).map((page) => page.answer),
  }));
  const talks = speechAttempts.map((attempt) => ({
    kind: 'talk',
    refId: attempt.setId,
    title: attempt.setTitle,
    finishedAt: attempt.finishedAt,
    durationSeconds: attempt.durationSeconds,
    score: attempt.score,
    stars: attempt.stars,
    maxStars: attempt.maxStars,
    missedWords: attempt.words.filter((word) => word.mispronounced > 0 || !word.gotIt).map((word) => word.word),
  }));
  return [...lessons, ...talks].sort((a, b) => b.finishedAt - a.finishedAt);
}

function statsFor(sessions, previousSessions, timeZone) {
  const averageScore = average(sessions.map((session) => session.score));
  const previousAverageScore = average(previousSessions.map((session) => session.score));
  const totalSeconds = sessions.reduce((total, session) => total + session.durationSeconds, 0);
  return {
    sessions: sessions.length,
    minutes: totalSeconds > 0 ? Math.max(Math.round(totalSeconds / 60), 1) : 0,
    activeDays: new Set(sessions.map((session) => localDate(session.finishedAt, timeZone))).size,
    averageScore,
    previousAverageScore,
    change: averageScore !== null && previousAverageScore !== null ? averageScore - previousAverageScore : null,
    starsEarned: sessions.reduce((total, session) => total + session.stars, 0),
    maxStars: sessions.reduce((total, session) => total + session.maxStars, 0),
  };
}

function trendOf(newestFirst) {
  if (newestFirst.length < 2) return 'new';
  const change = newestFirst[0].score - newestFirst[newestFirst.length - 1].score;
  if (change >= TREND_POINTS) return 'up';
  if (change <= -TREND_POINTS) return 'down';
  return 'steady';
}

function skillsFrom(sessions, mispronouncedWords) {
  const groups = new Map();
  for (const session of sessions) {
    const key = `${session.kind}:${session.refId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(session);
  }

  return [...groups.values()].map((group) => {
    const { kind, refId, title } = group[0];
    const averageScore = average(group.map((session) => session.score));

    const missedSessions = new Map();
    for (const session of group) {
      for (const word of new Set(session.missedWords)) {
        missedSessions.set(word, (missedSessions.get(word) ?? 0) + 1);
      }
    }
    const trickyWords = [...missedSessions.entries()]
      .filter(([, sessionsMissed]) => sessionsMissed >= TRICKY_WORD_SESSIONS)
      .sort((a, b) => b[1] - a[1])
      .map(([word, sessionsMissed]) => ({
        word,
        sessionsMissed,
        timesMispronounced:
          kind === 'talk'
            ? (mispronouncedWords.find((item) => item.setId === refId && item.word === word)?.count ?? null)
            : null,
      }));

    let level = 'practising';
    if (averageScore >= STRONG_SCORE && group.length >= MIN_STRONG_SESSIONS) level = 'strong';
    else if (averageScore < LEARNING_SCORE) level = 'learning';

    return {
      kind,
      refId,
      title,
      label: kind === 'lesson' ? title : `Saying ${title}`,
      sessions: group.length,
      averageScore,
      lastScore: group[0].score,
      trend: trendOf(group),
      level,
      trickyWords,
    };
  });
}

const sessionsLabel = (count) => `${count} ${count === 1 ? 'session' : 'sessions'}`;

// The only things the AI may call strong or still learning. Each has a short
// made-up id, so the AI chooses from this list and can't describe anything else.
function optionsFrom(skills) {
  const strong = skills
    .filter((skill) => skill.level === 'strong')
    .sort((a, b) => b.averageScore - a.averageScore)
    .map((skill, index) => ({
      id: `s${index + 1}`,
      label: skill.label,
      detail: `${skill.averageScore}% over ${sessionsLabel(skill.sessions)}`,
    }));

  const learningSkills = skills
    .filter((skill) => skill.level === 'learning')
    .sort((a, b) => a.averageScore - b.averageScore)
    .map((skill, index) => ({
      id: `l${index + 1}`,
      label: skill.label,
      detail: `${skill.averageScore}% so far`,
    }));

  const words = skills
    .flatMap((skill) => skill.trickyWords.map((word) => ({ ...word, from: skill.label })))
    .sort((a, b) => b.sessionsMissed - a.sessionsMissed)
    .map((word, index) => ({
      id: `w${index + 1}`,
      label: word.word,
      detail: `Tricky in ${sessionsLabel(word.sessionsMissed)} of ${word.from}`,
    }));

  return { strongOptions: strong, learningOptions: [...learningSkills, ...words] };
}

// Turns a child's saved history into the analysis. Plain data in, plain data out,
// which makes it easy to test without a database.
export function analyseProgress({ attempts, speechAttempts, mispronouncedWords, totalSessions, now, timeZone }) {
  const sessions = toSessions({ attempts, speechAttempts });
  const daysAgo = (session) => (now - session.finishedAt) / DAY_MS;

  const playedRecently = sessions.some((session) => daysAgo(session) <= MUST_HAVE_PLAYED_WITHIN_DAYS);
  const eligible = totalSessions >= MIN_SESSIONS_EVER && playedRecently;

  const thisWeek = sessions.filter((session) => daysAgo(session) <= 7);
  const lastWeek = sessions.filter((session) => daysAgo(session) > 7 && daysAgo(session) <= 14);

  const weeklyHistory = Array.from({ length: HISTORY_WEEKS }, (_, index) => {
    const weeksAgo = HISTORY_WEEKS - 1 - index;
    const inWeek = sessions.filter((session) => Math.floor(daysAgo(session) / 7) === weeksAgo);
    return {
      weekEnd: localDate(new Date(now.getTime() - weeksAgo * 7 * DAY_MS), timeZone),
      averageScore: average(inWeek.map((session) => session.score)),
      sessions: inWeek.length,
    };
  });

  const skills = skillsFrom(
    sessions.filter((session) => daysAgo(session) <= SKILL_WINDOW_DAYS),
    mispronouncedWords,
  );

  return {
    eligible,
    notEligibleReason: eligible ? null : NOT_ENOUGH_PLAY,
    periodStart: localDate(new Date(now.getTime() - 6 * DAY_MS), timeZone),
    periodEnd: localDate(now, timeZone),
    stats: statsFor(thisWeek, lastWeek, timeZone),
    weeklyHistory,
    skills,
    ...optionsFrom(skills),
  };
}

// The part of the analysis the AI is allowed to see: no ids, no account details.
export function analysisForAI(analysis, ageBand) {
  return {
    child_age: ageBand,
    last_7_days: analysis.stats,
    average_score_by_week_oldest_first: analysis.weeklyHistory.map((week) => week.averageScore),
    skills: analysis.skills.map((skill) => ({
      name: skill.title,
      type: skill.kind === 'lesson' ? 'choosing the right picture' : 'saying words out loud',
      level: skill.level,
      sessions: skill.sessions,
      average_score: skill.averageScore,
      last_score: skill.lastScore,
      trend: skill.trend,
      tricky_words: skill.trickyWords.map(({ word, sessionsMissed }) => ({ word, sessions_missed: sessionsMissed })),
    })),
    strong_options: analysis.strongOptions,
    learning_options: analysis.learningOptions,
  };
}

const withDate = (snapshot) => ({ ...snapshot.data(), finishedAt: snapshot.data().finishedAt.toDate() });

// Reads what the analysis needs from Firestore.
export async function loadAnalysis(uid, childId, now, timeZone) {
  const child = adminDb().collection('parents').doc(uid).collection('children').doc(childId);
  const since = new Date(now.getTime() - HISTORY_WEEKS * 7 * DAY_MS);

  const [attempts, speechAttempts, mispronouncedWords, attemptCount, speechCount] = await Promise.all([
    child.collection('attempts').where('finishedAt', '>=', since).get(),
    child.collection('speechAttempts').where('finishedAt', '>=', since).get(),
    child.collection('mispronouncedWords').get(),
    child.collection('attempts').count().get(),
    child.collection('speechAttempts').count().get(),
  ]);

  return analyseProgress({
    attempts: attempts.docs.map(withDate),
    speechAttempts: speechAttempts.docs.map(withDate),
    mispronouncedWords: mispronouncedWords.docs.map((snapshot) => snapshot.data()),
    totalSessions: attemptCount.data().count + speechCount.data().count,
    now,
    timeZone,
  });
}
