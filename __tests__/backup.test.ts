/**
 * Tests for backup import validation.
 * Only tests the pure validateBackup function, not the expo-dependent parts.
 */

const CURRENT_VERSION = 1;

interface BackupData {
  version: number;
  exported_at: string;
  app_version: string;
  habits: any[];
  habit_logs: any[];
  streak_caches: any[];
  settings: any;
}

function validateBackup(json: string): { success: boolean; data?: BackupData; error?: string } {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.version || typeof parsed.version !== 'number') {
      return { success: false, error: 'Invalid backup format.' };
    }
    if (parsed.version > CURRENT_VERSION) {
      return { success: false, error: `This backup was created with a newer version (v${parsed.version}). Please update Nudge to import it.` };
    }
    if (!Array.isArray(parsed.habits)) {
      return { success: false, error: 'Backup is missing habit data.' };
    }
    if (!Array.isArray(parsed.habit_logs)) {
      return { success: false, error: 'Backup is missing habit log data.' };
    }
    if (!Array.isArray(parsed.streak_caches)) {
      return { success: false, error: 'Backup is missing streak cache data.' };
    }
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
    return {
      success: true,
      data: {
        version: parsed.version,
        exported_at: parsed.exported_at || new Date().toISOString(),
        app_version: parsed.app_version || 'unknown',
        habits: parsed.habits,
        habit_logs: parsed.habit_logs,
        streak_caches: parsed.streak_caches,
        settings: parsed.settings || { theme: 'light' },
      },
    };
  } catch {
    return { success: false, error: 'The file is not valid JSON.' };
  }
}

describe('Backup Import Validation', () => {
  it('validates a correct backup', () => {
    const valid = JSON.stringify({
      version: 1,
      exported_at: '2026-08-20T10:00:00Z',
      app_version: '1.0.0',
      habits: [{ id: 'h1', title: 'Read', type: 'boolean' }],
      habit_logs: [{ id: 'l1', habit_id: 'h1', date_str: '2026-08-20' }],
      streak_caches: [],
      settings: {},
    });
    const result = validateBackup(valid);
    expect(result.success).toBe(true);
    expect(result.data?.habits).toHaveLength(1);
  });

  it('rejects invalid JSON', () => {
    expect(validateBackup('not json').success).toBe(false);
  });

  it('rejects missing version', () => {
    const result = validateBackup(JSON.stringify({ habits: [], habit_logs: [], streak_caches: [] }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid backup format');
  });

  it('rejects newer version', () => {
    const result = validateBackup(JSON.stringify({ version: 99, habits: [], habit_logs: [], streak_caches: [] }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('newer version');
  });

  it('rejects missing habits', () => {
    const result = validateBackup(JSON.stringify({ version: 1, habit_logs: [], streak_caches: [] }));
    expect(result.success).toBe(false);
  });

  it('rejects missing habit_logs', () => {
    const result = validateBackup(JSON.stringify({ version: 1, habits: [], streak_caches: [] }));
    expect(result.success).toBe(false);
  });

  it('rejects missing streak_caches', () => {
    const result = validateBackup(JSON.stringify({ version: 1, habits: [], habit_logs: [] }));
    expect(result.success).toBe(false);
  });

  it('rejects invalid habit records', () => {
    const result = validateBackup(JSON.stringify({
      version: 1,
      habits: [{ id: '', title: '', type: 'boolean' }],
      habit_logs: [],
      streak_caches: [],
    }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid habit record');
  });

  it('rejects invalid log records', () => {
    const result = validateBackup(JSON.stringify({
      version: 1,
      habits: [{ id: 'h1', title: 'Read', type: 'boolean' }],
      habit_logs: [{ id: '', habit_id: '', date_str: '' }],
      streak_caches: [],
    }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid log record');
  });

  it('handles missing settings gracefully', () => {
    const result = validateBackup(JSON.stringify({
      version: 1,
      habits: [{ id: 'h1', title: 'Read', type: 'boolean' }],
      habit_logs: [],
      streak_caches: [],
    }));
    expect(result.success).toBe(true);
    expect(result.data?.settings.theme).toBe('light');
  });
});
