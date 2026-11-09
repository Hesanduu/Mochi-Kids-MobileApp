import { router } from 'expo-router';

import { ActivityCard } from '@/components/ActivityCard';
import { TodayCard } from '@/components/plan/TodayCard';
import { useChildren } from '@/context/ChildrenContext';
import { fillChildName, isPlanRunning, useWeeklyPlans, useWeeklyReports } from '@/lib/agent';
import { activePlanToday } from '@/lib/planSchedule';

const SPARKLES = { ios: 'sparkles', android: 'auto_awesome' } as const;

// Home's window onto the Learning Path Agent. Home has to fit on one screen, so
// this shows only the most important thing. Anything else waiting for the parent
// shows as a NEW badge on the Plan window.
export function AgentHomeCard() {
  const { selectedChild, agentEnabled, loading } = useChildren();
  const { items: plans } = useWeeklyPlans(selectedChild?.id);
  const { items: reports } = useWeeklyReports(selectedChild?.id);

  if (loading || !selectedChild) return null;
  const openPlan = () => router.push('/plan');

  const latestPlan = plans[0];
  const activePlan = activePlanToday(plans);
  const newestReport = reports[0];

  if (activePlan) return <TodayCard plan={activePlan} nickname={selectedChild.nickname} compact />;

  if (isPlanRunning(latestPlan)) {
    return <ActivityCard compact title="Mochi is thinking…" subtitle="Your plan will appear here" icon={SPARKLES} onPress={openPlan} />;
  }

  if (latestPlan?.status === 'pending_review') {
    return (
      <ActivityCard
        compact
        title="Mochi's plan is ready"
        subtitle={`Review it for ${selectedChild.nickname}`}
        icon={{ ios: 'checklist', android: 'checklist' }}
        onPress={() => router.push({ pathname: '/plan-review/[weekId]', params: { weekId: latestPlan.id } })}
      />
    );
  }

  if (newestReport && newestReport.seenAt === null) {
    return (
      <ActivityCard
        compact
        title="New weekly report"
        subtitle={fillChildName(newestReport.headline, selectedChild.nickname)}
        icon={{ ios: 'doc.text.fill', android: 'description' }}
        onPress={() => router.push({ pathname: '/report/[weekId]', params: { weekId: newestReport.id } })}
      />
    );
  }

  // Switching off stops new plans. A plan already approved still runs its week.
  if (!agentEnabled) {
    return (
      <ActivityCard
        compact
        title="Let Mochi plan the week"
        subtitle="A weekly report made for your child"
        icon={SPARKLES}
        onPress={openPlan}
      />
    );
  }

  return null;
}
