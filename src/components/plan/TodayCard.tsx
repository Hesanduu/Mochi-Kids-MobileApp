import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { ChunkyButton } from '@/components/ChunkyButton';
import { Dots } from '@/components/Dots';
import { Mochi } from '@/components/Mochi';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { fillChildName, type PlanItem, type WeeklyPlan } from '@/lib/agent';
import { scheduleToday, type DayState, type ScheduleDay } from '@/lib/planSchedule';

const STATE_WORDS: Record<DayState, string> = {
  done: 'done',
  today: 'today',
  missed: 'still to do',
  upcoming: 'coming up',
  none: 'nothing planned',
};

// Opens the activity with its tricky words first, and links it back to the plan
// so finishing it ticks off the day.
function openItem(plan: WeeklyPlan, item: PlanItem) {
  const practice = { planWeek: plan.id, planItem: item.id, focus: item.focusWords.join('|') };
  if (item.kind === 'lesson') {
    router.push({ pathname: '/play/[lessonId]', params: { lessonId: item.refId, ...practice } });
  } else {
    router.push({ pathname: '/speak/[setId]', params: { setId: item.refId, ...practice } });
  }
}

function WeekDots({ days }: { days: ScheduleDay[] }) {
  const spoken = days.map((entry) => `${entry.name}: ${STATE_WORDS[entry.state]}`).join(', ');

  return (
    <View style={styles.week} accessible accessibilityLabel={`This week. ${spoken}`}>
      {days.map((entry) => (
        <View key={entry.day} style={styles.dayColumn}>
          <View style={[styles.dot, DOT_STYLES[entry.state]]}>
            {entry.state === 'done' ? (
              <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={15} tintColor={colors.surface} />
            ) : null}
          </View>
          <Text style={[styles.dayLetter, entry.state === 'today' && styles.dayLetterToday]}>{entry.letter}</Text>
        </View>
      ))}
    </View>
  );
}

type TodayCardProps = {
  plan: WeeklyPlan;
  nickname: string;
  // The parent's Plan tab links to the whole plan. Home keeps it simple for children.
  showPlanLink?: boolean;
  // A shorter layout, for Home where everything has to fit on one screen.
  compact?: boolean;
};

// Today's activity from the approved plan, with the week shown as five dots.
export function TodayCard({ plan, nickname, showPlanLink = false, compact = false }: TodayCardProps) {
  const { days, next, startsInFuture, everythingDone } = scheduleToday(plan);

  let label = 'Today with Mochi';
  let title = 'All done for today!';
  let detail = 'Mochi has more next time.';

  if (next) {
    if (next.isCatchUp) label = `Catch up from ${next.dayName}`;
    title = fillChildName(next.item.title, nickname);
    detail =
      next.item.focusWords.length > 0
        ? next.item.focusWords.join(', ')
        : next.item.kind === 'talk'
          ? 'Talk with Mochi'
          : 'Activity';
  } else if (startsInFuture) {
    label = 'Coming soon';
    title = 'Starts on Monday';
    detail = `${nickname}’s activities are ready.`;
  } else if (everythingDone) {
    title = 'All done this week!';
    detail = 'Well done! Mochi is so proud.';
  }

  const playButton = next ? (
    <ChunkyButton
      label="Play"
      height={compact ? 48 : 52}
      style={compact ? styles.compactPlay : undefined}
      onPress={() => openItem(plan, next.item)}
      icon={<SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={18} tintColor={colors.surface} />}
    />
  ) : null;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Dots
        dots={[
          { size: 10, color: colors.green, right: compact ? 78 : 104, top: 12 },
          { size: 8, color: colors.sky, right: 14, top: 10 },
        ]}
      />
      <View style={[styles.text, compact && styles.textCompact]}>
        <Text style={styles.label}>{label}</Text>
        <Text
          style={[styles.title, compact && styles.titleCompact]}
          numberOfLines={compact ? 1 : undefined}
          adjustsFontSizeToFit={compact}
          minimumFontScale={0.8}
        >
          {title}
        </Text>
        <Text style={styles.detail} numberOfLines={compact ? 1 : undefined}>
          {detail}
        </Text>
      </View>
      <Mochi size={compact ? 72 : 104} style={styles.mochi} />

      {compact ? (
        <View style={styles.compactRow}>
          <View style={styles.compactDots}>
            <WeekDots days={days} />
          </View>
          {playButton}
        </View>
      ) : (
        <>
          {playButton}
          <WeekDots days={days} />
        </>
      )}

      {showPlanLink ? (
        <Pressable
          onPress={() => router.push({ pathname: '/plan-review/[weekId]', params: { weekId: plan.id } })}
          accessibilityRole="button"
          style={styles.planLink}
        >
          <Text style={styles.planLinkText}>See the whole plan ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const DOT_STYLES = StyleSheet.create({
  done: {
    backgroundColor: colors.greenDark,
    borderColor: colors.greenDark,
  },
  today: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellowShadow,
  },
  missed: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  upcoming: {
    backgroundColor: colors.surface,
    borderColor: colors.divider,
  },
  none: {
    backgroundColor: 'transparent',
    borderColor: colors.divider,
    borderStyle: 'dashed',
  },
});

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
    borderRadius: radius.xxl,
    backgroundColor: colors.yellowSoft,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    overflow: 'hidden',
  },
  cardCompact: {
    padding: 12,
    gap: 8,
  },
  textCompact: {
    minHeight: 64,
    paddingRight: 76,
  },
  titleCompact: {
    fontSize: 21,
    lineHeight: 26,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactDots: {
    flex: 1,
  },
  compactPlay: {
    width: 104,
  },
  text: {
    minHeight: 84,
    justifyContent: 'center',
    paddingRight: 96, // room for Mochi on the right
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textMuted,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  detail: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  mochi: {
    position: 'absolute',
    right: 2,
    top: 4,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLetter: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  dayLetterToday: {
    fontFamily: fonts.bodyExtraBold,
    color: colors.text,
  },
  planLink: {
    minHeight: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -8,
  },
  planLinkText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.primary,
  },
});
