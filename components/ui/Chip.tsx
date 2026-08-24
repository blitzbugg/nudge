import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, color, style }: ChipProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        selected && { backgroundColor: color || Colors.light.primary, borderColor: color || Colors.light.primary },
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    ...Typography.secondaryMedium,
    color: Colors.light.textSecondary,
  },
  textSelected: {
    color: '#fff',
  },
});
