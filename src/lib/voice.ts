// Mochi's voice: the phone's own text-to-speech, through expo-speech.
// Every screen speaks through this file, so Mochi sounds the same everywhere.
// Privacy: never pass a child's nickname to speak(). Some Android voice engines
// can use the internet.
import * as Speech from 'expo-speech';

// 1.0 is normal. A higher pitch and a slower pace sound cute and clear.
const MOCHI_PITCH = 1.3;
const MOCHI_RATE = 0.85;
// Same voice and pitch, only slower, for saying a word clearly.
const MOCHI_SLOW_RATE = 0.5;
const LANGUAGE = 'en-US';

// Phones list many voices, and some are joke voices (iOS has "Bad News" and
// "Zarvox"), so we only choose a good-quality English voice that works offline.
// With no such voice we leave it empty and the phone uses its default English.
async function findBestVoice() {
  const voices = await Speech.getAvailableVoicesAsync();
  const good = voices.filter(
    (voice) =>
      voice.language.toLowerCase().startsWith('en') &&
      voice.quality === Speech.VoiceQuality.Enhanced &&
      !/network|eloquence|speech\.synthesis/i.test(voice.identifier),
  );
  const american = good.find((voice) => voice.language.replace('_', '-').toLowerCase() === 'en-us');
  return (american ?? good[0])?.identifier;
}

let voiceLookup: Promise<string | undefined> | null = null;
function mochiVoice() {
  voiceLookup ??= findBestVoice().catch(() => undefined);
  return voiceLookup;
}

// Counts every request, so only the newest one is spoken.
let latestRequest = 0;

// Mochi says `text`, replacing anything Mochi was saying. `onFinished` runs when
// the speech ends. It may never run on a phone that can't speak, so anything
// important must also have a time limit.
export async function speak(text: string, onFinished?: () => void, options?: { slow?: boolean }) {
  latestRequest += 1;
  const request = latestRequest;

  // Without stop(), new speech waits in a queue behind the old speech.
  await Speech.stop().catch(() => undefined);
  const voice = await mochiVoice();
  if (request !== latestRequest) return;

  Speech.speak(text, {
    language: LANGUAGE,
    voice,
    pitch: MOCHI_PITCH,
    rate: options?.slow ? MOCHI_SLOW_RATE : MOCHI_RATE,
    onDone: () => onFinished?.(),
    onError: () => onFinished?.(),
  });
}

// Says `text`, then runs `onContinue` once Mochi has finished and at least
// `minMs` has passed. `maxMs` makes sure a phone that can't speak (like an iPhone
// on silent) never gets stuck. Returns a function that cancels the wait.
export function speakAndWait(
  text: string,
  minMs: number,
  maxMs: number,
  onContinue: () => void,
  options?: { slow?: boolean },
) {
  const startedAt = Date.now();
  let finished = false;
  let minTimer: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => {
    finished = true;
    clearTimeout(minTimer);
    clearTimeout(maxTimer);
  };
  const moveOn = () => {
    if (finished) return;
    cancel();
    onContinue();
  };
  const maxTimer = setTimeout(moveOn, maxMs);

  speak(text, () => {
    if (finished) return;
    minTimer = setTimeout(moveOn, Math.max(minMs - (Date.now() - startedAt), 0));
  }, options);

  return cancel;
}

export function stopSpeaking() {
  latestRequest += 1;
  Speech.stop().catch(() => undefined);
}
