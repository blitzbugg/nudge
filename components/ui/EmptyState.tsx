import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Button } from './Button';
import { SmallOtter } from '@/components/mascot';
import type { OtterState } from '@/components/mascot';

interface EmptyStateProps {
  /** Otter state for the empty illustration */
  otterState?: OtterState;
  title: string;
  message: string;
  actionTitle?: string;
  onAction?: () => void;
  /** Hide from screen readers when purely decorative */
  decorative?: boolean;
}

export function EmptyState({
  otterState = 'neutral',
  title,
  message,
  actionTitle,
  onAction,
  decorative = true,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <SmallOtter state={otterState} accessibilityLabel={decorative ? null : undefined} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionTitle && onAction && (
        <View style={styles.buttonWrap}>
          <Button title={actionTitle} onPress={onAction} variant="primary" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xxxxxl,
    gap: Spacing.sm,
  },
  title: {
    ...Typography.section,
    color: Colors.light.text,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonWrap: {
    marginTop: Spacing.sm,
  },
});
