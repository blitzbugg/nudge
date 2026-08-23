/**
 * Nudge Scheduling Engine
 *
 * Determines whether a habit is scheduled for a given date based on
 * its frequency_type and related fields. Independent from UI.
 *
 * Day bitmask mapping (standard JS Date.getDay()):
 *   0 = Sunday, 1 = Monday, ..., 6 = Saturday
 *   Bit position: 1 << dayOfWeek
 */

import { type FrequencyType } from '@/types';
import { getDayOfWeek, diffDays, firstDayOfMonth, parseDate } from './date';

/** Database timestamps may include a time portion; schedules always operate on local dates. */
function creationDate(createdAt: string): string {
  return createdAt.slice(0, 10);
}

/**
 * Is a habit scheduled for a specific date?
 */
export function isScheduledForDate(
  frequencyType: FrequencyType,
  dateStr: string,
  createdAt: string,
  targetDaysMask: number,
  intervalDays: number,
  weeklyTarget: number,
  allLogs: { date_str: string; is_completed: boolean }[] = [],
): boolean {
  const createdDate = creationDate(createdAt);
  // Never scheduled before creation
  if (dateStr < createdDate) return false;

  switch (frequencyType) {
    case 'daily':
      return true;

    case 'specific_days': {
      const dow = getDayOfWeek(dateStr);
      return (targetDaysMask & (1 << dow)) !== 0;
    }

    case 'interval': {
      const diff = diffDays(createdDate, dateStr);
      return diff >= 0 && diff % intervalDays === 0;
    }

    case 'weekly_target': {
      // Check if there's room for more completions this week
      const weekStart = getWeekStart(dateStr);
      const weekEnd = getWeekEnd(dateStr);
      const completedThisWeek = allLogs.filter(
        (l) =>
          l.date_str >= weekStart &&
          l.date_str <= weekEnd &&
          l.is_completed &&
          l.date_str !== dateStr,
      ).length;
      // Scheduled if we haven't hit target yet, or if this date is already logged
      return completedThisWeek < weeklyTarget || allLogs.some((l) => l.date_str === dateStr);
    }

    default:
      return true;
  }
}

/**
 * Get number of days a habit is scheduled per week.
 */
export function scheduledDaysPerWeek(
  frequencyType: FrequencyType,
  targetDaysMask: number,
  intervalDays: number,
  weeklyTarget: number,
): number {
  switch (frequencyType) {
    case 'daily':
      return 7;
    case 'specific_days': {
      let count = 0;
      for (let i = 0; i < 7; i++) {
        if (targetDaysMask & (1 << i)) count++;
      }
      return count;
    }
    case 'interval':
      return Math.round(7 / Math.max(1, intervalDays));
    case 'weekly_target':
      return weeklyTarget;
    default:
      return 7;
  }
}

/**
 * Get scheduled days in a month for a habit.
 */
export function scheduledDaysInMonth(
  frequencyType: FrequencyType,
  monthDateStr: string,
  createdAt: string,
  targetDaysMask: number,
  intervalDays: number,
  weeklyTarget: number,
  allLogs: { date_str: string; is_completed: boolean }[] = [],
): string[] {
  const year = parseDate(monthDateStr).getFullYear();
  const month = parseDate(monthDateStr).getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: string[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (isScheduledForDate(frequencyType, date, createdAt, targetDaysMask, intervalDays, weeklyTarget, allLogs)) {
      result.push(date);
    }
  }
  return result;
}

/**
 * Count scheduled days in a date range.
 */
export function countScheduledDays(
  frequencyType: FrequencyType,
  startDate: string,
  endDate: string,
  createdAt: string,
  targetDaysMask: number,
  intervalDays: number,
  weeklyTarget: number,
  allLogs: { date_str: string; is_completed: boolean }[] = [],
): number {
  let count = 0;
  let current = startDate;
  while (current <= endDate) {
    if (isScheduledForDate(frequencyType, current, createdAt, targetDaysMask, intervalDays, weeklyTarget, allLogs)) {
      count++;
    }
    const d = parseDate(current);
    d.setDate(d.getDate() + 1);
    current = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return count;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStart(dateStr: string): string {
  const d = parseDate(dateStr);
  const dow = d.getDay();
  d.setDate(d.getDate() - dow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekEnd(dateStr: string): string {
  const d = parseDate(dateStr);
  const dow = d.getDay();
  d.setDate(d.getDate() + (6 - dow));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Generate display label for a frequency type.
 */
export function frequencyLabel(
  frequencyType: FrequencyType,
  targetDaysMask: number,
  intervalDays: number,
  weeklyTarget: number,
): string {
  switch (frequencyType) {
    case 'daily':
      return 'Every day';
    case 'specific_days': {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days: string[] = [];
      for (let i = 0; i < 7; i++) {
        if (targetDaysMask & (1 << i)) days.push(dayNames[i]);
      }
      return days.join(', ');
    }
    case 'interval':
      return `Every ${intervalDays} day${intervalDays > 1 ? 's' : ''}`;
    case 'weekly_target':
      return `${weeklyTarget} time${weeklyTarget > 1 ? 's' : ''}/week`;
    default:
      return 'Daily';
  }
}
