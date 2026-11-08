import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { Celebration } from '@/components/game/Celebration';
import { LessonResults } from '@/components/game/LessonResults';
import { ListeningMochi } from '@/components/game/ListeningMochi';
import { SpeechBubble } from '@/components/game/SpeechBubble';
import { StarRow } from '@/components/game/StarRow';
import { Mochi } from '@/components/Mochi';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useChildren } from '@/context/ChildrenContext';
import { getTalkSet, talkSetFromSaved, type TalkSet, type TalkWord } from '@/data/talkSets';
import { checkSpeech, errorMessage, type SpeechResult } from '@/lib/api';
import { randomPraise, shuffle } from '@/lib/game';
import { loadSavedLesson } from '@/lib/lessonStore';
import { ensureMicPermission, useListener } from '@/lib/listen';
import { saveSpeechAttempt } from '@/lib/speechAttempts';
import { MAX_STARS_PER_WORD, MAX_TRIES_PER_WORD, starsForWord, type TalkResult } from '@/lib/talkGame';
import { speak, speakAndWait, stopSpeaking } from '@/lib/voice';

// teaching: Mochi says the word     listening: microphone on
// checking: waiting for the AI      waiting: stopped until someone taps Mochi
// correcting: Mochi says it slowly  celebrating: full-screen party
// encouraging: used all the tries
type Phase = 'teaching' | 'listening' | 'checking' | 'waiting' | 'correcting' | 'celebrating' | 'encouraging' | 'done';

// Where the child is up to. Passed along each step, so a step that finishes
// later still knows exactly which word and try it belongs to.
type Turn = { index: number; tries: number; mistakes: number };

const TAP_LINE = 'Tap me to try again!';
const HEARD_NOTHING_LINE = "I couldn't hear that. Tap me to try again!";
const NOT_LIKE_THAT_LINE = "It's not like that.";
const TRY_LATER_LINE = "Let's try again.";
const ALL_DONE_LINE = 'You finished. Well done!';

export default function SpeakScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const { user } = useAuth();
  const { selectedChild, voiceConsent, loading } = useChildren();
  const set = getTalkSet(setId);

  if (loading) return null;
  // The microphone is only ever used after a parent has agreed.
  if (!user || !selectedChild || !voiceConsent) return <Redirect href="/talk" />;
  if (set) return <TalkGame set={set} uid={user.uid} childId={selectedChild.id} />;
  return <SavedTalkGame setId={setId} uid={user.uid} childId={selectedChild.id} />;
}

type SavedTalkGameProps = { setId: string; uid: string; childId: string };

// Categories made with AI are stored in Firestore, so their pictures are loaded first.
function SavedTalkGame({ setId, uid, childId }: SavedTalkGameProps) {
  const [set, setSet] = useState<TalkSet | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true; // ignores the answer if the child has already left
    loadSavedLesson(uid, setId, 'talkSets')
      .then((saved) => active && setSet(talkSetFromSaved(saved)))
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, [uid, setId]);

  if (set) return <TalkGame set={set} uid={uid} childId={childId} />;

  return (
    <View style={styles.denied}>
      <Mochi size={180} />
      {error ? (
        <>
          <Text style={styles.deniedText} accessibilityLiveRegion="polite">
            {error}
          </Text>
          <ChunkyButton label="Go back" onPress={() => router.replace('/talk')} style={styles.deniedButton} />
        </>
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
    </View>
  );
}

function TalkGame({ set, uid, childId }: { set: TalkSet; uid: string; childId: string }) {
  const insets = useSafeAreaInsets();
  const listener = useListener();
  const { cancel: cancelListening, listen } = listener;

  const [words, setWords] = useState(() => shuffle(set.words));
  const [turn, setTurn] = useState<Turn>({ index: 0, tries: 0, mistakes: 0 });
  const [phase, setPhase] = useState<Phase>('teaching');
  const [bubble, setBubble] = useState('');
  const [praise, setPraise] = useState('');
  const [earnedStars, setEarnedStars] = useState(0);
  const [results, setResults] = useState<TalkResult[]>([]);
  const [micDenied, setMicDenied] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const cancelWait = useRef<(() => void) | null>(null);
  const resultsSoFar = useRef<TalkResult[]>([]);
  const onScreen = useRef(true);
  const startedAt = useRef(0);

  // Leaving the screen stops Mochi talking and turns the microphone off. This runs
  // on leaving (not on removal), so the recording can still be stopped and deleted.
  useFocusEffect(
    useCallback(() => {
      onScreen.current = true;
      return () => {
        onScreen.current = false;
        cancelWait.current?.();
        cancelListening();
        stopSpeaking();
      };
    }, [cancelListening]),
  );

  const word: TalkWord = words[turn.index];

  const stopAndWait = (line: string, spoken: boolean) => {
    setPhase('waiting');
    setBubble(line);
    if (spoken) speak(line);
  };

  const teach = (next: Turn) => {
    cancelWait.current?.();
    const current = words[next.index];
    setTurn(next);
    setPhase('teaching');
    setBubble(current.teachLine);
    cancelWait.current = speakAndWait(current.teachLine, 0, 12_000, () => startListening(next, current));
  };

  const goToNextWord = (from: Turn) => {
    if (from.index + 1 >= words.length) {
      // Only finished sessions are saved. The score shows either way.
      saveSpeechAttempt(uid, childId, set, resultsSoFar.current, startedAt.current).catch(() => setSaveFailed(true));
      setResults(resultsSoFar.current);
      setPhase('done');
      speak(ALL_DONE_LINE);
      return;
    }
    teach({ index: from.index + 1, tries: 0, mistakes: 0 });
  };

  const handleResult = (current: Turn, target: TalkWord, result: SpeechResult) => {
    if (result === 'unclear') {
      stopAndWait(HEARD_NOTHING_LINE, true);
      return;
    }

    const tries = current.tries + 1;

    if (result === 'correct' || result === 'close') {
      const slightSlip = result === 'close';
      const stars = starsForWord(tries, slightSlip);
      resultsSoFar.current = [
        ...resultsSoFar.current,
        {
          wordId: target.id,
          answer: target.word,
          stars,
          tries,
          mispronounced: current.mistakes + (slightSlip ? 1 : 0),
          slightSlip,
          gotIt: true,
        },
      ];
      const line = slightSlip ? `Good try! ${target.word}.` : randomPraise();
      setPraise(line);
      setEarnedStars(stars);
      setPhase('celebrating');
      cancelWait.current = speakAndWait(line, 2800, 6000, () => goToNextWord(current));
      return;
    }

    // Wrong word.
    const next = { ...current, tries, mistakes: current.mistakes + 1 };
    setTurn(next);

    if (tries >= MAX_TRIES_PER_WORD) {
      resultsSoFar.current = [
        ...resultsSoFar.current,
        {
          wordId: target.id,
          answer: target.word,
          stars: 0,
          tries,
          mispronounced: next.mistakes,
          slightSlip: false,
          gotIt: false,
        },
      ];
      setPhase('encouraging');
      setBubble(TRY_LATER_LINE);
      cancelWait.current = speakAndWait(TRY_LATER_LINE, 1500, 6000, () => goToNextWord(current));
      return;
    }

    setPhase('correcting');
    setBubble(`${NOT_LIKE_THAT_LINE} ${target.word}.`);
    cancelWait.current = speakAndWait(NOT_LIKE_THAT_LINE, 0, 6000, () => {
      // Same voice, just slower and clearer.
      cancelWait.current = speakAndWait(target.target, 300, 7000, () => startListening(next, target), { slow: true });
    });
  };

  const startListening = async (current: Turn, target: TalkWord) => {
    setPhase('listening');
    setBubble("I'm listening!");

    try {
      const heard = await listen();
      if (!onScreen.current || heard.status === 'cancelled') return;
      if (heard.status === 'silent') {
        stopAndWait(TAP_LINE, false);
        return;
      }

      setPhase('checking');
      setBubble('Let me think…');
      const { result } = await checkSpeech(target.target, heard.audioBase64);
      if (onScreen.current) handleResult(current, target, result);
    } catch (err) {
      if (onScreen.current) stopAndWait(errorMessage(err), false);
    }
  };

  // Runs for the first word, and again after Play again gives new words.
  const beginRound = useEffectEvent((allowed: boolean) => {
    if (!onScreen.current) return;
    if (allowed) teach({ index: 0, tries: 0, mistakes: 0 });
    else setMicDenied(true);
  });

  // The clock starts when a new set of words begins.
  useEffect(() => {
    startedAt.current = Date.now();
  }, [words]);

  useEffect(() => {
    ensureMicPermission()
      .catch(() => false)
      .then(beginRound);
  }, [words]);

  const playAgain = () => {
    resultsSoFar.current = [];
    setResults([]);
    setSaveFailed(false);
    setTurn({ index: 0, tries: 0, mistakes: 0 });
    setPhase('teaching');
    setWords(shuffle(set.words));
  };

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/talk'));

  if (micDenied) {
    return (
      <View style={styles.denied}>
        <Mochi size={180} />
        <Text style={styles.deniedText}>
          For grown-ups: Mochi needs the microphone. Please allow it in your phone&apos;s Settings.
        </Text>
        <ChunkyButton label="Open Settings" onPress={() => Linking.openSettings()} style={styles.deniedButton} />
        <ChunkyButton label="Go back" variant="fun" onPress={leave} style={styles.deniedButton} />
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <LessonResults
        results={results}
        starsPerPage={MAX_STARS_PER_WORD}
        saveFailed={saveFailed}
        onPlayAgain={playAgain}
        onDone={leave}
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={leave} accessibilityRole="button" accessibilityLabel="Leave" style={styles.exit}>
          <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={20} tintColor={colors.text} />
        </Pressable>
        <View style={styles.progress} accessible accessibilityLabel={`Word ${turn.index + 1} of ${words.length}`}>
          {words.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.progressDot,
                index < turn.index && styles.progressDone,
                index === turn.index && styles.progressNow,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.pictureCard}>
        {word.visual.type === 'color' ? (
          <View style={[styles.picture, { backgroundColor: word.visual.hex }]} />
        ) : (
          <Image source={word.visual.source} contentFit="contain" style={styles.picture} />
        )}
      </View>

      <Text style={styles.word}>{word.word}</Text>
      <StarRow stars={MAX_TRIES_PER_WORD - turn.tries} total={MAX_TRIES_PER_WORD} size={22} />

      <View style={styles.mochiRow}>
        {phase === 'listening' ? (
          <ListeningMochi size={132} />
        ) : (
          <Pressable
            onPress={() => teach(turn)}
            disabled={phase !== 'waiting'}
            accessibilityRole="button"
            accessibilityLabel="Hear Mochi again and try again"
          >
            <Mochi size={132} />
          </Pressable>
        )}
        <View style={styles.bubbleArea}>
          <SpeechBubble text={bubble} />
          {phase === 'checking' ? <ActivityIndicator color={colors.primary} style={styles.thinking} /> : null}
        </View>
      </View>

      {phase === 'celebrating' ? (
        <Celebration stars={earnedStars} praise={praise} maxStars={MAX_STARS_PER_WORD} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.skySoft,
    paddingHorizontal: 20,
    gap: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  exit: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    borderRadius: TAP_TARGET / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    paddingRight: TAP_TARGET, // keeps the dots centred on the screen
  },
  progressDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.surface,
  },
  progressDone: {
    backgroundColor: colors.primary,
  },
  progressNow: {
    backgroundColor: colors.yellow,
  },
  pictureCard: {
    flex: 1,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.surface,
    overflow: 'hidden',
  },
  picture: {
    flex: 1,
  },
  word: {
    fontFamily: fonts.heading,
    fontSize: 38,
    lineHeight: 46,
    color: colors.text,
    textAlign: 'center',
  },
  mochiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 150,
  },
  bubbleArea: {
    flex: 1,
    alignSelf: 'stretch',
  },
  thinking: {
    position: 'absolute',
    right: 12,
    bottom: 10,
  },
  denied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
    backgroundColor: colors.skySoft,
  },
  deniedText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
    textAlign: 'center',
  },
  deniedButton: {
    alignSelf: 'stretch',
  },
});
