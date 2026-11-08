// Mochi's ears: records the child for a few seconds and reports what happened.
// Silence is never sent anywhere, and the recording is deleted from the phone
// as soon as it has been read.
import { useCallback, useRef } from 'react';
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type AudioRecorder,
  type RecordingOptions,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { withTimeout } from '@/lib/children';
import { db } from '@/lib/firebase';

const RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64_000,
  isMeteringEnabled: true, // lets us measure how loud the sound is
};

const WAIT_FOR_SPEECH_MS = 5_000; // how long Mochi waits for the child to start
const STOP_AFTER_QUIET_MS = 1_000; // stop this long after the child stops talking
const LONGEST_RECORDING_MS = 8_000;
const CHECK_EVERY_MS = 100;
// Loudness in decibels: 0 is the loudest and -160 is silence. Above this counts
// as someone talking. Lower it if quiet children are missed.
const SPEECH_LEVEL_DB = -35;

export type ListenResult = { status: 'heard'; audioBase64: string } | { status: 'silent' } | { status: 'cancelled' };

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mic mode routes sound to the phone's quiet earpiece on iPhones, so it is only
// on while recording. Otherwise Mochi's voice would become very quiet.
const setMicMode = (on: boolean) => setAudioModeAsync({ allowsRecording: on, playsInSilentMode: true });

async function recordChild(recorder: AudioRecorder, isCancelled: () => boolean): Promise<ListenResult> {
  await setMicMode(true);
  await recorder.prepareToRecordAsync();
  recorder.record();

  const startedAt = Date.now();
  let lastSoundAt = 0;

  while (!isCancelled()) {
    await pause(CHECK_EVERY_MS);
    const now = Date.now();
    const level = recorder.getStatus().metering;
    if (level !== undefined && level > SPEECH_LEVEL_DB) lastSoundAt = now;

    const childFinished = lastSoundAt > 0 && now - lastSoundAt >= STOP_AFTER_QUIET_MS;
    const nobodySpoke = lastSoundAt === 0 && now - startedAt >= WAIT_FOR_SPEECH_MS;
    if (childFinished || nobodySpoke || now - startedAt >= LONGEST_RECORDING_MS) break;
  }

  await recorder.stop();
  await setMicMode(false);

  const uri = recorder.uri;
  if (!uri) return { status: 'silent' };
  const file = new File(uri);

  try {
    if (isCancelled()) return { status: 'cancelled' };
    if (lastSoundAt === 0) return { status: 'silent' };
    return { status: 'heard', audioBase64: await file.base64() };
  } finally {
    file.delete();
  }
}

export function useListener() {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  // Each listen gets a number. Changing it tells that listen to stop.
  const currentListen = useRef(0);

  const listen = useCallback(() => {
    currentListen.current += 1;
    const mine = currentListen.current;
    return recordChild(recorder, () => mine !== currentListen.current);
  }, [recorder]);

  const cancel = useCallback(() => {
    currentListen.current += 1;
  }, []);

  return { listen, cancel };
}

// True if the app may use the microphone. Asks the phone if it hasn't yet.
export async function ensureMicPermission() {
  const current = await getRecordingPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await requestRecordingPermissionsAsync()).granted;
}

export async function saveVoiceConsent(uid: string) {
  await withTimeout(setDoc(doc(db, 'parents', uid), { voiceConsentAt: serverTimestamp() }, { merge: true }));
}
