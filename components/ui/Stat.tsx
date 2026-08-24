import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface StatProps {
  label: string;
  value: string | number;
  color?: string;
}

export function Stat({ label, value, color }: StatProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.value, color && { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  value: {
    ...Typography.largeHeading,
    color: Colors.light.text,
  },
  label: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
});
