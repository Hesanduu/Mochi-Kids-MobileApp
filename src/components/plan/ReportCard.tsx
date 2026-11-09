import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { colors, fonts, radius } from '@/constants/theme';
import { fillChildName, formatPeriod, type WeeklyReport } from '@/lib/agent';

type ReportCardProps = {
  report: WeeklyReport;
  nickname: string;
};

// The newest weekly report, with a badge until the parent has opened it.
export function ReportCard({ report, nickname }: ReportCardProps) {
  const isNew = report.seenAt === null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/report/[weekId]', params: { weekId: report.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${isNew ? 'New weekly report' : 'Weekly report'}. ${fillChildName(report.headline, nickname)}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <View style={styles.titleRow}>
          {isNew ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          ) : null}
          <Text style={styles.label}>Weekly report</Text>
        </View>
        <Text style={styles.headline}>{fillChildName(report.headline, nickname)}</Text>
        <Text style={styles.period}>{formatPeriod(report.periodStart, report.periodEnd)}</Text>
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={18}
        tintColor={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.xxl,
    backgroundColor: colors.yellowSoft,
    borderWidth: 1.5,
    borderColor: colors.yellow,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textMuted,
  },
  headline: {
    fontFamily: fonts.heading,
    fontSize: 21,
    lineHeight: 27,
    color: colors.text,
  },
  period: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
  },
});
