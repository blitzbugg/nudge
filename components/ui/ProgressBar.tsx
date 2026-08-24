import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  showLabel?: boolean;
  color?: string;
}

export function ProgressBar({
  progress,
  height = 8,
  showLabel = true,
  color = Colors.light.primary,
}: ProgressBarProps) {
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withTiming(Math.min(100, Math.max(0, progress)), {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.fill,
            { height, borderRadius: height / 2, backgroundColor: color },
            animatedStyle,
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>{Math.round(progress)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  track: {
    backgroundColor: Colors.light.surfaceVariant,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  label: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
});
