// A tiny in-memory rate limiter: each device (IP address) gets a fixed number of
// requests per hour. It protects your API bill if something loops by mistake.
// It resets when the server restarts, which is fine for development.

export function rateLimit({ max, windowMs = 60 * 60 * 1000 }) {
  const hits = new Map(); // ip -> { count, resetAt }

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    let entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({
        error: 'Mochi needs a little rest. Please try again later!',
      });
    }
    next();
  };
}
