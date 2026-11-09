// Mochi Kids backend.
// Keeps API keys off the phone and makes sure every image request is child-safe.
// Run with: npm run dev   (reads keys from server/.env)
import express from 'express';

import { checkSpeech, drawPicture } from './ai.js';
import { startAgentRun } from './agent/learningPath.js';
import { startWeeklyTimer } from './agent/scheduler.js';
import { makeLesson } from './lessonMaker.js';
import { notifyParent } from './notify.js';
import { rateLimit } from './rateLimit.js';
import { requireLogin } from './requireLogin.js';
import { checkRequest, GENTLE_NO } from './safety.js';

const app = express();

// ---------- Check how a child said a word ----------
// This route comes before the small size limit below, because it carries a short
// voice clip. The login check runs first, so strangers can't send large files.
// The clip is never saved, and the result is the only thing sent back.
app.post(
  '/api/speech/check',
  requireLogin,
  rateLimit({ max: 200 }),
  express.json({ limit: '1mb' }),
  async (req, res) => {
    const word = req.body?.word;
    const audioBase64 = req.body?.audioBase64;
    if (typeof word !== 'string' || !/^[a-z][a-z ]{1,23}$/.test(word) || typeof audioBase64 !== 'string' || !audioBase64) {
      return res.status(400).json({ error: 'Something went wrong. Please try again.' });
    }

    try {
      res.json({ result: await checkSpeech(word, Buffer.from(audioBase64, 'base64')) });
    } catch (err) {
      console.error('Speech check failed:', err.status ?? err.code ?? 'unknown error');
      res.status(502).json({ error: "Mochi couldn't listen right now. Please try again." });
    }
  },
);

app.use(express.json({ limit: '2kb' })); // other requests are just a short text

// Quick "is the server running?" check. Open http://<laptop-ip>:3000/health on your phone.
app.get('/health', (req, res) => res.json({ ok: true }));

// Everything under /api/ is for logged-in parents only.
app.use('/api', requireLogin);

// ---------- Search Unsplash photos ----------
app.get('/api/images/search', rateLimit({ max: 60 }), async (req, res) => {
  const check = await checkRequest(req.query.q);
  if (!check.ok) return res.status(400).json({ error: check.message });

  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.error('UNSPLASH_ACCESS_KEY is missing from server/.env');
    return res.status(500).json({ error: 'Photos are not set up yet.' });
  }

  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), 20);
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', check.text);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', '20');
  url.searchParams.set('content_filter', 'high'); // Unsplash's strictest filter

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });
    if (!response.ok) {
      console.error('Unsplash error:', response.status);
      return res.status(502).json({ error: "Mochi couldn't find photos right now." });
    }
    const data = await response.json();

    // Send the app only what it needs.
    const photos = data.results.map((p) => ({
      id: p.id,
      url: p.urls.small,
      fullUrl: p.urls.regular,
      width: p.width,
      height: p.height,
      color: p.color,
      alt: p.alt_description ?? '',
      photographer: p.user?.name ?? 'Unknown',
    }));
    res.json({ photos, hasMore: page < data.total_pages });
  } catch (err) {
    console.error('Unsplash request failed:', err.message);
    res.status(502).json({ error: "Mochi couldn't find photos right now." });
  }
});

// ---------- Draw one picture with AI (OpenAI) ----------
app.post('/api/images/generate', rateLimit({ max: 10 }), async (req, res) => {
  const check = await checkRequest(req.body?.prompt);
  if (!check.ok) return res.status(400).json({ error: check.message });

  try {
    const picture = await drawPicture(check.text);
    // No image means OpenAI refused it, or the finished picture failed moderation.
    if (!picture) return res.status(400).json({ error: GENTLE_NO });
    res.json(picture);
  } catch (err) {
    console.error('AI image failed:', err.message);
    res.status(502).json({ error: "Mochi couldn't draw right now. Please try again." });
  }
});

// ---------- Create a whole lesson with AI from one topic word ----------
app.post('/api/lessons/generate', rateLimit({ max: 5 }), async (req, res) => {
  try {
    const result = await makeLesson(req.body?.topic);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json(result.lesson);
  } catch (err) {
    console.error('AI lesson failed:', err.message);
    res.status(502).json({ error: "Mochi couldn't make a lesson right now. Please try again." });
  }
});

// ---------- Ask the Learning Path Agent to start on a child's week ----------
// The parent comes from the login token, never from the request, so a parent can
// only ever start a run for their own child.
app.post('/api/agent/run', rateLimit({ max: 5 }), async (req, res) => {
  const childId = req.body?.childId;
  if (typeof childId !== 'string' || !/^[A-Za-z0-9]{1,64}$/.test(childId)) {
    return res.status(400).json({ error: 'Something went wrong. Please try again.' });
  }

  try {
    const { httpStatus, body, done } = await startAgentRun(req.uid, childId);
    res.status(httpStatus).json(body);
    // When the agent has finished, tell the parent's phones.
    done?.then((finished) => finished && notifyParent(req.uid));
  } catch (err) {
    console.error('Could not start the agent:', err.message);
    res.status(502).json({ error: "Mochi couldn't start planning right now. Please try again." });
  }
});

const port = Number(process.env.PORT) || 3000;
// 0.0.0.0 = reachable from other devices on your Wi-Fi (your phone).
app.listen(port, '0.0.0.0', () => {
  console.log(`Mochi server running on http://localhost:${port}`);
  startWeeklyTimer();
});
