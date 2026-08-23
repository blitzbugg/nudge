/**
 * Nudge Backup & Restore Service
 *
 * Full local JSON export with versioned format.
 * Import with validation - never blindly write unvalidated data.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import type { BackupData, Habit, HabitLog, StreakCache, UserSettings } from '@/types';
import { todayStr } from '@/utils/date';

const CURRENT_VERSION = 1;
const APP_VERSION = '1.0.0';

// ─── Export ───────────────────────────────────────────────────────────────────

export function createBackupPayload(
  habits: Habit[],
  habitLogs: HabitLog[],
  streakCaches: StreakCache[],
  settings: UserSettings,
): BackupData {
  return {
    version: CURRENT_VERSION,
    exported_at: new Date().toISOString(),
    app_version: APP_VERSION,
    habits,
    habit_logs: habitLogs,
    streak_caches: streakCaches,
    settings,
  };
}

export function backupToJson(payload: BackupData): string {
  return JSON.stringify(payload, null, 2);
}

/**
 * Export backup and save to a file the user can share/save.
 */
export async function exportBackup(
  habits: Habit[],
  habitLogs: HabitLog[],
  streakCaches: StreakCache[],
  settings: UserSettings,
): Promise<boolean> {
  try {
    const payload = createBackupPayload(habits, habitLogs, streakCaches, settings);
    const json = backupToJson(payload);
    const fileName = `nudge-backup-${todayStr()}.json`;
    const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
    const filePath = `${cacheDir}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, json);

    return true;
  } catch {
    return false;
  }
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportResult {
  success: boolean;
  data?: BackupData;
  error?: string;
}

/** Pick a backup file */
export async function pickBackupFile(): Promise<string | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return null;
    return result.assets[0].uri;
  } catch {
    return null;
  }
}

/** Read and validate a backup file */
export async function readBackupFile(uri: string): Promise<ImportResult> {
  try {
    const content = await FileSystem.readAsStringAsync(uri);
    return validateBackup(content);
  } catch {
    return { success: false, error: 'Could not read the file.' };
  }
}

/** Validate backup JSON string */
export function validateBackup(json: string): ImportResult {
  try {
    const parsed = JSON.parse(json);

    // Version check
    if (!parsed.version || typeof parsed.version !== 'number') {
      return { success: false, error: 'Invalid backup format.' };
    }
    if (parsed.version > CURRENT_VERSION) {
      return {
        success: false,
        error: `This backup was created with a newer version (v${parsed.version}). Please update Nudge to import it.`,
      };
    }

    // Required fields
    if (!Array.isArray(parsed.habits)) {
      return { success: false, error: 'Backup is missing habit data.' };
    }
    if (!Array.isArray(parsed.habit_logs)) {
      return { success: false, error: 'Backup is missing habit log data.' };
    }
    if (!Array.isArray(parsed.streak_caches)) {
      return { success: false, error: 'Backup is missing streak cache data.' };
    }

    // Validate individual records
    for (const habit of parsed.habits) {
      if (!habit.id || !habit.title || !habit.type) {
        return { success: false, error: 'Found an invalid habit record in the backup.' };
      }
    }

    for (const log of parsed.habit_logs) {
      if (!log.id || !log.habit_id || !log.date_str) {
        return { success: false, error: 'Found an invalid log record in the backup.' };
      }
    }

    const data: BackupData = {
      version: parsed.version,
      exported_at: parsed.exported_at || new Date().toISOString(),
      app_version: parsed.app_version || 'unknown',
      habits: parsed.habits,
      habit_logs: parsed.habit_logs,
      streak_caches: parsed.streak_caches,
      settings: parsed.settings || getDefaultSettings(),
    };

    return { success: true, data };
  } catch {
    return { success: false, error: 'The file is not valid JSON.' };
  }
}

function getDefaultSettings(): UserSettings {
  return {
    theme: 'light',
    haptics_enabled: true,
    biometric_enabled: false,
    default_reminder_time: '09:00',
    notifications_enabled: true,
    streak_freezes_enabled: true,
    weekly_freezes_count: 1,
  };
}

// ─── Show export share sheet (simplified for Expo Go) ────────────────────────

export async function showExportOptions(
  habits: Habit[],
  habitLogs: HabitLog[],
  streakCaches: StreakCache[],
  settings: UserSettings,
): Promise<boolean> {
  const success = await exportBackup(habits, habitLogs, streakCaches, settings);
  if (success) {
    Alert.alert('Backup Created', 'Your backup has been saved.');
  } else {
    Alert.alert('Export Failed', 'Could not create backup. Please try again.');
  }
  return success;
}
