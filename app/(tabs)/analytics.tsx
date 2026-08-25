import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius, Layout, HEATMAP_LEVELS } from '@/constants/theme';
import { Stat } from '@/components/ui/Stat';
import { EmptyState } from '@/components/ui/EmptyState';
import { TinyOtter } from '@/components/mascot';
import * as HabitRepo from '@/database/repositories/habitRepository';
import * as LogRepo from '@/database/repositories/logRepository';
import * as StreakRepo from '@/database/repositories/streakRepository';
import type { Habit, StreakCache } from '@/types';
import { lastNDays } from '@/utils/date';
import { isScheduledForDate } from '@/utils/scheduling';
import { subscribeToDataChanges } from '@/services/dataEvents';

export default function AnalyticsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [streaks, setStreaks] = useState<StreakCache[]>([]);
  const [heatmapData, setHeatmapData] = useState<Map<string, number>>(new Map());
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, total: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ completed: 0, total: 0 });

  const refresh = useCallback(async () => {
    const allHabits = await HabitRepo.getAllHabits();
    const activeHabits = allHabits.filter((h) => !h.is_archived);
    setHabits(activeHabits);

    const allStreaks = await StreakRepo.getAllStreaks();
    setStreaks(allStreaks);

    // One query powers the heatmap and schedule-aware consistency calculations.
    const dates = lastNDays(365);
    const allLogs = await LogRepo.getLogsInRange(dates[0], dates[dates.length - 1]);
    const heatMap = new Map<string, number>();
    for (const date of dates) {
      const dayLogs = allLogs.filter((l) => l.date_str === date && l.is_completed && activeHabits.some((h) => h.id === l.habit_id));
      heatMap.set(date, dayLogs.length);
    }
    setHeatmapData(heatMap);

    // Weekly stats — daily completion rate
    const weekDates = lastNDays(7);
    const { completedDays: weekCompleted, totalDays: weekTotal } =
      computeDailyCompletionRate(activeHabits, weekDates, allLogs);
    setWeeklyStats({ completed: weekCompleted, total: weekTotal });

    // Monthly stats — daily completion rate
    const monthDates = lastNDays(30);
    const { completedDays: monthCompleted, totalDays: monthTotal } =
      computeDailyCompletionRate(activeHabits, monthDates, allLogs);
    setMonthlyStats({ completed: monthCompleted, total: monthTotal });
  }, []);

  useEffect(() => {
    refresh();
    return subscribeToDataChanges(refresh);
  }, [refresh]);

  const streakMap = new Map(streaks.map((s) => [s.habit_id, s]));
  const totalCompletions = streaks.reduce((sum, s) => sum + s.total_completions, 0);
  const bestStreak = streaks.reduce((max, s) => Math.max(max, s.longest_streak), 0);
  const currentBestStreak = streaks.reduce((max, s) => Math.max(max, s.current_streak), 0);

  // Heatmap
  const dates = lastNDays(365);
  const maxCount = Math.max(1, ...Array.from(heatmapData.values()));

  if (habits.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          otterState="curious"
          title="No data yet"
          message="Complete some habits to see your analytics."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.screenTitleRow}>
          <Text style={styles.screenTitle}>Analytics</Text>
          {/* Otter quietly observing analytics */}
          <TinyOtter
            state={totalCompletions > 0 ? 'proud' : 'neutral'}
            animate
            accessibilityLabel={null}
          />
        </View>

        {/* Overall Stats */}
        <Animated.View entering={FadeInDown.duration(260)} style={styles.statsRow}>
          <Stat label="Completions" value={totalCompletions} color={Colors.light.primary} />
          <Stat label="Best Streak" value={bestStreak} color={Colors.light.streak} />
          <Stat label="Current" value={currentBestStreak} color={Colors.light.success} />
        </Animated.View>

        {/* Consistency */}
        <Animated.View entering={FadeInDown.delay(80).duration(260)} style={styles.section}>
          <Text style={styles.sectionTitle}>Consistency</Text>
          <View style={styles.consistencyRow}>
            <View style={styles.consistencyItem}>
              <Text style={styles.consistencyLabel}>This week</Text>
              <Text style={styles.consistencyValue}>
                {weeklyStats.total > 0
                  ? `${Math.round((weeklyStats.completed / weeklyStats.total) * 100)}%`
                  : '\u2014'}
              </Text>
            </View>
            <View style={styles.consistencyItem}>
              <Text style={styles.consistencyLabel}>This month</Text>
              <Text style={styles.consistencyValue}>
                {monthlyStats.total > 0
                  ? `${Math.round((monthlyStats.completed / monthlyStats.total) * 100)}%`
                  : '\u2014'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Heatmap */}
        <Animated.View entering={FadeInDown.delay(160).duration(260)} style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Heatmap</Text>
          <Text style={styles.heatmapSubtitle}>Last 12 months</Text>
          <View style={styles.heatmap}>
            {dates.map((date) => {
              const count = heatmapData.get(date) || 0;
              const level = count === 0 ? 0
                : count <= maxCount * 0.2 ? 1
                : count <= maxCount * 0.4 ? 2
                : count <= maxCount * 0.6 ? 3
                : count <= maxCount * 0.8 ? 4
                : 5;
              return (
                <View
                  key={date}
                  style={[
                    styles.heatmapCell,
                    { backgroundColor: HEATMAP_LEVELS[level] },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendLabel}>Less</Text>
            {HEATMAP_LEVELS.map((color, i) => (
              <View key={i} style={[styles.legendCell, { backgroundColor: color }]} />
            ))}
            <Text style={styles.legendLabel}>More</Text>
          </View>
        </Animated.View>

        {/* Per-habit breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habits</Text>
          {habits.map((habit) => {
            const streak = streakMap.get(habit.id);
            return (
              <View key={habit.id} style={styles.habitRow}>
                <View style={[styles.habitDot, { backgroundColor: habit.color_hex }]} />
                <Text style={styles.habitName}>{habit.title}</Text>
                <Text style={styles.habitStat}>
                  {streak?.current_streak || 0} day streak
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Compute daily completion rate for a set of habits over a date range.
 *
 * Returns:
 *   totalDays     – number of days in the range that had ≥1 scheduled habit
 *   completedDays – number of those days where ALL scheduled habits were completed
 *
 * This gives a meaningful percentage: "what fraction of active days did you
 * fully complete?"  A day with 2/2 habits done counts as 1 completed day,
 * not 2.
 */
function computeDailyCompletionRate(
  habits: Habit[],
  dates: string[],
  allLogs: { habit_id: string; date_str: string; is_completed: boolean }[],
): { completedDays: number; totalDays: number } {
  let completedDays = 0;
  let totalDays = 0;

  for (const date of dates) {
    const scheduledHabits = habits.filter((h) =>
      isScheduledForDate(
        h.frequency_type, date, h.created_at, h.target_days_mask,
        h.interval_days, h.weekly_target,
        allLogs.filter((l) => l.habit_id === h.id),
      ),
    );
    if (scheduledHabits.length === 0) continue;

    totalDays++;

    const allDone = scheduledHabits.every((h) =>
      allLogs.some((l) => l.habit_id === h.id && l.date_str === date && l.is_completed),
    );
    if (allDone) completedDays++;
  }

  return { completedDays, totalDays };
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  screenTitle: {
    ...Typography.largeHeading,
    color: Colors.light.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.light.surface,
    marginHorizontal: Layout.screenPaddingHorizontal,
    borderRadius: Radius.medium,
  },
  section: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    marginTop: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.section,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  consistencyRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  consistencyItem: {
    gap: Spacing.xs,
  },
  consistencyLabel: {
    ...Typography.secondary,
    color: Colors.light.textSecondary,
  },
  consistencyValue: {
    ...Typography.largeHeading,
    color: Colors.light.primary,
  },
  heatmapSubtitle: {
    ...Typography.caption,
    color: Colors.light.textTertiary,
    marginBottom: Spacing.sm,
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  heatmapCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  legendLabel: {
    ...Typography.caption,
    color: Colors.light.textTertiary,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  habitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  habitName: {
    ...Typography.body,
    color: Colors.light.text,
    flex: 1,
  },
  habitStat: {
    ...Typography.secondary,
    color: Colors.light.textSecondary,
  },
});
