import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Dots } from '@/components/Dots';
import { Mochi } from '@/components/Mochi';
import { colors, fonts, radius } from '@/constants/theme';
import type { WeeklyPlan } from '@/lib/agent';

type ThisWeekCardProps = {
  nickname: string;
  agentEnabled: boolean;
  running: boolean;
  plan: WeeklyPlan | undefined;
  hasReport: boolean;
};

// The top of the Plan tab: what Mochi is doing for this child right now.
export function ThisWeekCard({ nickname, agentEnabled, running, plan, hasReport }: ThisWeekCardProps) {
  let title = 'This week';
  let text = `Tap Make plan now and Mochi will look at ${nickname}\u2019s progress.`;
  let link: string | null = null;
  let onPress: (() => void) | null = null;

  const openReview = () => {
    if (plan) router.push({ pathname: '/plan-review/[weekId]', params: { weekId: plan.id } });
  };

  if (!agentEnabled) {
    title = 'Let Mochi plan the week';
    text = `Mochi can look at ${nickname}\u2019s progress and write you a report every week.`;
    link = 'Find out more ›';
    onPress = () => router.push('/agent-consent');
  } else if (running) {
    title = 'Mochi is thinking…';
    text = `Looking at ${nickname}\u2019s week and planning what comes next. This can take a minute.`;
  } else if (plan?.status === 'failed') {
    title = 'Mochi couldn\u2019t finish';
    text = 'Something went wrong this time. Please try again.';
  } else if (plan?.status === 'pending_review') {
    title = 'Mochi\u2019s plan is ready';
    text = `Have a look, then approve it for ${nickname}.`;
    link = 'Review the plan ›';
    onPress = openReview;
  } else if (hasReport) {
    text = `Mochi has looked at ${nickname}\u2019s week. Read the report below.`;
  }

  const content = (
    <>
      <Dots
        dots={[
          { size: 10, color: colors.yellow, right: 112, top: 14 },
          { size: 8, color: colors.green, right: 18, top: 12 },
        ]}
      />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{text}</Text>
        {running ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}
        {link ? <Text style={styles.link}>{link}</Text> : null}
      </View>
      <Mochi size={112} style={styles.mochi} />
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    minHeight: 132,
    borderRadius: radius.xxl,
    backgroundColor: colors.skySoft,
    borderWidth: 1.5,
    borderColor: colors.sky,
    paddingVertical: 16,
    paddingLeft: 18,
    paddingRight: 118, // room for Mochi on the right
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    gap: 3,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 21,
    lineHeight: 27,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  link: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.primary,
    marginTop: 3,
  },
  spinner: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  mochi: {
    position: 'absolute',
    right: 2,
    bottom: -4,
  },
});
