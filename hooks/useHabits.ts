/**
 * Nudge Habits Hook
 *
 * Provides reactive habit data from the database.
 * Components should not directly access database internals.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Habit, HabitLog, StreakCache } from '@/types';
import * as HabitRepo from '@/database/repositories/habitRepository';
import * as LogRepo from '@/database/repositories/logRepository';
import * as StreakRepo from '@/database/repositories/streakRepository';
import { todayStr, addDays } from '@/utils/date';
import { isScheduledForDate } from '@/utils/scheduling';
import { subscribeToDataChanges } from '@/services/dataEvents';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await HabitRepo.getAllHabits();
      setHabits(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToDataChanges(refresh);
    const interval = setInterval(refresh, 2000);
    return () => { unsubscribe(); clearInterval(interval); };
  }, [refresh]);

  return { habits, loading, refresh };
}

export function useHabit(id: string | undefined) {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    HabitRepo.getHabit(id).then((h) => {
      setHabit(h);
      setLoading(false);
    });
  }, [id]);

  return { habit, loading };
}

export function useTodayHabits() {
  const [habitsWithStatus, setHabitsWithStatus] = useState<{
    habit: Habit;
    scheduled: boolean;
    log: HabitLog | null;
    streak: StreakCache | null;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });

  const refresh = useCallback(async () => {
    try {
      const allHabits = await HabitRepo.getAllHabits();
      const today = todayStr();
      const todayLogs = await LogRepo.getLogsForDate(today);
      const allStreaks = await StreakRepo.getAllStreaks();

      const logMap = new Map(todayLogs.map((l) => [l.habit_id, l]));
      const streakMap = new Map(allStreaks.map((s) => [s.habit_id, s]));

      const items = allHabits
        .filter((h) => !h.is_archived)
        .map((habit) => {
          const scheduled = isScheduledForDate(
            habit.frequency_type,
            today,
            habit.created_at,
            habit.target_days_mask,
            habit.interval_days,
            habit.weekly_target,
            [],
          );
          return {
            habit,
            scheduled,
            log: logMap.get(habit.id) || null,
            streak: streakMap.get(habit.id) || null,
          };
        });

      const scheduledItems = items.filter((i) => i.scheduled);
      const completed = scheduledItems.filter((i) => i.log?.is_completed).length;
      const total = scheduledItems.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      setHabitsWithStatus(items);
      setProgress({ completed, total, percentage });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToDataChanges(refresh);
    const interval = setInterval(refresh, 2000);
    return () => { unsubscribe(); clearInterval(interval); };
  }, [refresh]);

  return { habitsWithStatus, progress, loading, refresh };
}

export function useHabitLogs(habitId: string | undefined) {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!habitId) { setLoading(false); return; }
    try {
      const data = await LogRepo.getLogsForHabit(habitId);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToDataChanges(refresh);
    const interval = setInterval(refresh, 2000);
    return () => { unsubscribe(); clearInterval(interval); };
  }, [refresh]);

  return { logs, loading, refresh };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export function useHabitActions() {
  const completeHabit = useCallback(async (habitId: string, dateStr?: string) => {
    const date = dateStr || todayStr();
    const habit = await HabitRepo.getHabit(habitId);
    if (!habit) return;

    await LogRepo.completeLog(habitId, date, habit.target_value);
    const streak = await StreakRepo.recalculateStreak(habit);
    return streak;
  }, []);

  const uncompleteHabit = useCallback(async (habitId: string, dateStr?: string) => {
    const date = dateStr || todayStr();
    await LogRepo.uncompleteLog(habitId, date);
    const habit = await HabitRepo.getHabit(habitId);
    if (habit) await StreakRepo.recalculateStreak(habit);
  }, []);

  const incrementHabit = useCallback(async (habitId: string, amount: number, dateStr?: string) => {
    const date = dateStr || todayStr();
    const habit = await HabitRepo.getHabit(habitId);
    if (!habit) return;
    await LogRepo.incrementLog(habitId, date, amount, habit.target_value);
    const streak = await StreakRepo.recalculateStreak(habit);
    return streak;
  }, []);

  const setHabitProgress = useCallback(async (habitId: string, value: number, dateStr?: string) => {
    const date = dateStr || todayStr();
    const habit = await HabitRepo.getHabit(habitId);
    if (!habit) return;
    await LogRepo.upsertLog(habitId, date, Math.max(0, value), value >= habit.target_value);
    return StreakRepo.recalculateStreak(habit);
  }, []);

  const createHabit = useCallback(async (input: Parameters<typeof HabitRepo.createHabit>[0]) => {
    return HabitRepo.createHabit(input);
  }, []);

  const updateHabit = useCallback(async (id: string, input: Parameters<typeof HabitRepo.updateHabit>[1]) => {
    return HabitRepo.updateHabit(id, input);
  }, []);

  const archiveHabit = useCallback(async (id: string) => {
    return HabitRepo.archiveHabit(id);
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    return HabitRepo.deleteHabit(id);
  }, []);

  return {
    completeHabit,
    uncompleteHabit,
    incrementHabit,
    setHabitProgress,
    createHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
  };
}
