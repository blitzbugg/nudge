import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Layout } from '@/constants/theme';
import * as haptics from '@/services/haptics';

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function IconButton({
  name,
  onPress,
  color = Colors.light.textSecondary,
  size = 24,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.base, pressed && styles.pressed, style]}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || name}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: Layout.touchTarget,
    height: Layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.small,
  },
  pressed: {
    backgroundColor: Colors.light.surfaceVariant,
    opacity: 0.7,
  },
});
