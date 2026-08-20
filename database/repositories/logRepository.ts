/**
 * Nudge Log Repository
 *
 * CRUD operations for habit completion logs.
 */

import { getDatabase, generateId } from '../connection';
import type { HabitLog } from '@/types';
import { notifyDataChanged } from '@/services/dataEvents';

// ─── Create / Update ──────────────────────────────────────────────────────────

export async function upsertLog(
  habitId: string,
  dateStr: string,
  value: number,
  isCompleted: boolean,
  note: string = '',
): Promise<HabitLog> {
  const db = await getDatabase();
  const existing = await getLog(habitId, dateStr);

  if (existing) {
    await db.runAsync(
      `UPDATE habit_logs SET value = ?, is_completed = ?, note = ? WHERE id = ?`,
      [value, isCompleted ? 1 : 0, note, existing.id],
    );
    notifyDataChanged();
    return { ...existing, value, is_completed: isCompleted, note };
  }

  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO habit_logs (id, habit_id, date_str, value, is_completed, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, habitId, dateStr, value, isCompleted ? 1 : 0, note, now],
  );
  notifyDataChanged();

  return {
    id,
    habit_id: habitId,
    date_str: dateStr,
    value,
    is_completed: isCompleted,
    note,
    created_at: now,
  };
}

export async function completeLog(
  habitId: string,
  dateStr: string,
  targetValue: number = 1,
): Promise<HabitLog> {
  return upsertLog(habitId, dateStr, targetValue, true);
}

export async function uncompleteLog(
  habitId: string,
  dateStr: string,
): Promise<void> {
  const db = await getDatabase();
  const existing = await getLog(habitId, dateStr);
  if (existing) {
    await db.runAsync(
      'UPDATE habit_logs SET value = 0, is_completed = 0 WHERE id = ?',
      [existing.id],
    );
    notifyDataChanged();
  }
}

export async function incrementLog(
  habitId: string,
  dateStr: string,
  increment: number,
  targetValue: number,
): Promise<HabitLog> {
  const db = await getDatabase();
  const existing = await getLog(habitId, dateStr);
  const newValue = (existing?.value || 0) + increment;
  const isCompleted = newValue >= targetValue;

  return upsertLog(habitId, dateStr, newValue, isCompleted, existing?.note || '');
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getLog(habitId: string, dateStr: string): Promise<HabitLog | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ [key: string]: unknown }>(
    'SELECT * FROM habit_logs WHERE habit_id = ? AND date_str = ?',
    [habitId, dateStr],
  );
  return row ? rowToLog(row) : null;
}

export async function getLogsForDate(dateStr: string): Promise<HabitLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ [key: string]: unknown }>(
    'SELECT * FROM habit_logs WHERE date_str = ?',
    [dateStr],
  );
  return rows.map(rowToLog);
}

export async function getLogsForHabit(habitId: string): Promise<HabitLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ [key: string]: unknown }>(
    'SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY date_str DESC',
    [habitId],
  );
  return rows.map(rowToLog);
}

export async function getLogsInRange(
  startDate: string,
  endDate: string,
): Promise<HabitLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ [key: string]: unknown }>(
    'SELECT * FROM habit_logs WHERE date_str >= ? AND date_str <= ? ORDER BY date_str',
    [startDate, endDate],
  );
  return rows.map(rowToLog);
}

export async function getLogsForHabitInRange(
  habitId: string,
  startDate: string,
  endDate: string,
): Promise<HabitLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ [key: string]: unknown }>(
    'SELECT * FROM habit_logs WHERE habit_id = ? AND date_str >= ? AND date_str <= ? ORDER BY date_str',
    [habitId, startDate, endDate],
  );
  return rows.map(rowToLog);
}

export async function getCompletedLogsForHabit(habitId: string): Promise<HabitLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ [key: string]: unknown }>(
    'SELECT * FROM habit_logs WHERE habit_id = ? AND is_completed = 1 ORDER BY date_str',
    [habitId],
  );
  return rows.map(rowToLog);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteLog(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM habit_logs WHERE id = ?', [id]);
  notifyDataChanged();
}

// ─── Bulk Import ──────────────────────────────────────────────────────────────

export async function importLogs(logs: HabitLog[]): Promise<void> {
  const db = await getDatabase();
  for (const log of logs) {
    await db.runAsync(
      `INSERT OR REPLACE INTO habit_logs (id, habit_id, date_str, value, is_completed, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [log.id, log.habit_id, log.date_str, log.value, log.is_completed ? 1 : 0, log.note, log.created_at],
    );
  }
  notifyDataChanged();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToLog(row: { [key: string]: unknown }): HabitLog {
  return {
    id: row.id as string,
    habit_id: row.habit_id as string,
    date_str: row.date_str as string,
    value: (row.value as number) || 0,
    is_completed: (row.is_completed as number) === 1,
    note: (row.note as string) || '',
    created_at: (row.created_at as string) || new Date().toISOString(),
  };
}
