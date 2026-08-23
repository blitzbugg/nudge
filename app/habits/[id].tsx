import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors, Spacing, Typography, Radius, Layout } from '@/constants/theme';
import { HabitIcon } from '@/components/ui/HabitIcon';
import { Button } from '@/components/ui/Button';
import { Stat } from '@/components/ui/Stat';
import { ProgressBar } from '@/components/ui/ProgressBar';

import { useHabitActions, useHabit, useHabitLogs } from '@/hooks/useHabits';
import * as StreakRepo from '@/database/repositories/streakRepository';
import { todayStr, lastNDays, formatMonthDay } from '@/utils/date';
import { frequencyLabel } from '@/utils/scheduling';
import type { StreakCache } from '@/types';
import * as haptics from '@/services/haptics';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { habit, loading } = useHabit(id);
  const { logs, refresh: refreshLogs } = useHabitLogs(id);
  const { completeHabit, uncompleteHabit, setHabitProgress, archiveHabit, deleteHabit } = useHabitActions();
  const [streak, setStreak] = useState<StreakCache | null>(null);
  const [progressInput, setProgressInput] = useState('0');

  useEffect(() => {
    if (id) {
      StreakRepo.getStreak(id).then(setStreak);
    }
  }, [id, logs]);

  const todayLog = logs.find((l) => l.date_str === todayStr());
  const isCompleted = todayLog?.is_completed || false;
  const last7 = lastNDays(7);

  useEffect(() => {
    setProgressInput(String(todayLog?.value || 0));
  }, [todayLog?.value]);

  const handleToggle = useCallback(async () => {
    if (!id) return;
    haptics.success();
    if (isCompleted) {
      await uncompleteHabit(id);
    } else {
      await completeHabit(id);
    }
    refreshLogs();
    if (id) {
      const s = await StreakRepo.getStreak(id);
      setStreak(s);
    }
  }, [id, isCompleted, completeHabit, uncompleteHabit, refreshLogs]);

  const saveProgress = useCallback(async () => {
    if (!id) return;
    const value = Number(progressInput);
    if (!Number.isFinite(value) || value < 0) {
      Alert.alert('Enter a valid amount', 'Progress must be zero or greater.');
      return;
    }
    await setHabitProgress(id, value);
    haptics.success();
    refreshLogs();
    setStreak(await StreakRepo.getStreak(id));
  }, [id, progressInput, refreshLogs, setHabitProgress]);

  const handleArchive = useCallback(() => {
    Alert.alert(
      'Archive Habit',
      'This habit will be hidden from your daily list but your history will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            if (!id) return;
            await archiveHabit(id);
            haptics.success();
            router.back();
          },
        },
      ],
    );
  }, [id, archiveHabit, router]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Habit',
      'This will permanently delete this habit and all its history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            await deleteHabit(id);
            haptics.warning();
            router.back();
          },
        },
      ],
    );
  }, [id, deleteHabit, router]);

  if (loading || !habit) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const progress = habit.type !== 'boolean' && habit.type !== 'negative' && habit.target_value > 0
    ? Math.min(100, Math.round(((todayLog?.value || 0) / habit.target_value) * 100))
    : isCompleted ? 100 : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <HabitIcon name={habit.icon_name} color={habit.color_hex} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{habit.title}</Text>
          {habit.description ? (
            <Text style={styles.description}>{habit.description}</Text>
          ) : null}
          <Text style={styles.frequency}>
            {frequencyLabel(habit.frequency_type, habit.target_days_mask, habit.interval_days, habit.weekly_target)}
          </Text>
        </View>
      </View>

      {/* Today's progress */}
      {habit.type !== 'negative' && (
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Today</Text>
          <ProgressBar progress={progress} color={habit.color_hex} />
          {habit.type !== 'boolean' && (
            <View style={styles.progressEntry}>
              <TextInput
                style={styles.progressInput}
                value={progressInput}
                onChangeText={setProgressInput}
                keyboardType="decimal-pad"
                accessibilityLabel={`Progress for ${habit.title}`}
              />
              <Text style={styles.progressValue}>of {habit.target_value} {habit.unit}</Text>
              <Button title="Save" onPress={saveProgress} variant="secondary" />
            </View>
          )}
          <Button
            title={isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
            onPress={handleToggle}
            variant={isCompleted ? 'secondary' : 'primary'}
          />
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat label="Current" value={streak?.current_streak || 0} color={habit.color_hex} />
        <Stat label="Best" value={streak?.longest_streak || 0} color={Colors.light.streak} />
        <Stat label="Total" value={streak?.total_completions || 0} />
      </View>

      {/* Last 7 days */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Last 7 Days</Text>
        <View style={styles.last7Row}>
          {last7.map((date) => {
            const log = logs.find((l) => l.date_str === date);
            const completed = log?.is_completed;
            return (
              <View key={date} style={styles.last7Item}>
                <View style={[styles.last7Dot, completed && { backgroundColor: habit.color_hex }]} />
                <Text style={styles.last7Day}>{formatMonthDay(date).split(' ')[1]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>History</Text>
        {logs.length === 0 ? (
          <Text style={styles.noHistory}>No entries yet.</Text>
        ) : (
          logs.slice(0, 30).map((log) => (
            <View key={log.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{formatMonthDay(log.date_str)}</Text>
              <Text style={[styles.historyValue, log.is_completed && { color: Colors.light.success }]}>
                {log.is_completed ? '✓' : '—'} {log.value}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Edit"
          onPress={() => router.push({ pathname: '/habits/edit', params: { id: habit.id } })}
          variant="secondary"
        />
        <Button title="Archive" onPress={handleArchive} variant="ghost" />
        <Button title="Delete" onPress={handleDelete} variant="ghost" />
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.xl,
  },
  headerInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.largeHeading,
    color: Colors.light.text,
  },
  description: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  frequency: {
    ...Typography.secondary,
    color: Colors.light.textTertiary,
  },
  progressCard: {
    marginHorizontal: Layout.screenPaddingHorizontal,
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.medium,
    gap: Spacing.md,
  },
  progressTitle: {
    ...Typography.secondaryMedium,
    color: Colors.light.textSecondary,
  },
  progressValue: {
    ...Typography.secondary,
    color: Colors.light.textTertiary,
    textAlign: 'center',
  },
  progressEntry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressInput: {
    minWidth: 64, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: Radius.small, backgroundColor: Colors.light.surfaceVariant,
    color: Colors.light.text, textAlign: 'center', ...Typography.body,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: Layout.screenPaddingHorizontal,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.medium,
  },
  section: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    marginTop: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.section,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  last7Row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  last7Item: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  last7Dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceVariant,
  },
  last7Day: {
    ...Typography.caption,
    color: Colors.light.textTertiary,
  },
  noHistory: {
    ...Typography.body,
    color: Colors.light.textTertiary,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  historyDate: {
    ...Typography.body,
    color: Colors.light.text,
  },
  historyValue: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  actions: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    marginTop: Spacing.xxl,
    gap: Spacing.sm,
  },
});
