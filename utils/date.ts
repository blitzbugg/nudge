/**
 * Nudge Date Utilities
 *
 * Centralized date handling using local (not UTC) dates.
 * All dates in the app use YYYY-MM-DD string format for daily tracking.
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Core Date Functions ──────────────────────────────────────────────────────

/** Get today's local date as YYYY-MM-DD string */
export function todayStr(): string {
  return dateStr(new Date());
}

/** Convert a Date to local YYYY-MM-DD string */
export function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD string to local Date (noon to avoid DST issues) */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Add days to a date string */
export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

/** Get day of week for date string (0=Sunday, 6=Saturday) */
export function getDayOfWeek(s: string): number {
  return parseDate(s).getDay();
}

/** Compare two date strings: returns -1, 0, or 1 */
export function compareDates(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Calculate difference in days between two date strings */
export function diffDays(a: string, b: string): number {
  const da = parseDate(a);
  const db = parseDate(b);
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

/** Is date A before or on date B? */
export function isBeforeOrEqual(a: string, b: string): boolean {
  return a <= b;
}

/** Is date A today or in the past? */
export function isTodayOrBefore(s: string): boolean {
  return s <= todayStr();
}

/** Is date A today? */
export function isToday(s: string): boolean {
  return s === todayStr();
}

// ─── Month Utilities ──────────────────────────────────────────────────────────

/** Get the first day of the month for a date string */
export function firstDayOfMonth(s: string): string {
  const d = parseDate(s);
  return dateStr(new Date(d.getFullYear(), d.getMonth(), 1, 12));
}

/** Get the last day of the month for a date string */
export function lastDayOfMonth(s: string): string {
  const d = parseDate(s);
  return dateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12));
}

/** Get number of days in a month */
export function daysInMonth(s: string): number {
  const d = parseDate(s);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Get array of all dates in a month */
export function datesInMonth(s: string): string[] {
  const first = firstDayOfMonth(s);
  const count = daysInMonth(s);
  return Array.from({ length: count }, (_, i) => addDays(first, i));
}

/** Get month display name */
export function monthName(s: string): string {
  return MONTH_NAMES[parseDate(s).getMonth()];
}

/** Get month+year display */
export function monthYearDisplay(s: string): string {
  const d = parseDate(s);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Get array of month strings in a year range */
export function monthsInRange(start: string, end: string): string[] {
  const months: string[] = [];
  let current = firstDayOfMonth(start);
  const endDate = lastDayOfMonth(end);
  while (current <= endDate) {
    months.push(current);
    current = addDays(lastDayOfMonth(current), 1);
  }
  return months;
}

// ─── Week Utilities ───────────────────────────────────────────────────────────

/** Get the start of the week (Sunday) for a given date */
export function weekStart(s: string): string {
  const d = getDayOfWeek(s);
  return addDays(s, -d);
}

/** Get array of 7 dates starting from week's Sunday */
export function weekDates(s: string): string[] {
  const start = weekStart(s);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Format day for display (e.g., "Thu, Aug 20") */
export function formatDayShort(s: string): string {
  const d = parseDate(s);
  return `${DAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** Format full day (e.g., "Thursday, August 20") */
export function formatDayFull(s: string): string {
  const d = parseDate(s);
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

/** Day short name from day-of-week index */
export function dayShortName(dow: number): string {
  return DAY_SHORT[dow];
}

/** Day index bitmask from date string */
export function dayMaskForDate(s: string): number {
  return 1 << getDayOfWeek(s);
}

// ─── Greeting ────────────────────────────────────────────────────────────────

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Streak Date Calculations ────────────────────────────────────────────────

/** Get an array of N consecutive date strings ending at 'end' */
export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = start;
  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/** Get last N days including today */
export function lastNDays(n: number): string[] {
  const end = todayStr();
  const start = addDays(end, -(n - 1));
  return dateRange(start, end);
}

/** Get dates in last 365 days for heatmap */
export function heatmapDates(): string[] {
  return lastNDays(365);
}

/** Get date N weeks ago */
export function weeksAgo(n: number): string {
  return addDays(todayStr(), -n * 7);
}

/** Get date N months ago (approximate) */
export function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setHours(12);
  return dateStr(d);
}

// ─── Date string to readable format ───────────────────────────────────────────

/** Format YYYY-MM-DD to "Aug 20" */
export function formatMonthDay(s: string): string {
  const d = parseDate(s);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** Format for time display */
export function formatTime(d: Date): string {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

// ─── ISO Week ────────────────────────────────────────────────────────────────

/** Get ISO week number */
export function weekNumber(s: string): number {
  const d = parseDate(s);
  const jan1 = new Date(d.getFullYear(), 0, 1, 12);
  const days = Math.floor((d.getTime() - jan1.getTime()) / (86400000));
  return Math.ceil((days + jan1.getDay() + 1) / 7);
}
