/**
 * Nudge Streak Repository
 *
 * Manages the streak_cache table. Provides read, update, and recalculate operations.
 */

import { getDatabase, generateId } from '../connection';
import type { StreakCache } from '@/types';
import { calculateStreaks, type StreakResult } from '@/utils/streak';
import type { Habit } from '@/types';
import { getCompletedLogsForHabit } from './logRepository';
import { notifyDataChanged } from '@/services/dataEvents';

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getStreak(habitId: string): Promise<StreakCache | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ [key: string]: unknown }>(
    'SELECT * FROM streak_cache WHERE habit_id = ?',
    [habitId],
  );
  return row ? rowToStreak(row) : null;
}

export async function getAllStreaks(): Promise<StreakCache[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ [key: string]: unknown }>(
    'SELECT * FROM streak_cache',
  );
  return rows.map(rowToStreak);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateStreak(
  habitId: string,
  result: StreakResult,
): Promise<void> {
  const db = await getDatabase();
  const existing = await getStreak(habitId);

  if (existing) {
    await db.runAsync(
      `UPDATE streak_cache SET current_streak = ?, longest_streak = ?, total_completions = ?, last_completed_date = ?
       WHERE habit_id = ?`,
      [
        result.current_streak,
        Math.max(result.longest_streak, existing.longest_streak),
        result.total_completions,
        result.last_completed_date,
        habitId,
      ],
    );
  } else {
    await db.runAsync(
      `INSERT INTO streak_cache (id, habit_id, current_streak, longest_streak, total_completions, last_completed_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        habitId,
        result.current_streak,
        result.longest_streak,
        result.total_completions,
        result.last_completed_date,
      ],
    );
  }
  notifyDataChanged();
}

// ─── Recalculate ──────────────────────────────────────────────────────────────

export async function recalculateStreak(habit: Habit): Promise<StreakResult> {
  const completedLogs = await getCompletedLogsForHabit(habit.id);
  const completedDates = completedLogs.map((l) => l.date_str);

  // Get all logs for schedule awareness
  const db = await getDatabase();
  const allLogs = await db.getAllAsync<{ date_str: string; is_completed: number }>(
    'SELECT date_str, is_completed FROM habit_logs WHERE habit_id = ?',
    [habit.id],
  );

  const result = calculateStreaks(
    completedDates,
    habit.frequency_type,
    habit.created_at,
    habit.target_days_mask,
    habit.interval_days,
    habit.weekly_target,
    allLogs.map((l) => ({ date_str: l.date_str, is_completed: l.is_completed === 1 })),
  );

  await updateStreak(habit.id, result);
  return result;
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export async function importStreakCaches(caches: StreakCache[]): Promise<void> {
  const db = await getDatabase();
  for (const cache of caches) {
    await db.runAsync(
      `INSERT OR REPLACE INTO streak_cache (id, habit_id, current_streak, longest_streak, total_completions, last_completed_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cache.id, cache.habit_id, cache.current_streak,
        cache.longest_streak, cache.total_completions, cache.last_completed_date,
      ],
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToStreak(row: { [key: string]: unknown }): StreakCache {
  return {
    id: row.id as string,
    habit_id: row.habit_id as string,
    current_streak: (row.current_streak as number) || 0,
    longest_streak: (row.longest_streak as number) || 0,
    total_completions: (row.total_completions as number) || 0,
    last_completed_date: (row.last_completed_date as string) || null,
  };
}
