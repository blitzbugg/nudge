/**
 * Nudge Habit Repository
 *
 * CRUD operations for habits. Persistence-specific logic lives here.
 */

import { getDatabase, generateId } from '../connection';
import type { Habit, HabitType, FrequencyType } from '@/types';
import { notifyDataChanged } from '@/services/dataEvents';
import { dateStr } from '@/utils/date';

// ─── Create ───────────────────────────────────────────────────────────────────

export interface CreateHabitInput {
  title: string;
  description?: string;
  type: HabitType;
  target_value?: number;
  unit?: string;
  frequency_type: FrequencyType;
  target_days_mask?: number;
  interval_days?: number;
  weekly_target?: number;
  color_hex?: string;
  icon_name?: string;
  checklist_items?: string[];
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const db = await getDatabase();
  const id = generateId();
  // Scheduling is local-date based. Store a local timestamp so a late-evening
  // creation never becomes tomorrow/yesterday after a UTC conversion.
  const created = new Date();
  const now = `${dateStr(created)}T${created.toTimeString().slice(0, 8)}`;

  const habit: Habit = {
    id,
    title: input.title,
    description: input.description || '',
    type: input.type,
    target_value: input.target_value ?? 1,
    unit: input.unit || '',
    frequency_type: input.frequency_type,
    target_days_mask: input.target_days_mask ?? 127,
    interval_days: input.interval_days ?? 1,
    weekly_target: input.weekly_target ?? 3,
    color_hex: input.color_hex ?? '#5B5CE2',
    icon_name: input.icon_name ?? 'check-circle',
    is_archived: false,
    checklist_items: JSON.stringify(input.checklist_items || []),
    created_at: now,
  };

  await db.runAsync(
    `INSERT INTO habits (id, title, description, type, target_value, unit, frequency_type, target_days_mask, interval_days, weekly_target, color_hex, icon_name, is_archived, checklist_items, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habit.id, habit.title, habit.description, habit.type,
      habit.target_value, habit.unit, habit.frequency_type,
      habit.target_days_mask, habit.interval_days, habit.weekly_target,
      habit.color_hex, habit.icon_name, habit.is_archived ? 1 : 0,
      habit.checklist_items, habit.created_at,
    ],
  );

  // Create streak cache
  await db.runAsync(
    `INSERT INTO streak_cache (id, habit_id, current_streak, longest_streak, total_completions, last_completed_date)
     VALUES (?, ?, 0, 0, 0, NULL)`,
    [generateId(), id],
  );

  notifyDataChanged();

  return habit;
}

/** Restore preserves exported IDs so logs and streak caches retain their relationships. */
export async function importHabits(habits: Habit[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const habit of habits) {
      await db.runAsync(
        `INSERT OR REPLACE INTO habits (id, title, description, type, target_value, unit, frequency_type, target_days_mask, interval_days, weekly_target, color_hex, icon_name, is_archived, checklist_items, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [habit.id, habit.title, habit.description, habit.type, habit.target_value, habit.unit,
          habit.frequency_type, habit.target_days_mask, habit.interval_days, habit.weekly_target,
          habit.color_hex, habit.icon_name, habit.is_archived ? 1 : 0, habit.checklist_items, habit.created_at],
      );
    }
  });
  notifyDataChanged();
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getHabit(id: string): Promise<Habit | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ [key: string]: unknown }>(
    'SELECT * FROM habits WHERE id = ?',
    [id],
  );
  return row ? rowToHabit(row) : null;
}

export async function getAllHabits(): Promise<Habit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ [key: string]: unknown }>(
    'SELECT * FROM habits WHERE is_archived = 0 ORDER BY created_at ASC',
  );
  return rows.map(rowToHabit);
}

export async function getArchivedHabits(): Promise<Habit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ [key: string]: unknown }>(
    'SELECT * FROM habits WHERE is_archived = 1 ORDER BY created_at ASC',
  );
  return rows.map(rowToHabit);
}

export async function observeHabits(
  callback: (habits: Habit[]) => void,
): Promise<() => void> {
  const db = await getDatabase();

  const query = async () => {
    const habits = await getAllHabits();
    callback(habits);
  };

  // Initial load
  await query();

  // Subscribe to changes via polling (expo-sqlite doesn't have native subscriptions)
  const interval = setInterval(query, 1000);

  return () => clearInterval(interval);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateHabitInput {
  title?: string;
  description?: string;
  type?: HabitType;
  target_value?: number;
  unit?: string;
  frequency_type?: FrequencyType;
  target_days_mask?: number;
  interval_days?: number;
  weekly_target?: number;
  color_hex?: string;
  icon_name?: string;
  checklist_items?: string[];
}

export async function updateHabit(id: string, input: UpdateHabitInput): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (input.title !== undefined) { fields.push('title = ?'); values.push(input.title); }
  if (input.description !== undefined) { fields.push('description = ?'); values.push(input.description); }
  if (input.type !== undefined) { fields.push('type = ?'); values.push(input.type); }
  if (input.target_value !== undefined) { fields.push('target_value = ?'); values.push(input.target_value); }
  if (input.unit !== undefined) { fields.push('unit = ?'); values.push(input.unit); }
  if (input.frequency_type !== undefined) { fields.push('frequency_type = ?'); values.push(input.frequency_type); }
  if (input.target_days_mask !== undefined) { fields.push('target_days_mask = ?'); values.push(input.target_days_mask); }
  if (input.interval_days !== undefined) { fields.push('interval_days = ?'); values.push(input.interval_days); }
  if (input.weekly_target !== undefined) { fields.push('weekly_target = ?'); values.push(input.weekly_target); }
  if (input.color_hex !== undefined) { fields.push('color_hex = ?'); values.push(input.color_hex); }
  if (input.icon_name !== undefined) { fields.push('icon_name = ?'); values.push(input.icon_name); }
  if (input.checklist_items !== undefined) {
    fields.push('checklist_items = ?');
    values.push(JSON.stringify(input.checklist_items));
  }

  if (fields.length === 0) return;
  values.push(id);

  await db.runAsync(
    `UPDATE habits SET ${fields.join(', ')} WHERE id = ?`,
    values,
  );
  notifyDataChanged();
}

// ─── Archive / Delete ─────────────────────────────────────────────────────────

export async function archiveHabit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE habits SET is_archived = 1 WHERE id = ?', [id]);
  notifyDataChanged();
}

export async function unarchiveHabit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE habits SET is_archived = 0 WHERE id = ?', [id]);
  notifyDataChanged();
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM habit_logs WHERE habit_id = ?', [id]);
  await db.runAsync('DELETE FROM streak_cache WHERE habit_id = ?', [id]);
  notifyDataChanged();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToHabit(row: { [key: string]: unknown }): Habit {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    type: row.type as HabitType,
    target_value: (row.target_value as number) || 1,
    unit: (row.unit as string) || '',
    frequency_type: row.frequency_type as FrequencyType,
    target_days_mask: (row.target_days_mask as number) || 127,
    interval_days: (row.interval_days as number) || 1,
    weekly_target: (row.weekly_target as number) || 3,
    color_hex: (row.color_hex as string) || '#5B5CE2',
    icon_name: (row.icon_name as string) || 'check-circle',
    is_archived: (row.is_archived as number) === 1,
    checklist_items: (row.checklist_items as string) || '[]',
    created_at: (row.created_at as string) || new Date().toISOString(),
  };
}
