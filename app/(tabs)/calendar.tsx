import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Layout } from '@/constants/theme';
import { HabitIcon } from '@/components/ui/HabitIcon';
import { Divider } from '@/components/ui/Divider';
import { TinyOtter } from '@/components/mascot';
import {
  todayStr, monthYearDisplay, datesInMonth, parseDate,
  firstDayOfMonth, lastDayOfMonth, getDayOfWeek, dayShortName,
} from '@/utils/date';
import { isScheduledForDate } from '@/utils/scheduling';
import { subscribeToDataChanges } from '@/services/dataEvents';
import * as HabitRepo from '@/database/repositories/habitRepository';
import * as LogRepo from '@/database/repositories/logRepository';
import type { Habit, HabitLog } from '@/types';
import * as haptics from '@/services/haptics';

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(todayStr());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [dayLogs, setDayLogs] = useState<HabitLog[]>([]);

  const refresh = useCallback(async () => {
    const h = await HabitRepo.getAllHabits();
    setHabits(h.filter((hh) => !hh.is_archived));
    const allLogs = await LogRepo.getLogsInRange(
      firstDayOfMonth(currentMonth),
      lastDayOfMonth(currentMonth),
    );
    setLogs(allLogs);
  }, [currentMonth]);

  useEffect(() => {
    refresh();
    return subscribeToDataChanges(refresh);
  }, [refresh]);

  useEffect(() => {
    LogRepo.getLogsForDate(selectedDate).then(setDayLogs);
    return subscribeToDataChanges(() => { LogRepo.getLogsForDate(selectedDate).then(setDayLogs); });
  }, [selectedDate]);

  const dates = datesInMonth(currentMonth);
  const firstDow = getDayOfWeek(firstDayOfMonth(currentMonth));
  const logMap = new Map(logs.map((l) => [`${l.habit_id}_${l.date_str}`, l]));
  const activeHabits = habits.filter((h) => !h.is_archived);

  const prevMonth = () => {
    const d = parseDate(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
  };

  const nextMonth = () => {
    const d = parseDate(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
  };

  const getCompletionColor = (date: string) => {
    let completed = 0;
    let total = 0;
    for (const habit of activeHabits) {
      const habitLogs = logs.filter((entry) => entry.habit_id === habit.id);
      const scheduled = isScheduledForDate(
        habit.frequency_type, date, habit.created_at, habit.target_days_mask,
        habit.interval_days, habit.weekly_target, habitLogs,
      );
      if (!scheduled) continue;
      const log = logMap.get(`${habit.id}_${date}`);
      total++;
      if (log?.is_completed) completed++;
    }
    if (total === 0) return 'transparent';
    if (completed === total) return Colors.light.success;
    // Planned days are not misses. The error state is reserved for past dates.
    if (date >= todayStr()) return Colors.light.primarySoft;
    if (completed > 0) return Colors.light.warning;
    return Colors.light.error;
  };

  const selectedDayHabits = activeHabits.filter((habit) => isScheduledForDate(
    habit.frequency_type, selectedDate, habit.created_at, habit.target_days_mask,
    habit.interval_days, habit.weekly_target, logs.filter((entry) => entry.habit_id === habit.id),
  )).map((h) => ({
    habit: h,
    log: dayLogs.find((l) => l.habit_id === h.id && l.is_completed) || null,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <Pressable onPress={prevMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.monthTitle}>{monthYearDisplay(currentMonth)}</Text>
          <Pressable onPress={nextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={Colors.light.text} />
          </Pressable>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
            <Text key={dow} style={styles.dayHeader}>
              {dayShortName(dow).charAt(0)}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.grid}>
          {Array.from({ length: firstDow }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {dates.map((date) => {
            const isSelected = date === selectedDate;
            const isToday = date === todayStr();
            const dotColor = getCompletionColor(date);
            return (
              <Pressable
                key={date}
                style={[
                  styles.dayCell,
                  isSelected && styles.daySelected,
                  isToday && !isSelected && styles.dayToday,
                ]}
                onPress={() => { haptics.selection(); setSelectedDate(date); }}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                    isToday && !isSelected && styles.dayNumberToday,
                  ]}
                >
                  {parseDate(date).getDate()}
                </Text>
                {dotColor !== 'transparent' && (
                  <View style={[styles.dot, { backgroundColor: dotColor }]} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Selected Day Details */}
        <Animated.View key={selectedDate} entering={FadeInDown.duration(220)} style={styles.dayDetails}>
          <View style={styles.dayDetailsHeader}>
            <Text style={styles.dayDetailsTitle}>
              {selectedDayHabits.filter(({ log }) => log).length} of {selectedDayHabits.length} completed
            </Text>
            {/* Small otter observing the selected day */}
            {selectedDayHabits.length > 0 && (
              <TinyOtter state="curious" animate accessibilityLabel={null} />
            )}
          </View>
          <Divider />
          {selectedDayHabits.map(({ habit, log }) => (
            <View key={habit.id} style={styles.detailRow}>
              <HabitIcon name={habit.icon_name} color={habit.color_hex} size={18} />
              <Text style={[styles.detailText, log && styles.detailCompleted]}>
                {habit.title}
              </Text>
              {log && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.light.success} />
              )}
            </View>
          ))}
          {selectedDayHabits.length === 0 && (
            <View style={styles.emptyDay}>
              <TinyOtter state="sleepy" animate accessibilityLabel={null} />
              <Text style={styles.noHabits}>No habits scheduled for this day.</Text>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.lg,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    ...Typography.section,
    color: Colors.light.text,
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    ...Typography.captionMedium,
    color: Colors.light.textTertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  daySelected: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.extra,
  },
  dayToday: {
    backgroundColor: Colors.light.primarySoft,
    borderRadius: Radius.extra,
  },
  dayNumber: {
    ...Typography.body,
    color: Colors.light.text,
  },
  dayNumberSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dayNumberToday: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dayDetails: {
    marginTop: Spacing.xl,
    paddingHorizontal: Layout.screenPaddingHorizontal,
  },
  dayDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dayDetailsTitle: {
    ...Typography.secondaryMedium,
    color: Colors.light.textSecondary,
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  detailText: {
    ...Typography.body,
    color: Colors.light.text,
    flex: 1,
  },
  detailCompleted: {
    color: Colors.light.textSecondary,
    textDecorationLine: 'line-through',
  },
  noHabits: {
    ...Typography.body,
    color: Colors.light.textTertiary,
    paddingVertical: Spacing.xl,
  },
});
