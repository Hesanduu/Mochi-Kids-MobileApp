// The agent can only act through these tools. Each one is tied by code to a single
// child, so nothing the AI asks for can reach another family's data.
import { analysisForAI } from './analyse.js';
import { isTextFlagged } from '../ai.js';
import { hasBlockedWord } from '../safety.js';

export const CHILD_PLACEHOLDER = '{child}';

const MAX_PICKS = 4;
const MAX_TIPS = 3;
const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const MAX_USES_OF_ONE_ITEM = 2;
const MAX_FOCUS_WORDS = 4;
const MAX_TOPIC_TRIES = 3;

// Nothing the agent writes may read like a diagnosis, or compare a child with others.
const NOT_ALLOWED_TEXT =
  /autis|dyslex|apraxia|disorder|delay|impediment|therap|abnormal|developmental|falling behind|behind other|other (children|kids)|slow learner|lazy|worse than|\bdiagnos/i;

const noArguments = { type: 'object', properties: {}, required: [], additionalProperties: false };

const DEFINITIONS = [
  {
    type: 'function',
    name: 'get_progress',
    description: "Read this child's progress: scores, skills and tricky words. Call this first.",
    strict: true,
    parameters: noArguments,
  },
  {
    type: 'function',
    name: 'get_library',
    description: 'See the Activities and Talk sets you can reuse, and how the last plan went.',
    strict: true,
    parameters: noArguments,
  },
  {
    type: 'function',
    name: 'create_content',
    description:
      'Make one new lesson or Talk category. Costs money, so only use it when the child is ready for something new and nothing in the library suits. Reuse first.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['lesson', 'talk'], description: 'lesson = choosing pictures, talk = saying words.' },
        topic: { type: 'string', description: 'One or two simple words a 3 to 5 year old knows, such as Shapes or Toys.' },
      },
      required: ['kind', 'topic'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'write_report',
    description: 'Save the weekly report for the parent. Call this once, before submit_plan.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        headline: { type: 'string', description: 'A short warm title, at most 50 characters.' },
        overview: {
          type: 'string',
          description: `One or two plain sentences for the parent, at most 220 characters. Refer to the child as ${CHILD_PLACEHOLDER}.`,
        },
        strong_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ids chosen from strong_options. Use the best ones, at most 4.',
        },
        learning_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ids chosen from learning_options. Use the most useful ones, at most 4.',
        },
        try_at_home: {
          type: 'array',
          description: 'One to three short, free ideas a parent can do during everyday life.',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'At most 40 characters.' },
              text: { type: 'string', description: 'At most 140 characters.' },
            },
            required: ['title', 'text'],
            additionalProperties: false,
          },
        },
      },
      required: ['headline', 'overview', 'strong_ids', 'learning_ids', 'try_at_home'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'submit_plan',
    description: 'Save the plan: exactly one activity for each day, Monday to Friday. Call this last. It ends your work.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Exactly 5 items, one for each day.',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string', enum: WEEK_DAYS },
              content_id: { type: 'string', description: 'An id from get_library or create_content.' },
              title: { type: 'string', description: 'A short friendly name, at most 30 characters, such as Tricky Colours.' },
              reason: {
                type: 'string',
                description: 'One plain sentence telling the parent why, at most 140 characters, based on real results.',
              },
              focus_words: {
                type: 'array',
                items: { type: 'string' },
                description: 'Up to 4 words from that content to practise most. Use exactly as listed. Can be empty.',
              },
            },
            required: ['day', 'content_id', 'title', 'reason', 'focus_words'],
            additionalProperties: false,
          },
        },
      },
      required: ['items'],
      additionalProperties: false,
    },
  },
];

// Last line of privacy: if a nickname slipped into any text, such as a lesson
// title a parent chose, it is replaced before the AI can see it.
function hideNickname(json, nickname) {
  const escaped = nickname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return json.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), CHILD_PLACEHOLDER);
}

// Returns a message to send back to the AI, or null if the text is fine.
async function textProblem(texts) {
  if (texts.some((text) => NOT_ALLOWED_TEXT.test(text))) {
    return 'Rewrite this. Stay encouraging: no diagnosis, labels or comparing with other children.';
  }
  if (texts.some(hasBlockedWord) || (await isTextFlagged(texts.join('\n')))) {
    return 'Rewrite this so it is gentle and suitable for a family.';
  }
  return null;
}

// Looks up each chosen id. Returns the matching items, or null if any is unknown.
function pickOptions(ids, options) {
  const picked = ids.map((id) => options.find((option) => option.id === id));
  if (picked.some((option) => !option)) return null;
  // The same word can be tricky in two sets, so show each label only once.
  const unique = [...new Map(picked.map((option) => [option.label.toLowerCase(), option])).values()];
  return unique.map(({ label, detail }) => ({ label, detail }));
}

async function writeReport(context, args) {
  const { analysis } = context;
  const { headline, overview, strong_ids: strongIds, learning_ids: learningIds, try_at_home: tips } = args;

  if (headline.trim().length === 0 || headline.length > 50) return { error: 'headline must be 1 to 50 characters.' };
  if (overview.trim().length === 0 || overview.length > 220) return { error: 'overview must be 1 to 220 characters.' };
  if (!overview.includes(CHILD_PLACEHOLDER)) return { error: `overview must refer to the child as ${CHILD_PLACEHOLDER}.` };
  if (strongIds.length > MAX_PICKS || learningIds.length > MAX_PICKS) return { error: `Choose at most ${MAX_PICKS} of each.` };
  if (analysis.strongOptions.length > 0 && strongIds.length === 0) return { error: 'Choose at least one from strong_options.' };
  if (analysis.learningOptions.length > 0 && learningIds.length === 0) return { error: 'Choose at least one from learning_options.' };
  if (tips.length < 1 || tips.length > MAX_TIPS) return { error: `try_at_home needs 1 to ${MAX_TIPS} ideas.` };
  if (tips.some((tip) => !tip.title.trim() || tip.title.length > 40 || !tip.text.trim() || tip.text.length > 140)) {
    return { error: 'Each idea needs a title of at most 40 characters and text of at most 140 characters.' };
  }

  const strong = pickOptions(strongIds, analysis.strongOptions);
  const learning = pickOptions(learningIds, analysis.learningOptions);
  if (!strong || !learning) return { error: 'Only use ids from strong_options and learning_options.' };

  const problem = await textProblem([headline, overview, ...tips.flatMap((tip) => [tip.title, tip.text])]);
  if (problem) return { error: problem };

  await context.saveReport({
    periodStart: analysis.periodStart,
    periodEnd: analysis.periodEnd,
    stats: analysis.stats,
    weeklyHistory: analysis.weeklyHistory,
    headline: headline.trim(),
    overview: overview.trim(),
    strong,
    learning,
    tryAtHome: tips.map((tip) => ({ title: tip.title.trim(), text: tip.text.trim() })),
  });

  return { saved: true };
}

// Gives each lesson a short made-up id, so the AI never sees a real database id.
async function readLibrary(state, context) {
  const library = await context.loadLibrary();
  state.talkAllowed = library.talkSets.length > 0;
  const withIds = (items, prefix) =>
    items.map((item, index) => {
      const id = `${prefix}${index + 1}`;
      state.content.set(id, { ...item, isNew: false });
      return { id, title: item.title, words: item.words };
    });

  return {
    activities: withIds(library.lessons, 'a'),
    talk_sets: withIds(library.talkSets, 't'),
    last_plan: {
      removed_by_parent_do_not_use: library.lastPlan.removed,
      finished: library.lastPlan.finished,
      not_finished: library.lastPlan.notFinished,
    },
  };
}

async function createContent(state, context, { kind, topic }) {
  if (kind === 'talk' && !state.talkAllowed) return { error: 'Talk is not available for this family. Make a lesson instead.' };
  if (state.picturesUsed) return { error: 'New content has already been made or tried. Reuse what is in the library.' };
  if (context.analysis.strongOptions.length === 0) {
    return { error: 'This child is not ready for something new yet. Reuse what is in the library.' };
  }
  if (state.topicTries >= MAX_TOPIC_TRIES) return { error: 'No more tries for new content. Reuse what is in the library.' };
  state.topicTries += 1;

  let result;
  try {
    result = await context.createDraft(kind, topic);
  } catch (err) {
    console.error('Agent could not create content:', err.status ?? err.message);
    state.picturesUsed = true; // some pictures may already have been paid for
    return { error: 'That could not be made. Reuse what is in the library.' };
  }

  if (!result.ok) {
    if (result.drewPictures) state.picturesUsed = true;
    return { error: 'That topic could not be used. Choose a gentler, simpler one, or reuse the library.' };
  }

  state.picturesUsed = true;
  state.newContentId = 'n1';
  state.content.set('n1', { ...result.draft, isNew: true });
  return { id: 'n1', title: result.draft.title, words: result.draft.words };
}

async function submitPlan(state, context, { items }) {
  if (items.length !== WEEK_DAYS.length || new Set(items.map((item) => item.day)).size !== WEEK_DAYS.length) {
    return { error: 'The plan needs exactly one item for each day, Monday to Friday.' };
  }

  const uses = new Map();
  const planItems = [];

  for (const item of items) {
    const content = state.content.get(item.content_id);
    if (!content) return { error: `${item.content_id} is not in the library.` };
    uses.set(item.content_id, (uses.get(item.content_id) ?? 0) + 1);

    if (item.title.trim().length === 0 || item.title.length > 30) return { error: 'Each title must be 1 to 30 characters.' };
    if (item.reason.trim().length === 0 || item.reason.length > 140) return { error: 'Each reason must be 1 to 140 characters.' };
    if (item.focus_words.length > MAX_FOCUS_WORDS) return { error: `Use at most ${MAX_FOCUS_WORDS} focus words.` };

    const focusWords = [];
    for (const word of item.focus_words) {
      const match = content.words.find((known) => known.toLowerCase() === word.trim().toLowerCase());
      if (!match) return { error: `"${word}" is not a word in ${item.content_id}. Use only its listed words.` };
      if (!focusWords.includes(match)) focusWords.push(match);
    }

    planItems.push({
      id: item.day,
      day: item.day,
      kind: content.kind,
      refId: content.refId,
      title: item.title.trim(),
      reason: item.reason.trim(),
      focusWords,
      isNew: content.isNew,
    });
  }

  // A small library has to repeat something to fill five days.
  const maxUses = Math.max(MAX_USES_OF_ONE_ITEM, Math.ceil(WEEK_DAYS.length / state.content.size));
  if ([...uses.values()].some((count) => count > maxUses)) {
    return { error: `Use each item at most ${maxUses} times, so the week has variety.` };
  }
  if (state.newContentId && !uses.has(state.newContentId)) {
    return { error: `You made ${state.newContentId}, so it must be in the plan.` };
  }

  const problem = await textProblem(planItems.flatMap((item) => [item.title, item.reason]));
  if (problem) return { error: problem };

  planItems.sort((a, b) => WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day));
  await context.savePlan(planItems);
  return { saved: true };
}

// `context` holds this run's child, analysis, and functions to read and save.
export function createTools(context) {
  const state = {
    progressRead: false,
    libraryRead: false,
    reportSaved: false,
    finished: false,
    content: new Map(), // made-up id -> the real lesson or Talk set
    talkAllowed: false,
    picturesUsed: false,
    topicTries: 0,
    newContentId: null,
  };

  async function handle(name, args) {
    switch (name) {
      case 'get_progress':
        state.progressRead = true;
        return analysisForAI(context.analysis, context.ageBand);

      case 'get_library':
        state.libraryRead = true;
        return readLibrary(state, context);

      case 'create_content':
        if (!state.progressRead || !state.libraryRead) return { error: 'Call get_progress and get_library first.' };
        return createContent(state, context, args);

      case 'write_report': {
        if (!state.progressRead) return { error: 'Call get_progress first.' };
        if (state.reportSaved) return { error: 'The report is already saved.' };
        const result = await writeReport(context, args);
        if (result.saved) state.reportSaved = true;
        return result;
      }

      case 'submit_plan': {
        if (!state.libraryRead) return { error: 'Call get_library first.' };
        if (!state.reportSaved) return { error: 'Call write_report first.' };
        if (state.finished) return { error: 'The plan is already saved.' };
        const result = await submitPlan(state, context, args);
        if (result.saved) state.finished = true;
        return result;
      }

      default:
        return { error: `There is no tool called ${name}.` };
    }
  }

  return {
    definitions: DEFINITIONS,
    isFinished: () => state.finished,
    // Everything the AI gets back passes through here.
    async run(name, argumentsJson) {
      let args;
      try {
        args = JSON.parse(argumentsJson);
      } catch {
        return JSON.stringify({ error: 'The arguments were not valid JSON.' });
      }
      return hideNickname(JSON.stringify(await handle(name, args)), context.nickname);
    },
  };
}
