/**
 * Nudge Database Connection
 *
 * Uses expo-sqlite for local persistence.
 * Single source of truth for all persistent habit data.
 */

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('nudge.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'boolean',
      target_value REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT '',
      frequency_type TEXT NOT NULL DEFAULT 'daily',
      target_days_mask INTEGER NOT NULL DEFAULT 127,
      interval_days INTEGER NOT NULL DEFAULT 1,
      weekly_target INTEGER NOT NULL DEFAULT 3,
      color_hex TEXT NOT NULL DEFAULT '#5B5CE2',
      icon_name TEXT NOT NULL DEFAULT 'check-circle',
      is_archived INTEGER NOT NULL DEFAULT 0,
      checklist_items TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL,
      date_str TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0,
      is_completed INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habit_id, date_str)
    );

    CREATE TABLE IF NOT EXISTS streak_cache (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL UNIQUE,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      total_completions INTEGER NOT NULL DEFAULT 0,
      last_completed_date TEXT,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
    CREATE INDEX IF NOT EXISTS idx_habit_logs_date_str ON habit_logs(date_str);
    CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date_str);
    CREATE INDEX IF NOT EXISTS idx_streak_cache_habit_id ON streak_cache(habit_id);
  `);
}

/** Generate a unique ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
