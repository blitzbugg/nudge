/**
 * Nudge Streak Engine
 *
 * Calculates streaks respecting habit schedules.
 * A habit scheduled Mon/Wed/Fri must not treat Tue as a missed scheduled day.
 */

import { type FrequencyType } from '@/types';
import { isScheduledForDate, countScheduledDays } from './scheduling';
import { todayStr, addDays, diffDays, parseDate } from './date';

export interface StreakResult {
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  last_completed_date: string | null;
}

/**
 * Calculate all streak metrics from completion logs.
 */
export function calculateStreaks(
  completedDates: string[],
  frequencyType: FrequencyType,
  createdAt: string,
  targetDaysMask: number,
  intervalDays: number,
  weeklyTarget: number,
  allLogs: { date_str: string; is_completed: boolean }[] = [],
): StreakResult {
  if (completedDates.length === 0) {
    return {
      current_streak: 0,
      longest_streak: 0,
      total_completions: 0,
      last_completed_date: null,
    };
  }

  const sorted = [...new Set(completedDates)].sort();
  const total_completions = sorted.length;
  const last_completed_date = sorted[sorted.length - 1];

  // Calculate streaks
  const { current, longest } = computeStreaks(
    sorted,
    frequencyType,
    createdAt,
    targetDaysMask,
    intervalDays,
    weeklyTarget,
    allLogs,
  );

  return {
    current_streak: current,
    longest_streak: longest,
    total_completions,
    last_completed_date,
  };
}

/**
 * Core streak computation: walks backwards from today (or last completion)
 * to find current streak, and scans all time for longest.
 */
function computeStreaks(
  sortedDates: string[],
  frequencyType: FrequencyType,
  createdAt: string,
  targetDaysMask: number,
  intervalDays: number,
  weeklyTarget: number,
  allLogs: { date_str: string; is_completed: boolean }[],
): { current: number; longest: number } {
  const dateSet = new Set(sortedDates);
  const today = todayStr();
  const created = createdAt <= today ? createdAt : today;

  // Find the streak anchor (start walking from)
  const lastCompletion = sortedDates[sortedDates.length - 1];

  // Current streak: walk backwards from today
  let current = 0;
  if (lastCompletion) {
    // If last completion is today or yesterday, calculate current streak
    const gapFromToday = diffDays(lastCompletion, today);

    if (gapFromToday <= 1) {
      // Check today if it's scheduled
      let checkDate = today;
      // If last completion is yesterday and today isn't completed yet,
      // we might still have a streak if today isn't scheduled
      if (gapFromToday === 1) {
        // Today not completed - check if today is scheduled
        const todayScheduled = isScheduledForDate(
          frequencyType, today, created, targetDaysMask, intervalDays, weeklyTarget, allLogs,
        );
        if (todayScheduled) {
          // Missed today - streak broken unless it's still today
          current = 0;
          // But check if we have consecutive completions up to yesterday
          current = countBackwardStreak(
            dateSet, addDays(today, -1), frequencyType, created,
            targetDaysMask, intervalDays, weeklyTarget, allLogs,
          );
        } else {
          // Today isn't scheduled, streak continues through yesterday
          current = countBackwardStreak(
            dateSet, addDays(today, -1), frequencyType, created,
            targetDaysMask, intervalDays, weeklyTarget, allLogs,
          );
        }
      } else {
        // Completed today
        current = countBackwardStreak(
          dateSet, today, frequencyType, created,
          targetDaysMask, intervalDays, weeklyTarget, allLogs,
        );
      }
    } else {
      // Last completion was 2+ days ago - check if there's a valid gap
      let gapValid = true;
      for (let i = 1; i < gapFromToday; i++) {
        const gapDate = addDays(lastCompletion, i);
        const scheduled = isScheduledForDate(
          frequencyType, gapDate, created, targetDaysMask, intervalDays, weeklyTarget, allLogs,
        );
        if (scheduled) {
          gapValid = false;
          break;
        }
      }
      if (gapValid) {
        current = countBackwardStreak(
          dateSet, lastCompletion, frequencyType, created,
          targetDaysMask, intervalDays, weeklyTarget, allLogs,
        );
      }
    }
  }

  // Longest streak: scan all completed dates
  let longest = 0;
  let streak = 0;
  let prevDate: string | null = null;

  for (const date of sortedDates) {
    if (prevDate === null) {
      streak = 1;
    } else {
      const gap = diffDays(prevDate, date);
      if (gap === 1) {
        streak++;
      } else if (gap > 1) {
        // Check if all days in between are non-scheduled
        let allUnscheduled = true;
        for (let i = 1; i < gap; i++) {
          const between = addDays(prevDate, i);
          if (isScheduledForDate(frequencyType, between, created, targetDaysMask, intervalDays, weeklyTarget, allLogs)) {
            allUnscheduled = false;
            break;
          }
        }
        if (allUnscheduled) {
          streak++;
        } else {
          streak = 1;
        }
      }
      // gap === 0 means same day (duplicate), don't reset
    }
    longest = Math.max(longest, streak);
    prevDate = date;
  }

  return { current, longest };
}

function countBackwardStreak(
  dateSet: Set<string>,
  startDate: string,
  frequencyType: FrequencyType,
  created: string,
  targetDaysMask: number,
  intervalDays: number,
  weeklyTarget: number,
  allLogs: { date_str: string; is_completed: boolean }[],
): number {
  let streak = 0;
  let checkDate = startDate;

  while (checkDate >= created) {
    if (dateSet.has(checkDate)) {
      streak++;
    } else {
      // If this date is scheduled but not completed, streak breaks
      const scheduled = isScheduledForDate(
        frequencyType, checkDate, created, targetDaysMask, intervalDays, weeklyTarget, allLogs,
      );
      if (scheduled) break;
      // If not scheduled, just skip this day (streak continues)
    }
    checkDate = addDays(checkDate, -1);
  }

  return streak;
}

/**
 * Check if streak freeze should be consumed.
 * Returns true if there's a gap day that would break the streak.
 */
export function shouldConsumeFreeze(
  lastCompletedDate: string,
  today: string,
  frequencyType: FrequencyType,
  createdAt: string,
  targetDaysMask: number,
  intervalDays: number,
  weeklyTarget: number,
  allLogs: { date_str: string; is_completed: boolean }[],
): boolean {
  if (!lastCompletedDate) return false;
  const gap = diffDays(lastCompletedDate, today);
  if (gap <= 1) return false;

  for (let i = 1; i < gap; i++) {
    const between = addDays(lastCompletedDate, i);
    if (isScheduledForDate(frequencyType, between, createdAt, targetDaysMask, intervalDays, weeklyTarget, allLogs)) {
      return true;
    }
  }
  return false;
}
