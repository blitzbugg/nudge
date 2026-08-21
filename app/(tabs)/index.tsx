import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Layout } from '@/constants/theme';
import { useTodayHabits } from '@/hooks/useHabits';
import { ProgressCircle } from '@/components/home/ProgressCircle';
import { HabitRow } from '@/components/home/HabitRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { getGreeting, formatDayFull, todayStr } from '@/utils/date';
import * as haptics from '@/services/haptics';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function HomeScreen() {
  const router = useRouter();
  const { habitsWithStatus, progress, loading, refresh } = useTodayHabits();
  const [refreshing, setRefreshing] = React.useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const wasComplete = useRef<boolean | null>(null);

  useEffect(() => {
    const complete = progress.total > 0 && progress.completed === progress.total;
    if (wasComplete.current === false && complete) {
      setCelebrating(true);
      haptics.success();
    }
    wasComplete.current = complete;
  }, [progress.completed, progress.total]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const scheduledHabits = habitsWithStatus.filter((h) => h.scheduled);
  const completedHabits = scheduledHabits.filter((h) => h.log?.is_completed);
  const pendingHabits = scheduledHabits.filter((h) => !h.log?.is_completed);

  const handleCreateHabit = useCallback(() => {
    haptics.selection();
    router.push('/habits/create');
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {celebrating && (
        <View pointerEvents="none" style={styles.confetti}>
          <ConfettiCannon
            count={72}
            origin={{ x: Dimensions.get('window').width / 2, y: 12 }}
            colors={[Colors.light.primary, Colors.light.success, Colors.light.streak, '#3B82F6']}
            fadeOut
            fallSpeed={2600}
            onAnimationEnd={() => setCelebrating(false)}
          />
        </View>
      )}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.date}>{formatDayFull(todayStr())}</Text>
          </View>
        </View>

        {/* Daily Progress */}
        <View style={styles.progressSection}>
          <ProgressCircle completed={progress.completed} total={progress.total} />
          <Text style={styles.progressLabel}>Daily progress</Text>
        </View>

        {/* Habits */}
        {scheduledHabits.length === 0 && !loading ? (
          <EmptyState
            icon="add-circle-outline"
            title="No habits yet"
            message="Start with one small habit that matters to you."
            actionTitle="Create Habit"
            onAction={handleCreateHabit}
          />
        ) : (
          <View style={styles.habitsSection}>
            {/* Completed */}
            {completedHabits.length > 0 && (
              <View>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>COMPLETED</Text>
                  <Text style={styles.sectionCount}>{completedHabits.length}</Text>
                </View>
                {completedHabits.map(({ habit, log }) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    log={log}
                    onPress={() => router.push({ pathname: '/habits/[id]', params: { id: habit.id } })}
                  />
                ))}
              </View>
            )}

            {/* Remaining */}
            {pendingHabits.length > 0 && (
              <View>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>REMAINING</Text>
                  <Text style={styles.sectionCount}>{pendingHabits.length}</Text>
                </View>
                {pendingHabits.map(({ habit, log }) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    log={log}
                    onPress={() => router.push({ pathname: '/habits/[id]', params: { id: habit.id } })}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick Add */}
        <Pressable
          style={({ pressed }) => [styles.quickAdd, pressed && styles.quickAddPressed]}
          onPress={handleCreateHabit}
        >
          <Ionicons name="add" size={20} color={Colors.light.primary} />
          <Text style={styles.quickAddText}>Add Habit</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    ...Typography.largeHeading,
    color: Colors.light.text,
  },
  date: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xxs,
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  progressLabel: {
    ...Typography.secondary,
    color: Colors.light.textTertiary,
  },
  habitsSection: {
    gap: Spacing.xl,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sectionLabel: {
    ...Typography.captionMedium,
    color: Colors.light.textTertiary,
    letterSpacing: 0.5,
  },
  sectionCount: {
    ...Typography.captionMedium,
    color: Colors.light.textTertiary,
  },
  quickAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Layout.screenPaddingHorizontal,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.light.border,
    gap: Spacing.sm,
  },
  quickAddPressed: {
    backgroundColor: Colors.light.primarySoft,
    borderColor: Colors.light.primary,
  },
  quickAddText: {
    ...Typography.bodyMedium,
    color: Colors.light.primary,
  },
  confetti: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});
