import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { ParentGate } from '@/components/ParentGate';
import { NewContentPreview } from '@/components/plan/NewContentPreview';
import { ScreenBanner } from '@/components/ScreenBanner';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useChildren } from '@/context/ChildrenContext';
import {
  approvePlan,
  discardPlan,
  fillChildName,
  planWeekName,
  useWeeklyPlans,
  type PlanItem,
} from '@/lib/agent';
import { errorMessage } from '@/lib/api';

const DAY_NAMES = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
} as const;

// A parent's review queue. Nothing here reaches a child until it is approved,
// so an adult check comes first.
export default function PlanReviewScreen() {
  const insets = useSafeAreaInsets();
  const { weekId } = useLocalSearchParams<{ weekId: string }>();
  const { user } = useAuth();
  const { selectedChild } = useChildren();
  const { items: plans, loading } = useWeeklyPlans(selectedChild?.id);
  const plan = plans.find((item) => item.id === weekId);

  const [adultChecked, setAdultChecked] = useState(false);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/plan'));

  if (!adultChecked) {
    return (
      <View style={styles.screen}>
        <ParentGate onPass={() => setAdultChecked(true)} onCancel={goBack} />
      </View>
    );
  }

  if (!plan || !user || !selectedChild) {
    return (
      <View style={[styles.screen, styles.content, { paddingTop: insets.top + 16 }]}>
        <ScreenBanner onBack={goBack} backLabel="Go back" />
        {loading ? null : <Text style={styles.subtitle}>This plan isn&apos;t available.</Text>}
      </View>
    );
  }

  const uid = user.uid;
  const childId = selectedChild.id;
  const nickname = selectedChild.nickname;
  const editable = plan.status === 'pending_review';
  const keptCount = plan.items.length - removedIds.length;
  const activities = keptCount === 1 ? 'activity' : 'activities';

  const toggleRemoved = (id: string) =>
    setRemovedIds((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]));

  const runAndLeave = async (work: () => Promise<void>) => {
    setError(undefined);
    setBusy(true);
    try {
      await work();
      goBack();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const confirmDiscard = () => {
    Alert.alert(
      'Discard this plan?',
      editable ? 'Any new pictures Mochi made for it will be deleted.' : `${nickname} won’t see this plan any more.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => runAndLeave(() => discardPlan(uid, childId, plan)),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
    >
      <ScreenBanner onBack={goBack} backLabel="Go back" />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>
          {planWeekName(plan.weekStart)} for {nickname}
        </Text>
        <Text style={styles.subtitle}>
          {editable
            ? `Remove anything you don’t want. Nothing reaches ${nickname} until you approve it.`
            : 'You approved this plan.'}
        </Text>
      </View>

      {plan.items.map((item) => (
        <PlanItemCard
          key={item.id}
          item={item}
          uid={uid}
          nickname={nickname}
          editable={editable}
          done={Boolean(plan.doneItems[item.id])}
          removed={removedIds.includes(item.id)}
          onToggle={() => toggleRemoved(item.id)}
        />
      ))}

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      {editable && keptCount > 0 ? (
        <ChunkyButton
          label={removedIds.length === 0 ? 'Approve all' : `Approve ${keptCount} ${activities}`}
          onPress={() => runAndLeave(() => approvePlan(uid, childId, plan, removedIds))}
          loading={busy}
        />
      ) : null}

      <Pressable onPress={confirmDiscard} disabled={busy} accessibilityRole="button" style={styles.discard}>
        <Text style={styles.discardText}>Discard this plan</Text>
      </Pressable>
    </ScrollView>
  );
}

type PlanItemCardProps = {
  item: PlanItem;
  uid: string;
  nickname: string;
  editable: boolean;
  done: boolean;
  removed: boolean;
  onToggle: () => void;
};

function PlanItemCard({ item, uid, nickname, editable, done, removed, onToggle }: PlanItemCardProps) {
  return (
    <View style={[styles.card, removed && styles.cardRemoved]}>
      <View style={styles.cardTop}>
        <Text style={styles.day}>{DAY_NAMES[item.day]}</Text>
        {item.isNew ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        ) : null}
        {done ? <Text style={styles.done}>Done</Text> : null}
        <View style={styles.spacer} />
        {editable ? (
          <Pressable
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityLabel={removed ? `Put back ${item.title}` : `Remove ${item.title}`}
            style={styles.removeButton}
          >
            {removed ? (
              <Text style={styles.undo}>Undo</Text>
            ) : (
              <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor={colors.error} />
            )}
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.itemTitle}>{fillChildName(item.title, nickname)}</Text>
      <Text style={styles.kind}>{item.kind === 'lesson' ? 'Activity' : 'Talk with Mochi'}</Text>

      {removed ? (
        <Text style={styles.detail}>Removed</Text>
      ) : (
        <>
          <Text style={styles.detail}>{fillChildName(item.reason, nickname)}</Text>
          {item.focusWords.length > 0 ? (
            <Text style={styles.focus}>Practising: {item.focusWords.join(', ')}</Text>
          ) : null}
          {item.isNew ? <NewContentPreview uid={uid} item={item} /> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    gap: 14,
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
  },
  card: {
    padding: 16,
    paddingTop: 8,
    gap: 3,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  cardRemoved: {
    backgroundColor: colors.background,
    borderStyle: 'dashed',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: TAP_TARGET,
  },
  day: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.surface,
  },
  done: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.greenDark,
  },
  spacer: {
    flex: 1,
  },
  removeButton: {
    minWidth: TAP_TARGET,
    height: TAP_TARGET,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undo: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.primary,
  },
  itemTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  kind: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  detail: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    marginTop: 4,
  },
  focus: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.error,
    textAlign: 'center',
  },
  discard: {
    minHeight: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.error,
  },
});
