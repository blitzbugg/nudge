import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { HabitIcon } from '@/components/ui/HabitIcon';
import { TinyOtter } from '@/components/mascot';
import type { OtterState } from '@/components/mascot';
import type { Habit, HabitLog } from '@/types';
import { useHabitActions } from '@/hooks/useHabits';
import * as haptics from '@/services/haptics';

interface HabitRowProps {
  habit: Habit;
  log: HabitLog | null;
  onPress: () => void;
}

export function HabitRow({ habit, log, onPress }: HabitRowProps) {
  const { completeHabit, uncompleteHabit } = useHabitActions();
  const scale = useSharedValue(1);
  const [otterState, setOtterState] = React.useState<OtterState | null>(null);
  const otterTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isCompleted = log?.is_completed || false;
  const currentValue = log?.value || 0;
  const hasTarget = habit.type !== 'boolean' && habit.type !== 'negative';

  const handleToggle = useCallback(async () => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 12, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 100 }),
    );

    if (isCompleted) {
      haptics.light();
      await uncompleteHabit(habit.id);
      setOtterState('disappointed');
    } else {
      haptics.success();
      await completeHabit(habit.id);
      setOtterState('happy');
    }

    // Clear otter reaction after a moment
    if (otterTimer.current) clearTimeout(otterTimer.current);
    otterTimer.current = setTimeout(() => setOtterState(null), 2200);
  }, [isCompleted, habit.id, completeHabit, uncompleteHabit, scale]);

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
      <Pressable
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        onPress={onPress}
      >
        <HabitIcon name={habit.icon_name} color={habit.color_hex} size={22} />

        <View style={styles.info}>
          <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
            {habit.title}
          </Text>
          {hasTarget ? (
            <Text style={styles.target}>
              {currentValue} / {habit.target_value} {habit.unit}
            </Text>
          ) : habit.type === 'negative' ? (
            <Text style={styles.target}>Last: {log?.date_str || 'Never'}</Text>
          ) : null}
        </View>

        <Animated.View style={animatedStyle}>
          <Pressable
            style={[
              styles.checkbox,
              isCompleted && { backgroundColor: habit.color_hex, borderColor: habit.color_hex },
            ]}
            onPress={handleToggle}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isCompleted }}
            accessibilityLabel={`Mark ${habit.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </Pressable>
        </Animated.View>

        {/* Tiny otter reaction (appears briefly after completion) */}
        {otterState && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(300)}
            style={styles.otterReaction}
          >
            <TinyOtter state={otterState} animate={false} />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
  },
  pressed: {
    backgroundColor: Colors.light.surfaceVariant,
  },
  info: {
    flex: 1,
    gap: Spacing.xxs,
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.light.text,
  },
  titleCompleted: {
    color: Colors.light.textSecondary,
  },
  target: {
    ...Typography.caption,
    color: Colors.light.textTertiary,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otterReaction: {
    marginLeft: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
