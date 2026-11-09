// Makes sure every /api/ request comes from a logged-in parent.
// The app sends a Firebase "ID token" (a short-lived proof of who is logged in),
// and Firebase's official Admin library checks that it is genuine.
import { adminAuth } from './firebaseAdmin.js';

const NOT_LOGGED_IN = 'Please log in again to use this.';

export async function requireLogin(req, res, next) {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!token) return res.status(401).json({ error: NOT_LOGGED_IN });

  let auth;
  try {
    auth = adminAuth();
  } catch (err) {
    // A setup problem must never let a request through ("fail closed").
    console.error('Login check is not set up:', err.message);
    return res.status(503).json({ error: "Mochi isn't ready yet. Please try again soon." });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.uid = decoded.uid; // later steps can see which parent is asking
  } catch (err) {
    console.warn('Login check failed:', err.code ?? 'unknown error');
    return res.status(401).json({ error: NOT_LOGGED_IN });
  }

  next();
}
