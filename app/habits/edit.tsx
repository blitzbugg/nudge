import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput as RNTextInput,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Layout, HabitColors, HABIT_COLOR_NAMES } from '@/constants/theme';
import { HabitIcon, HABIT_ICON_OPTIONS } from '@/components/ui/HabitIcon';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { useHabitActions, useHabit } from '@/hooks/useHabits';
import type { FrequencyType } from '@/types';
import * as haptics from '@/services/haptics';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { habit } = useHabit(id);
  const { updateHabit } = useHabitActions();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('1');
  const [unit, setUnit] = useState('');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [intervalDays, setIntervalDays] = useState('2');
  const [weeklyTarget, setWeeklyTarget] = useState('3');
  const [colorHex, setColorHex] = useState('#5B5CE2');
  const [iconName, setIconName] = useState('check-circle');

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description);
      setTargetValue(String(habit.target_value));
      setUnit(habit.unit);
      setFrequencyType(habit.frequency_type);
      setIconName(habit.icon_name);
      setColorHex(habit.color_hex);
      setIntervalDays(String(habit.interval_days));
      setWeeklyTarget(String(habit.weekly_target));

      // Decode bitmask to days
      const days: number[] = [];
      for (let i = 0; i < 7; i++) {
        if (habit.target_days_mask & (1 << i)) days.push(i);
      }
      setSelectedDays(days);
    }
  }, [habit]);

  const handleSave = async () => {
    if (!id || !title.trim()) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }

    const mask = frequencyType === 'specific_days'
      ? selectedDays.reduce((acc, d) => acc | (1 << d), 0)
      : 127;

    try {
      await updateHabit(id, {
        title: title.trim(),
        description: description.trim(),
        target_value: Number(targetValue) || 1,
        unit: unit.trim(),
        frequency_type: frequencyType,
        target_days_mask: mask,
        interval_days: Number(intervalDays) || 2,
        weekly_target: Number(weeklyTarget) || 3,
        color_hex: colorHex,
        icon_name: iconName,
      });
      haptics.success();
      router.back();
    } catch {
      Alert.alert('Error', 'Could not update habit.');
    }
  };

  const toggleDay = (day: number) => {
    haptics.selection();
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (!habit) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Details */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name</Text>
            <RNTextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Habit name"
              placeholderTextColor={Colors.light.textTertiary}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <RNTextInput
              style={[styles.input, { minHeight: 60 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              placeholderTextColor={Colors.light.textTertiary}
              multiline
            />
          </View>

          {/* Target */}
          {(habit.type === 'numeric' || habit.type === 'timer') && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Target</Text>
              <RNTextInput
                style={styles.input}
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="numeric"
                placeholderTextColor={Colors.light.textTertiary}
              />
            </View>
          )}
          {(habit.type === 'numeric' || habit.type === 'timer') && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Unit</Text>
              <RNTextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholderTextColor={Colors.light.textTertiary}
              />
            </View>
          )}

          <Divider />

          {/* Schedule */}
          <Text style={styles.sectionTitle}>Schedule</Text>
          {(['daily', 'specific_days', 'interval', 'weekly_target'] as FrequencyType[]).map((ft) => (
            <Pressable
              key={ft}
              style={({ pressed }) => [
                styles.typeOption,
                frequencyType === ft && styles.typeSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => { haptics.selection(); setFrequencyType(ft); }}
            >
              <Text style={[styles.typeLabel, frequencyType === ft && { color: Colors.light.primary }]}>
                {ft === 'daily' ? 'Every day' : ft === 'specific_days' ? 'Specific days' : ft === 'interval' ? 'Every N days' : 'Weekly target'}
              </Text>
              {frequencyType === ft && <Ionicons name="checkmark-circle" size={22} color={Colors.light.primary} />}
            </Pressable>
          ))}

          {frequencyType === 'specific_days' && (
            <View style={styles.daysRow}>
              {DAY_NAMES.map((day, i) => (
                <Pressable
                  key={day}
                  style={[styles.dayButton, selectedDays.includes(i) && styles.daySelected]}
                  onPress={() => toggleDay(i)}
                >
                  <Text style={[styles.dayText, selectedDays.includes(i) && styles.dayTextSelected]}>
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {frequencyType === 'interval' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Every N days</Text>
              <RNTextInput style={styles.input} value={intervalDays} onChangeText={setIntervalDays} keyboardType="numeric" placeholderTextColor={Colors.light.textTertiary} />
            </View>
          )}

          {frequencyType === 'weekly_target' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Times per week</Text>
              <RNTextInput style={styles.input} value={weeklyTarget} onChangeText={setWeeklyTarget} keyboardType="numeric" placeholderTextColor={Colors.light.textTertiary} />
            </View>
          )}

          <Divider />

          {/* Appearance */}
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.colorRow}>
            {HABIT_COLOR_NAMES.map((name) => (
              <Pressable
                key={name}
                style={[styles.colorButton, { backgroundColor: HabitColors[name] }, colorHex === HabitColors[name] && styles.colorSelected]}
                onPress={() => { haptics.selection(); setColorHex(HabitColors[name]); }}
              />
            ))}
          </View>
          <View style={styles.iconGrid}>
            {HABIT_ICON_OPTIONS.map((icon) => (
              <Pressable
                key={icon}
                style={[styles.iconButton, iconName === icon && { backgroundColor: colorHex + '20', borderColor: colorHex }]}
                onPress={() => { haptics.selection(); setIconName(icon); }}
              >
                <HabitIcon name={icon} color={iconName === icon ? colorHex : Colors.light.textTertiary} size={20} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button title="Save Changes" onPress={handleSave} />
          <Button title="Cancel" onPress={() => router.back()} variant="ghost" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.body, color: Colors.light.textSecondary },
  content: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  field: { gap: Spacing.sm },
  fieldLabel: { ...Typography.secondaryMedium, color: Colors.light.text },
  input: {
    ...Typography.body,
    color: Colors.light.text,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  sectionTitle: { ...Typography.section, color: Colors.light.text },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  typeSelected: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primarySoft },
  pressed: { opacity: 0.7 },
  typeLabel: { ...Typography.body, color: Colors.light.text },
  daysRow: { flexDirection: 'row', gap: Spacing.sm },
  dayButton: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center',
  },
  daySelected: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  dayText: { ...Typography.captionMedium, color: Colors.light.textSecondary },
  dayTextSelected: { color: '#fff' },
  colorRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  colorButton: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: Colors.light.text },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconButton: {
    width: 44, height: 44, borderRadius: Radius.small, borderWidth: 1,
    borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center',
  },
  actions: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    marginTop: Spacing.xxl,
    gap: Spacing.sm,
  },
});
