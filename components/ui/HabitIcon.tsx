import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/theme';

interface HabitIconProps {
  name: string;
  color: string;
  size?: number;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  'check-circle': 'checkmark-circle-outline',
  'book': 'book-outline',
  'run': 'walk-outline',
  'fitness': 'barbell-outline',
  'water': 'water-outline',
  'sleep': 'bed-outline',
  'meditate': 'body-outline',
  'code': 'code-outline',
  'pencil': 'pencil-outline',
  'music': 'musical-notes-outline',
  'heart': 'heart-outline',
  'star': 'star-outline',
  'sun': 'sunny-outline',
  'moon': 'moon-outline',
  'coffee': 'cafe-outline',
  'food': 'restaurant-outline',
  'code-slash': 'code-slash-outline',
  'brain': 'bulb-outline',
  'trophy': 'trophy-outline',
  'zap': 'flash-outline',
  'no-smoking': 'ban-outline',
  'no-phone': 'phone-portrait-outline',
};

export function HabitIcon({ name, color, size = 24 }: HabitIconProps) {
  const iconName = ICON_MAP[name] || 'checkmark-circle-outline';

  return (
    <View style={[styles.container, { backgroundColor: color + '15' }]}>
      <Ionicons name={iconName} size={size} color={color} />
    </View>
  );
}

export const HABIT_ICON_OPTIONS = Object.keys(ICON_MAP);

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
