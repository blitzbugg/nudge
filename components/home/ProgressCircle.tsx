import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { Colors, Typography } from '@/constants/theme';

interface ProgressCircleProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressCircle({
  completed,
  total,
  size = 120,
  strokeWidth = 8,
}: ProgressCircleProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * percentage) / 100;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.light.surfaceVariant}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={percentage === 100 ? Colors.light.success : Colors.light.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={styles.number}>{completed}</Text>
        <Text style={styles.of}>of</Text>
        <Text style={styles.total}>{total}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  number: {
    ...Typography.largeHeading,
    color: Colors.light.text,
  },
  of: {
    ...Typography.caption,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  total: {
    ...Typography.section,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
