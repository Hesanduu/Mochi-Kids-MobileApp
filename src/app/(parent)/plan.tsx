import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { ProgressOverviewCard } from '@/components/plan/ProgressOverviewCard';
import { ReportCard } from '@/components/plan/ReportCard';
import { ThisWeekCard } from '@/components/plan/ThisWeekCard';
import { TodayCard } from '@/components/plan/TodayCard';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useChildren } from '@/context/ChildrenContext';
import { currentPlanWeekId, formatPeriod, isPlanRunning, useWeeklyPlans, useWeeklyReports } from '@/lib/agent';
import { errorMessage, runAgent } from '@/lib/api';
import { registerForNotifications } from '@/lib/notifications';
import { activePlanToday } from '@/lib/planSchedule';

// What Mochi is doing for this child, their weekly reports, and their progress.
export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { selectedChild, agentEnabled } = useChildren();
  const { items: plans } = useWeeklyPlans(selectedChild?.id);
  const { items: reports } = useWeeklyReports(selectedChild?.id);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string>();

  const latestPlan = plans[0];
  const running = isPlanRunning(latestPlan);
  const activePlan = activePlanToday(plans);
  // Each week can only have one plan, unless a parent discards it.
  const thisWeeksStatus = plans.find((plan) => plan.id === currentPlanWeekId())?.status;
  const canMakePlan = agentEnabled && !running && thisWeeksStatus !== 'pending_review' && thisWeeksStatus !== 'approved';
  const [latestReport, ...pastReports] = reports;

  const makePlan = async () => {
    if (!selectedChild) return;
    // A parent has just tapped, so this is a fair moment to ask about notifications.
    if (user) registerForNotifications(user.uid, { ask: true });
    setError(undefined);
    setStarting(true);
    try {
      // The server works in the background. The cards above update by themselves.
      await runAgent(selectedChild.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>{selectedChild ? `${selectedChild.nickname}'s plan` : 'Plan'}</Text>

      {!selectedChild ? (
        <Text style={styles.empty}>Add a child to see their plan here.</Text>
      ) : (
        <>
          {activePlan ? <TodayCard plan={activePlan} nickname={selectedChild.nickname} showPlanLink /> : null}

          {/* Also shown when a newer plan is being made or waiting for review. */}
          {activePlan?.id !== latestPlan?.id || !activePlan ? (
            <ThisWeekCard
              nickname={selectedChild.nickname}
              agentEnabled={agentEnabled}
              running={running}
              plan={latestPlan}
              hasReport={latestReport !== undefined}
            />
          ) : null}

          {latestReport ? <ReportCard report={latestReport} nickname={selectedChild.nickname} /> : null}

          <ProgressOverviewCard childId={selectedChild.id} />

          {pastReports.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past reports</Text>
              <View style={styles.card}>
                {pastReports.map((report, index) => (
                  <Pressable
                    key={report.id}
                    onPress={() => router.push({ pathname: '/report/[weekId]', params: { weekId: report.id } })}
                    accessibilityRole="button"
                    style={[styles.row, index < pastReports.length - 1 && styles.rowDivider]}
                  >
                    <Text style={styles.rowTitle}>{formatPeriod(report.periodStart, report.periodEnd)}</Text>
                    {report.stats.averageScore !== null ? (
                      <Text style={styles.rowScore}>{report.stats.averageScore}%</Text>
                    ) : null}
                    <SymbolView
                      name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                      size={16}
                      tintColor={colors.textMuted}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          {canMakePlan ? (
            <ChunkyButton label="Make plan now" variant="fun" onPress={makePlan} loading={starting} />
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 21,
    lineHeight: 28,
    color: colors.text,
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: TAP_TARGET + 8,
    paddingHorizontal: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerSoft,
  },
  rowTitle: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  rowScore: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    color: colors.text,
  },
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.error,
    textAlign: 'center',
  },
});
