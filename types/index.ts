export type HabitType = 'boolean' | 'numeric' | 'timer' | 'checklist' | 'negative';

export type FrequencyType = 'daily' | 'specific_days' | 'interval' | 'weekly_target';

export interface Habit {
  id: string;
  title: string;
  description: string;
  type: HabitType;
  target_value: number;
  unit: string;
  frequency_type: FrequencyType;
  target_days_mask: number;
  interval_days: number;
  weekly_target: number;
  color_hex: string;
  icon_name: string;
  is_archived: boolean;
  created_at: string;
  checklist_items: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date_str: string;
  value: number;
  is_completed: boolean;
  note: string;
  created_at: string;
}

export interface StreakCache {
  id: string;
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  last_completed_date: string | null;
}

export interface HabitWithStreak extends Habit {
  streak?: StreakCache;
  today_log?: HabitLog;
}

export interface DailyProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface HabitAnalytics {
  habit_id: string;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  missed_scheduled: number;
  weekly_consistency: number;
  monthly_consistency: number;
}

export interface HeatmapDay {
  date: string;
  intensity: number;
  count: number;
}

export interface TimerState {
  habit_id: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  started_at: number | null;
  paused_at: number | null;
  elapsed_before_pause: number;
  target_duration: number;
}

export interface BackupData {
  version: number;
  exported_at: string;
  app_version: string;
  habits: Habit[];
  habit_logs: HabitLog[];
  streak_caches: StreakCache[];
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  haptics_enabled: boolean;
  biometric_enabled: boolean;
  default_reminder_time: string;
  notifications_enabled: boolean;
  streak_freezes_enabled: boolean;
  weekly_freezes_count: number;
}

export interface AppNotification {
  id: string;
  habit_id: string;
  title: string;
  body: string;
  scheduled_time: string;
  is_active: boolean;
}
