import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput as RNTextInput,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Layout, HabitColors, HABIT_COLOR_NAMES } from '@/constants/theme';
import { HabitIcon, HABIT_ICON_OPTIONS } from '@/components/ui/HabitIcon';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { useHabitActions } from '@/hooks/useHabits';
import type { HabitType, FrequencyType } from '@/types';
import * as haptics from '@/services/haptics';

const HABIT_TYPES: { type: HabitType; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { type: 'boolean', label: 'Yes / No', icon: 'checkmark-circle-outline', description: 'Did you do it' },
  { type: 'numeric', label: 'Numeric', icon: 'stats-chart-outline', description: 'Track a number' },
  { type: 'timer', label: 'Timer', icon: 'timer-outline', description: 'Track time spent' },
  { type: 'checklist', label: 'Checklist', icon: 'list-outline', description: 'Multi-step routine' },
  { type: 'negative', label: 'Quit', icon: 'ban-outline', description: 'Days without something' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CreateHabitScreen() {
  const router = useRouter();
  const { createHabit } = useHabitActions();

  // Step state
  const [step, setStep] = useState(0);

  // Form state
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('1');
  const [unit, setUnit] = useState('');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [intervalDays, setIntervalDays] = useState('2');
  const [weeklyTarget, setWeeklyTarget] = useState('3');
  const [colorHex, setColorHex] = useState('#5B5CE2');
  const [iconName, setIconName] = useState('check-circle');
  const [checklistItems, setChecklistItems] = useState(['']);

  const canProceed = useCallback(() => {
    switch (step) {
      case 0: return true;
      case 1: return title.trim().length > 0;
      case 2:
        if (habitType === 'numeric' || habitType === 'timer') {
          return Number(targetValue) > 0;
        }
        return true;
      default: return true;
    }
  }, [step, title, habitType, targetValue]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }

    const mask = frequencyType === 'specific_days'
      ? selectedDays.reduce((acc, d) => acc | (1 << d), 0)
      : 127;

    try {
      await createHabit({
        title: title.trim(),
        description: description.trim(),
        type: habitType,
        target_value: Number(targetValue) || 1,
        unit: unit.trim(),
        frequency_type: frequencyType,
        target_days_mask: mask,
        interval_days: Number(intervalDays) || 2,
        weekly_target: Number(weeklyTarget) || 3,
        color_hex: colorHex,
        icon_name: iconName,
        checklist_items: checklistItems.filter((s) => s.trim()),
      });

      haptics.success();
      router.back();
    } catch {
      Alert.alert('Error', 'Could not create habit. Please try again.');
    }
  };

  const toggleDay = (day: number) => {
    haptics.selection();
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addChecklistItem = () => {
    setChecklistItems((prev) => [...prev, '']);
  };

  const updateChecklistItem = (index: number, value: string) => {
    setChecklistItems((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Step indicator */}
        <View style={styles.steps}>
          {['Type', 'Details', 'Target', 'Schedule', 'Style'].map((label, i) => (
            <View key={label} style={styles.stepDot}>
              <View style={[styles.dot, i <= step && styles.dotActive]} />
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>

        <Divider />

        {/* Step 0: Type */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What type of habit?</Text>
            <Text style={styles.stepDescription}>Choose what best describes how you will track this.</Text>
            {HABIT_TYPES.map(({ type, label, icon, description }) => (
              <Pressable
                key={type}
                style={({ pressed }) => [
                  styles.typeOption,
                  habitType === type && styles.typeSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => { haptics.selection(); setHabitType(type); }}
              >
                <Ionicons name={icon} size={24} color={habitType === type ? Colors.light.primary : Colors.light.textSecondary} />
                <View style={styles.typeInfo}>
                  <Text style={[styles.typeLabel, habitType === type && { color: Colors.light.primary }]}>{label}</Text>
                  <Text style={styles.typeDescription}>{description}</Text>
                </View>
                {habitType === type && <Ionicons name="checkmark-circle" size={22} color={Colors.light.primary} />}
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Name your habit</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name *</Text>
              <RNTextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Read, Meditate, Exercise"
                placeholderTextColor={Colors.light.textTertiary}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description</Text>
              <RNTextInput
                style={[styles.input, styles.inputMultiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Optional note"
                placeholderTextColor={Colors.light.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        )}

        {/* Step 2: Target */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Set your target</Text>
            {(habitType === 'numeric' || habitType === 'timer') && (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Target value</Text>
                  <RNTextInput
                    style={styles.input}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={Colors.light.textTertiary}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Unit</Text>
                  <RNTextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder={habitType === 'timer' ? 'minutes' : 'pages, reps, ml'}
                    placeholderTextColor={Colors.light.textTertiary}
                  />
                </View>
              </>
            )}
            {habitType === 'checklist' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Checklist items</Text>
                {checklistItems.map((item, i) => (
                  <View key={i} style={styles.checklistRow}>
                    <RNTextInput
                      style={[styles.input, { flex: 1 }]}
                      value={item}
                      onChangeText={(v) => updateChecklistItem(i, v)}
                      placeholder={`Step ${i + 1}`}
                      placeholderTextColor={Colors.light.textTertiary}
                    />
                    {checklistItems.length > 1 && (
                      <Pressable onPress={() => removeChecklistItem(i)}>
                        <Ionicons name="close-circle" size={24} color={Colors.light.textTertiary} />
                      </Pressable>
                    )}
                  </View>
                ))}
                <Pressable style={styles.addItem} onPress={addChecklistItem}>
                  <Ionicons name="add-circle-outline" size={20} color={Colors.light.primary} />
                  <Text style={styles.addItemText}>Add step</Text>
                </Pressable>
              </View>
            )}
            {habitType === 'boolean' && (
              <Text style={styles.hintText}>Boolean habits are simple yes/no — no target needed.</Text>
            )}
            {habitType === 'negative' && (
              <Text style={styles.hintText}>Track how many days since the last occurrence.</Text>
            )}
          </View>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>When should you do this?</Text>
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
                <View style={styles.typeInfo}>
                  <Text style={[styles.typeLabel, frequencyType === ft && { color: Colors.light.primary }]}>
                    {ft === 'daily' ? 'Every day' : ft === 'specific_days' ? 'Specific days' : ft === 'interval' ? 'Every N days' : 'Weekly target'}
                  </Text>
                </View>
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
                <RNTextInput
                  style={styles.input}
                  value={intervalDays}
                  onChangeText={setIntervalDays}
                  keyboardType="numeric"
                  placeholder="2"
                  placeholderTextColor={Colors.light.textTertiary}
                />
              </View>
            )}

            {frequencyType === 'weekly_target' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Times per week</Text>
                <RNTextInput
                  style={styles.input}
                  value={weeklyTarget}
                  onChangeText={setWeeklyTarget}
                  keyboardType="numeric"
                  placeholder="3"
                  placeholderTextColor={Colors.light.textTertiary}
                />
              </View>
            )}
          </View>
        )}

        {/* Step 4: Style */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose appearance</Text>

            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorRow}>
              {HABIT_COLOR_NAMES.map((name) => (
                <Pressable
                  key={name}
                  style={[
                    styles.colorButton,
                    { backgroundColor: HabitColors[name] },
                    colorHex === HabitColors[name] && styles.colorSelected,
                  ]}
                  onPress={() => { haptics.selection(); setColorHex(HabitColors[name]); }}
                />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: Spacing.xl }]}>Icon</Text>
            <View style={styles.iconGrid}>
              {HABIT_ICON_OPTIONS.map((icon) => (
                <Pressable
                  key={icon}
                  style={[styles.iconButton, iconName === icon && { backgroundColor: colorHex + '20', borderColor: colorHex }]}
                  onPress={() => { haptics.selection(); setIconName(icon); }}
                >
                  <HabitIcon name={icon} color={iconName === icon ? colorHex : Colors.light.textTertiary} size={22} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navRow}>
          {step > 0 && (
            <Button
              title="Back"
              onPress={() => setStep(step - 1)}
              variant="ghost"
            />
          )}
          <View style={{ flex: 1 }} />
          {step < 4 ? (
            <Button
              title="Next"
              onPress={() => setStep(step + 1)}
              disabled={!canProceed()}
            />
          ) : (
            <Button
              title="Create Habit"
              onPress={handleSave}
              loading={false}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.md,
  },
  stepDot: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.surfaceVariant,
  },
  dotActive: {
    backgroundColor: Colors.light.primary,
  },
  stepLabel: {
    ...Typography.caption,
    color: Colors.light.textTertiary,
  },
  stepLabelActive: {
    color: Colors.light.primary,
    fontWeight: '500',
  },
  stepContent: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  stepTitle: {
    ...Typography.section,
    color: Colors.light.text,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  typeSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  pressed: {
    opacity: 0.7,
  },
  typeInfo: {
    flex: 1,
    gap: Spacing.xxs,
  },
  typeLabel: {
    ...Typography.bodyMedium,
    color: Colors.light.text,
  },
  typeDescription: {
    ...Typography.secondary,
    color: Colors.light.textSecondary,
  },
  field: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    ...Typography.secondaryMedium,
    color: Colors.light.text,
  },
  input: {
    ...Typography.body,
    color: Colors.light.text,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hintText: {
    ...Typography.body,
    color: Colors.light.textTertiary,
    fontStyle: 'italic',
  },
  daysRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayText: {
    ...Typography.captionMedium,
    color: Colors.light.textSecondary,
  },
  dayTextSelected: {
    color: '#fff',
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: Colors.light.text,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.xxl,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  addItemText: {
    ...Typography.secondary,
    color: Colors.light.primary,
  },
});
