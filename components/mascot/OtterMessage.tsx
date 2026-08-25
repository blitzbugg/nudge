/**
 * OtterMessage
 *
 * A subtle, contextual text bubble that pairs with the mascot.
 * Used on the home screen to display the otter's "thought" based on
 * current progress. The message fades in and is visually restrained.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface OtterMessageProps {
  message: string;
  /** Key to force re-render on message change */
  messageKey?: string;
}

export function OtterMessage({ message, messageKey }: OtterMessageProps) {
  return (
    <Animated.View
      key={messageKey}
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      {/* Small pointer triangle */}
      <View style={styles.pointer} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

/* ── Helper: derive otter message from progress ────────────────────────── */

export function getOtterMessage(
  completed: number,
  total: number,
): string {
  if (total === 0) return "Let's start something.";
  const ratio = completed / total;

  if (ratio === 0) return "Ready for today?";
  if (ratio < 0.3) return 'Good start.';
  if (ratio < 0.6) return "Keep going — you're doing well.";
  if (ratio < 1) return 'Almost there.';
  return 'Nice work today!';
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.light.surfaceVariant,
    marginBottom: -1,
  },
  text: {
    ...Typography.secondary,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
