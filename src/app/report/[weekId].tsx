import { useEffect, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Dots } from '@/components/Dots';
import { Mochi } from '@/components/Mochi';
import { WeeklyBars } from '@/components/plan/WeeklyBars';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useChildren } from '@/context/ChildrenContext';
import {
  fillChildName,
  formatPeriod,
  markReportSeen,
  useWeeklyPlans,
  useWeeklyReports,
  type ReportItem,
  type WeeklyReport,
} from '@/lib/agent';

export default function WeeklyReportScreen() {
  const insets = useSafeAreaInsets();
  const { weekId } = useLocalSearchParams<{ weekId: string }>();
  const { user } = useAuth();
  const { selectedChild } = useChildren();
  const { items: reports, loading } = useWeeklyReports(selectedChild?.id);
  const { items: plans } = useWeeklyPlans(selectedChild?.id);
  const report = reports.find((item) => item.id === weekId);
  const plan = plans.find((item) => item.id === weekId);

  // Opening a report removes its NEW badge.
  const uid = user?.uid;
  const childId = selectedChild?.id;
  const unseenId = report && report.seenAt === null ? report.id : null;
  useEffect(() => {
    if (uid && childId && unseenId) markReportSeen(uid, childId, unseenId);
  }, [uid, childId, unseenId]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/plan'));

  if (!report || !selectedChild) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top + 16 }]}>
        <BackButton onPress={goBack} />
        {loading ? null : <Text style={styles.note}>This report isn&apos;t available.</Text>}
      </View>
    );
  }

  const name = (text: string) => fillChildName(text, selectedChild.nickname);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
      <View style={[styles.band, { paddingTop: insets.top + 12 }]}>
        <Dots
          dots={[
            { size: 12, color: colors.yellow, right: 148, top: insets.top + 26 },
            { size: 9, color: colors.green, right: 32, top: insets.top + 18 },
            { size: 8, color: colors.red, opacity: 0.7, right: 96, top: insets.top + 54 },
          ]}
        />
        <View style={styles.bandTop}>
          <BackButton onPress={goBack} />
          <Mochi size={112} style={styles.bandMochi} />
        </View>
        <Text style={styles.period}>{formatPeriod(report.periodStart, report.periodEnd)}</Text>
        <Text style={styles.headline} accessibilityRole="header">
          {name(report.headline)}
        </Text>
        <Text style={styles.overview}>{name(report.overview)}</Text>
      </View>

      <View style={styles.body}>
        <StatRow report={report} />

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Last 6 weeks</Text>
          <Text style={styles.chartSubtitle}>Average score each week</Text>
          <WeeklyBars weeks={report.weeklyHistory} />
        </View>

        {report.strong.length > 0 ? (
          <Section
            title="Strong at"
            icon={{ ios: 'star.fill', android: 'star' }}
            iconColor={colors.greenDark}
            cardStyle={styles.greenCard}
          >
            <Items items={report.strong} />
          </Section>
        ) : null}

        {report.learning.length > 0 ? (
          <Section
            title="Still learning"
            icon={{ ios: 'leaf.fill', android: 'eco' }}
            iconColor={colors.yellowShadow}
            cardStyle={styles.yellowCard}
          >
            <Items items={report.learning} />
          </Section>
        ) : null}

        <Section
          title="Try at home"
          icon={{ ios: 'house.fill', android: 'home' }}
          iconColor={colors.primary}
          cardStyle={styles.blueCard}
        >
          <View style={styles.items}>
            {report.tryAtHome.map((tip) => (
              <View key={tip.title}>
                <Text style={styles.itemTitle}>{name(tip.title)}</Text>
                <Text style={styles.itemDetail}>{name(tip.text)}</Text>
              </View>
            ))}
          </View>
        </Section>

        {plan?.status === 'pending_review' || plan?.status === 'approved' ? (
          <Pressable
            onPress={() => router.push({ pathname: '/plan-review/[weekId]', params: { weekId: plan.id } })}
            accessibilityRole="button"
            style={styles.planLink}
          >
            <Text style={styles.planLinkText}>{plan.status === 'pending_review' ? 'Review the plan' : 'See the plan'}</Text>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={16}
              tintColor={colors.primary}
            />
          </Pressable>
        ) : null}

        <Text style={styles.note}>A friendly guide based on play in the app, not a test.</Text>
      </View>
    </ScrollView>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton}>
      <SymbolView
        name={{ ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back_ios_new' }}
        size={20}
        tintColor={colors.text}
      />
    </Pressable>
  );
}

// The three headline numbers. These come straight from the scores, not from the AI.
function StatRow({ report }: { report: WeeklyReport }) {
  const { sessions, minutes, averageScore, change } = report.stats;

  return (
    <View style={styles.stats}>
      <Stat value={String(sessions)} label={sessions === 1 ? 'session' : 'sessions'} />
      <Stat value={String(minutes)} label={minutes === 1 ? 'minute' : 'minutes'} />
      <Stat value={averageScore === null ? '–' : `${averageScore}%`} label="average" change={change} />
    </View>
  );
}

function Stat({ value, label, change }: { value: string; label: string; change?: number | null }) {
  let trend: ReactNode = null;
  if (change !== undefined && change !== null && change !== 0) {
    const up = change > 0;
    trend = (
      <View style={styles.trend}>
        <SymbolView
          name={
            up
              ? { ios: 'arrow.up.right', android: 'trending_up', web: 'trending_up' }
              : { ios: 'arrow.down.right', android: 'trending_down', web: 'trending_down' }
          }
          size={14}
          tintColor={up ? colors.greenDark : colors.textMuted}
        />
        <Text style={styles.trendText}>{Math.abs(change)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend}
    </View>
  );
}

type SectionProps = {
  title: string;
  icon: { ios: SFSymbol; android: AndroidSymbol };
  iconColor: string;
  cardStyle: object;
  children: ReactNode;
};

function Section({ title, icon, iconColor, cardStyle, children }: SectionProps) {
  return (
    <View style={[styles.section, cardStyle]}>
      <View style={styles.sectionHeading}>
        <SymbolView name={{ ...icon, web: icon.android }} size={20} tintColor={iconColor} />
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Items({ items }: { items: ReportItem[] }) {
  return (
    <View style={styles.items}>
      {items.map((item) => (
        <View key={item.label}>
          <Text style={styles.itemTitle}>{item.label}</Text>
          <Text style={styles.itemDetail}>{item.detail}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: 16,
  },
  missing: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 16,
    backgroundColor: colors.background,
  },
  band: {
    backgroundColor: colors.skySoft,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 24,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  bandTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bandMochi: {
    marginRight: -8,
  },
  backButton: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    borderRadius: TAP_TARGET / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  period: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textMuted,
  },
  headline: {
    fontFamily: fonts.heading,
    fontSize: 30,
    lineHeight: 38,
    color: colors.text,
  },
  overview: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 25,
    color: colors.text,
    marginTop: 6,
  },
  body: {
    paddingHorizontal: 24,
    gap: 14,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: 27,
    lineHeight: 34,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  trendText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.text,
  },
  chartCard: {
    padding: 16,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  chartTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  chartSubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 4,
  },
  section: {
    padding: 16,
    gap: 10,
    borderRadius: radius.xxl,
    borderWidth: 1.5,
  },
  greenCard: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  yellowCard: {
    backgroundColor: colors.yellowSoft,
    borderColor: colors.yellow,
  },
  blueCard: {
    backgroundColor: colors.skySoft,
    borderColor: colors.sky,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  items: {
    gap: 10,
  },
  itemTitle: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  itemDetail: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  planLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TAP_TARGET + 8,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  planLinkText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    color: colors.primary,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
