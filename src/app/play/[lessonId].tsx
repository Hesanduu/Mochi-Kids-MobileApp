import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Celebration } from '@/components/game/Celebration';
import { ChoiceCard } from '@/components/game/ChoiceCard';
import { LessonResults } from '@/components/game/LessonResults';
import { SpeechBubble } from '@/components/game/SpeechBubble';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mochi } from '@/components/Mochi';
import { colors, fonts, TAP_TARGET } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useChildren } from '@/context/ChildrenContext';
import { getPresetLesson, type Lesson, type LessonItem } from '@/data/lessons';
import { errorMessage } from '@/lib/api';
import { saveAttempt } from '@/lib/attempts';
import { buildPages, CHOICES_PER_PAGE, randomPraise, starsForTry, type PageResult } from '@/lib/game';
import { loadSavedLesson } from '@/lib/lessonStore';
import { speak, speakAndWait, stopSpeaking } from '@/lib/voice';

// asking: waiting for a tap     lastChoice: only the answer is left
// celebrating: full-screen party     gentle: answered on the last choice (no stars)
type Phase = 'asking' | 'lastChoice' | 'celebrating' | 'gentle' | 'done';

const LAST_CHOICE_LINE = 'This one is the answer. Tap it!';
const GENTLE_LINE = "That's the correct answer. Let's try that again later.";
const ALL_DONE_LINE = 'You finished the lesson. Well done!';

export default function PlayScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const preset = getPresetLesson(lessonId);
  const { user } = useAuth();
  const { selectedChild, loading } = useChildren();

  if (loading) return null;
  if (!user || !selectedChild) return <Redirect href="/activities" />;
  if (preset) return <LessonGame lesson={preset} uid={user.uid} childId={selectedChild.id} />;
  return <SavedLessonGame lessonId={lessonId} uid={user.uid} childId={selectedChild.id} />;
}

type SavedLessonGameProps = { lessonId: string; uid: string; childId: string };

// AI lessons are stored in Firestore, so their pictures are loaded first.
function SavedLessonGame({ lessonId, uid, childId }: SavedLessonGameProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true; // ignores the answer if the child has already left
    loadSavedLesson(uid, lessonId)
      .then((loaded) => active && setLesson(loaded))
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, [uid, lessonId]);

  if (lesson) return <LessonGame lesson={lesson} uid={uid} childId={childId} />;

  return (
    <View style={styles.loading}>
      <Mochi size={180} />
      {error ? (
        <>
          <Text style={styles.loadingError} accessibilityLiveRegion="polite">
            {error}
          </Text>
          <ChunkyButton label="Go back" onPress={() => router.replace('/activities')} style={styles.loadingButton} />
        </>
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
    </View>
  );
}

function LessonGame({ lesson, uid, childId }: { lesson: Lesson; uid: string; childId: string }) {
  const insets = useSafeAreaInsets();
  const [pages, setPages] = useState(() => buildPages(lesson));
  const [pageIndex, setPageIndex] = useState(0);
  const [wrongPicks, setWrongPicks] = useState<LessonItem[]>([]);
  const [phase, setPhase] = useState<Phase>('asking');
  const [results, setResults] = useState<PageResult[]>([]);
  const [praise, setPraise] = useState('');
  const [earnedStars, setEarnedStars] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);

  // Cancels the wait before the next page, e.g. when the child leaves.
  const cancelWait = useRef<(() => void) | null>(null);
  const startedAt = useRef(0);

  const page = pages[pageIndex];
  const canTap = phase === 'asking' || phase === 'lastChoice';

  // Mochi asks the question whenever a new page appears.
  useEffect(() => {
    speak(page.item.question);
  }, [page]);

  // The clock starts when a new set of pages begins.
  useEffect(() => {
    startedAt.current = Date.now();
  }, [pages]);

  // Leaving the screen silences Mochi and stops any waiting.
  useEffect(() => {
    return () => {
      cancelWait.current?.();
      stopSpeaking();
    };
  }, []);

  const goToNextPage = (latestResults: PageResult[]) => {
    if (pageIndex + 1 >= pages.length) {
      // Only finished lessons are saved. The score shows either way.
      saveAttempt(uid, childId, lesson, latestResults, startedAt.current).catch(() => setSaveFailed(true));
      setPhase('done');
      speak(ALL_DONE_LINE);
      return;
    }
    setPageIndex(pageIndex + 1);
    setWrongPicks([]);
    setPhase('asking');
  };

  // Says the line, then moves on. Saved so leaving the screen can cancel it.
  const speakThenContinue = (text: string, minMs: number, maxMs: number, latestResults: PageResult[]) => {
    cancelWait.current = speakAndWait(text, minMs, maxMs, () => goToNextPage(latestResults));
  };

  const handleChoice = (choice: LessonItem) => {
    if (choice.id !== page.item.id) {
      const nextWrong = [...wrongPicks, choice];
      setWrongPicks(nextWrong);
      if (nextWrong.length === CHOICES_PER_PAGE - 1) {
        setPhase('lastChoice');
        speak(LAST_CHOICE_LINE);
      } else {
        speak(`Oops, try again! ${page.item.question}`);
      }
      return;
    }

    const tries = wrongPicks.length + 1;
    const stars = starsForTry(tries);
    const latestResults = [
      ...results,
      { answer: page.item.word, stars, tries, wrongPicks: wrongPicks.map((item) => item.word) },
    ];
    setResults(latestResults);

    if (stars === 0) {
      setPhase('gentle');
      speakThenContinue(GENTLE_LINE, 1500, 7000, latestResults);
      return;
    }

    const line = randomPraise();
    setPraise(line);
    setEarnedStars(stars);
    setPhase('celebrating');
    speakThenContinue(line, 2800, 6000, latestResults);
  };

  const playAgain = () => {
    setResults([]);
    setSaveFailed(false);
    setWrongPicks([]);
    setPageIndex(0);
    setPhase('asking');
    setPages(buildPages(lesson)); // new pages, so the effect above asks the first question
  };

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/activities'));

  if (phase === 'done') {
    return <LessonResults results={results} saveFailed={saveFailed} onPlayAgain={playAgain} onDone={leave} />;
  }

  let mochiLine = page.item.question;
  if (phase === 'gentle') mochiLine = GENTLE_LINE;
  else if (phase === 'lastChoice') mochiLine = LAST_CHOICE_LINE;
  else if (wrongPicks.length > 0) mochiLine = `Oops, try again! ${page.item.question}`;

  const cardState = (choice: LessonItem) => {
    if (wrongPicks.some((wrong) => wrong.id === choice.id)) return 'wrong';
    return phase === 'lastChoice' || phase === 'gentle' ? 'glow' : 'normal';
  };

  // Show the 4 choices as two rows of two.
  const rows = [page.choices.slice(0, 2), page.choices.slice(2, 4)];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={leave} accessibilityRole="button" accessibilityLabel="Leave lesson" style={styles.exit}>
          <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={20} tintColor={colors.text} />
        </Pressable>
        <View
          style={styles.progress}
          accessible
          accessibilityLabel={`Page ${pageIndex + 1} of ${pages.length}`}
        >
          {pages.map((item, index) => (
            <View
              key={item.item.id}
              style={[
                styles.progressDot,
                index < pageIndex && styles.progressDone,
                index === pageIndex && styles.progressNow,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.mochiRow}>
        <Pressable
          onPress={() => speak(mochiLine)}
          disabled={!canTap}
          accessibilityRole="button"
          accessibilityLabel="Hear Mochi again"
        >
          <Mochi size={132} />
        </Pressable>
        <SpeechBubble text={mochiLine} />
      </View>

      {/* The key gives each page fresh cards. */}
      <View key={`${page.item.id}-${pageIndex}`} style={styles.grid}>
        {rows.map((row) => (
          <View key={row[0].id} style={styles.gridRow}>
            {row.map((choice) => {
              const state = cardState(choice);
              return (
                <ChoiceCard
                  key={choice.id}
                  item={choice}
                  state={state}
                  disabled={!canTap || state === 'wrong'}
                  onPress={() => handleChoice(choice)}
                />
              );
            })}
          </View>
        ))}
      </View>

      {phase === 'celebrating' ? <Celebration stars={earnedStars} praise={praise} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
    backgroundColor: colors.skySoft,
  },
  loadingError: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
    textAlign: 'center',
  },
  loadingButton: {
    alignSelf: 'stretch',
  },
  screen: {
    flex: 1,
    backgroundColor: colors.skySoft,
    paddingHorizontal: 20,
    gap: 14,
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
  mochiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 150,
  },
  grid: {
    flex: 1,
    gap: 14,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
});
