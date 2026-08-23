/**
 * Nudge Timer Engine
 *
 * Timestamp-driven timer for time-based habits.
 * Uses startedAt/pausedAt/elapsedBeforePause pattern.
 * Recovers correctly after backgrounding.
 */

import type { TimerState } from '@/types';

/** Create initial timer state */
export function createTimer(habitId: string, targetDuration: number): TimerState {
  return {
    habit_id: habitId,
    status: 'idle',
    started_at: null,
    paused_at: null,
    elapsed_before_pause: 0,
    target_duration: targetDuration,
  };
}

/** Start or resume a timer */
export function startTimer(state: TimerState): TimerState {
  if (state.status === 'completed') return state;
  const now = Date.now();
  return {
    ...state,
    status: 'running',
    started_at: now,
    paused_at: null,
  };
}

/** Pause a running timer */
export function pauseTimer(state: TimerState): TimerState {
  if (state.status !== 'running') return state;
  const now = Date.now();
  const elapsed = state.started_at
    ? state.elapsed_before_pause + (now - state.started_at)
    : state.elapsed_before_pause;
  return {
    ...state,
    status: 'paused',
    started_at: null,
    paused_at: now,
    elapsed_before_pause: elapsed,
  };
}

/** Reset timer to idle */
export function resetTimer(state: TimerState): TimerState {
  return {
    ...state,
    status: 'idle',
    started_at: null,
    paused_at: null,
    elapsed_before_pause: 0,
  };
}

/** Get elapsed milliseconds (live calculation) */
export function getElapsedMs(state: TimerState): number {
  if (state.status === 'running' && state.started_at) {
    return state.elapsed_before_pause + (Date.now() - state.started_at);
  }
  return state.elapsed_before_pause;
}

/** Get remaining milliseconds */
export function getRemainingMs(state: TimerState): number {
  return Math.max(0, state.target_duration - getElapsedMs(state));
}

/** Get progress fraction (0-1) */
export function getTimerProgress(state: TimerState): number {
  if (state.target_duration <= 0) return 0;
  return Math.min(1, getElapsedMs(state) / state.target_duration);
}

/** Check if timer is complete */
export function isTimerComplete(state: TimerState): boolean {
  return getElapsedMs(state) >= state.target_duration;
}

/** Get formatted elapsed time string */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Get formatted remaining time string */
export function formatRemaining(state: TimerState): string {
  return formatElapsed(getRemainingMs(state));
}

/** Duration in minutes to milliseconds */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/** Duration in hours to milliseconds */
export function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

/** Milliseconds to minutes */
export function msToMinutes(ms: number): number {
  return ms / (60 * 1000);
}

/** Format target duration for display */
export function formatTargetDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  if (remainMin === 0) return `${hours} hr`;
  return `${hours}h ${remainMin}m`;
}
