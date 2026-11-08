// Talks to our own server (server/), never to Unsplash or OpenAI directly.
// The server holds the API keys and runs the child-safety checks.

// Set in the app's .env, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
// (EXPO_PUBLIC_ variables are built into the app, so only put addresses here, never keys.)
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type Photo = {
  id: string;
  url: string; // small, for the grid
  fullUrl: string; // bigger, for full screen
  width: number;
  height: number;
  color: string; // average colour, shown while the photo loads
  alt: string;
  photographer: string;
};

export type Picture = {
  imageBase64: string;
  mimeType: string;
};

// A friendly message we can show straight to the child or parent.
export class FriendlyError extends Error {}

async function request<T>(path: string, init: RequestInit, timeoutMs: number): Promise<T> {
  if (!API_URL) {
    throw new FriendlyError('Mochi is not connected yet. Add EXPO_PUBLIC_API_URL to .env.');
  }

  // Give up if the server takes too long.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } catch {
    // Network error or timeout: server not running, wrong IP, or a different Wi-Fi.
    throw new FriendlyError("Mochi can't connect right now. Please try again in a moment.");
  } finally {
    clearTimeout(timer);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // The server always sends { error: "friendly message" }.
    throw new FriendlyError(body?.error ?? 'Something went wrong. Please try again.');
  }
  return body as T;
}

export function searchPhotos(query: string, page = 1) {
  const params = new URLSearchParams({ q: query, page: String(page) });
  return request<{ photos: Photo[]; hasMore: boolean }>(
    `/api/images/search?${params}`,
    { method: 'GET' },
    15_000,
  );
}

export function generatePicture(prompt: string) {
  return request<Picture>(
    '/api/images/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    },
    90_000, // drawing takes a while
  );
}

// Turns any error into something safe to show on screen.
export function errorMessage(err: unknown) {
  return err instanceof FriendlyError ? err.message : 'Something went wrong. Please try again.';
}
