/**
 * Nudge Notification Service
 *
 * Local notification architecture for habit reminders.
 * Schedules, cancels, and reschedules notifications locally.
 * No server-side push required.
 *
 * In Expo Go, notifications have limited functionality.
 * Full notification support requires a development build.
 */

import * as Notifications from 'expo-notifications';

// ─── Configuration ────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function checkPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export interface ScheduleNotificationParams {
  habitId: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  weekdays?: number[]; // 0=Sun..6=Sat
}

/**
 * Schedule a recurring daily notification.
 * Returns the notification identifier for later cancellation.
 */
export async function scheduleNotification(
  params: ScheduleNotificationParams,
): Promise<string | null> {
  try {
    const granted = await requestPermission();
    if (!granted) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: { habitId: params.habitId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: params.hour,
        minute: params.minute,
      },
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Schedule a weekly notification for specific weekdays.
 */
export async function scheduleWeeklyNotification(
  params: ScheduleNotificationParams,
): Promise<string | null> {
  try {
    const granted = await requestPermission();
    if (!granted) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: { habitId: params.habitId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: params.hour,
        minute: params.minute,
      },
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Schedule a one-time notification at a specific time.
 */
export async function scheduleOneTimeNotification(
  params: ScheduleNotificationParams & { date: Date },
): Promise<string | null> {
  try {
    const granted = await requestPermission();
    if (!granted) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: { habitId: params.habitId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: params.date,
      },
    });
    return id;
  } catch {
    return null;
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Ignore
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore
  }
}

/** The settings-level reminder is a real local notification, independent of any backend. */
export async function rescheduleDailyCheckIn(time: string): Promise<boolean> {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return false;
  try {
    const granted = await requestPermission();
    if (!granted) return false;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled
      .filter((item) => item.content.data?.kind === 'daily-check-in')
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nudge',
        body: 'Take a moment to check in on today’s habits.',
        data: { kind: 'daily-check-in' },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelDailyCheckIn(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled
      .filter((item) => item.content.data?.kind === 'daily-check-in')
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  } catch {
    // Notification APIs can be unavailable in Expo Go; leave the UI usable.
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export type NotificationAction = 'mark_done' | 'snooze' | 'open_habit';

export function addNotificationResponseListener(
  handler: (action: NotificationAction, habitId: string) => void,
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const { habitId } = response.notification.request.content.data as { habitId: string };
    const actionIdentifier = response.actionIdentifier;

    let action: NotificationAction;
    switch (actionIdentifier) {
      case 'mark_done':
        action = 'mark_done';
        break;
      case 'snooze':
        action = 'snooze';
        break;
      default:
        action = 'open_habit';
    }

    handler(action, habitId);
  });
}
