import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { formatShortDay, type WeekBar } from '@/lib/agent';

const BAR_AREA_HEIGHT = 80;
const VALUE_LABEL_HEIGHT = 22;

// Average score for each of the last 6 weeks, always on a 0–100 scale, so the
// height of a bar means the same thing on every report. Only the newest bar
// carries a number. The rest stay quiet, and a screen reader hears every value.
export function WeeklyBars({ weeks }: { weeks: WeekBar[] }) {
  const newestIndex = weeks.length - 1;
  const spokenSummary = weeks
    .map((week) => `${formatShortDay(week.weekEnd)}: ${week.averageScore === null ? 'no play' : `${week.averageScore} percent`}`)
    .join(', ');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Average score by week. ${spokenSummary}`}>
      <View style={styles.plot}>
        {weeks.map((week, index) => {
          const isNewest = index === newestIndex;
          return (
            <View key={week.weekEnd} style={styles.column}>
              {isNewest && week.averageScore !== null ? <Text style={styles.value}>{week.averageScore}%</Text> : null}
              {week.averageScore !== null ? (
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(Math.round((week.averageScore / 100) * BAR_AREA_HEIGHT), 4),
                      backgroundColor: isNewest ? colors.primary : colors.sky,
                    },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={styles.baseline} />
      <View style={styles.dates}>
        <Text style={styles.date}>{formatShortDay(weeks[0].weekEnd)}</Text>
        <Text style={styles.date}>{formatShortDay(weeks[newestIndex].weekEnd)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    height: BAR_AREA_HEIGHT + VALUE_LABEL_HEIGHT,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 22,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  value: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  baseline: {
    height: 1,
    backgroundColor: colors.divider,
  },
  dates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  date: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
});
