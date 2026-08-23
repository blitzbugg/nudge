/**
 * Nudge App Store
 *
 * Zustand store for runtime/UI state.
 * NOT the primary persistent database - that's expo-sqlite.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserSettings, TimerState } from '@/types';

// ─── App State ────────────────────────────────────────────────────────────────

interface AppState {
  // UI state
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;

  // Selected date for calendar
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Modal state
  createModalVisible: boolean;
  setCreateModalVisible: (visible: boolean) => void;

  // Timer
  activeTimers: Record<string, TimerState>;
  setTimer: (habitId: string, state: TimerState) => void;
  removeTimer: (habitId: string) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;

  // Navigation
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  isHydrated: false,
  setHydrated: (value) => set({ isHydrated: value }),

  selectedDate: '',
  setSelectedDate: (date) => set({ selectedDate: date }),

  createModalVisible: false,
  setCreateModalVisible: (visible) => set({ createModalVisible: visible }),

  activeTimers: {},
  setTimer: (habitId, state) =>
    set((s) => ({ activeTimers: { ...s.activeTimers, [habitId]: state } })),
  removeTimer: (habitId) =>
    set((s) => {
      const timers = { ...s.activeTimers };
      delete timers[habitId];
      return { activeTimers: timers };
    }),

  settings: {
    theme: 'light',
    haptics_enabled: true,
    biometric_enabled: false,
    default_reminder_time: '09:00',
    notifications_enabled: true,
    streak_freezes_enabled: true,
    weekly_freezes_count: 1,
  },
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),

  currentTab: 'home',
  setCurrentTab: (tab) => set({ currentTab: tab }),
}), {
  name: 'nudge-preferences',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ settings: state.settings, selectedDate: state.selectedDate }),
}));
