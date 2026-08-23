/**
 * Nudge Haptics Service
 *
 * Centralized haptic feedback. Each method is a no-op if haptics are unavailable.
 * Use for meaningful interactions only.
 */

import * as ExpoHaptics from 'expo-haptics';

let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export function isHapticsEnabled() {
  return enabled;
}

function guard(fn: () => void) {
  if (!enabled) return;
  try {
    fn();
  } catch {
    // Haptics unavailable - silently ignore
  }
}

export function selection() {
  guard(() => ExpoHaptics.selectionAsync());
}

export function light() {
  guard(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light));
}

export function medium() {
  guard(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium));
}

export function heavy() {
  guard(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy));
}

export function success() {
  guard(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success));
}

export function warning() {
  guard(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning));
}

export function error() {
  guard(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error));
}
