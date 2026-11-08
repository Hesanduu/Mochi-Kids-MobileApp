// Mochi Kids backend.
// Keeps API keys off the phone and makes sure every image request is child-safe.
// Run with: npm run dev   (reads keys from server/.env)
import express from 'express';

import { drawPicture, planLesson } from './ai.js';
import { rateLimit } from './rateLimit.js';
import { requireLogin } from './requireLogin.js';
import { checkLessonTopic, checkRequest, GENTLE_NO, lessonHasBlockedWord, LESSON_NO } from './safety.js';

const app = express();
app.use(express.json({ limit: '2kb' })); // requests are just a short text

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
  const check = await checkLessonTopic(req.body?.topic);
  if (!check.ok) return res.status(400).json({ error: check.message });

  try {
    const plan = await planLesson(check.text);
    if (!plan || lessonHasBlockedWord(plan)) return res.status(400).json({ error: LESSON_NO });

    const pictures = await Promise.all(
      plan.items.map((item) => drawPicture(item.picture, { forLesson: true })),
    );
    // No half-finished lessons: every picture must have passed its safety check.
    if (pictures.some((picture) => !picture)) {
      return res.status(400).json({ error: "Mochi couldn't draw that lesson. Please try a different topic." });
    }

    res.json({
      title: plan.title,
      topic: check.text,
      items: plan.items.map((item, index) => ({
        id: `item-${index + 1}`,
        word: item.word.trim().replace(/^./, (first) => first.toUpperCase()),
        question: item.question.trim(),
        ...pictures[index],
      })),
    });
  } catch (err) {
    console.error('AI lesson failed:', err.message);
    res.status(502).json({ error: "Mochi couldn't make a lesson right now. Please try again." });
  }
});

const port = Number(process.env.PORT) || 3000;
// 0.0.0.0 = reachable from other devices on your Wi-Fi (your phone).
app.listen(port, '0.0.0.0', () => {
  console.log(`Mochi server running on http://localhost:${port}`);
});
