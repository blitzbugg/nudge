import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Layout } from '@/constants/theme';
import { Divider } from '@/components/ui/Divider';
import { useAppStore } from '@/stores/appStore';
import * as notifService from '@/services/notifications';
import * as haptics from '@/services/haptics';

const PRESET_HOURS = [7, 9, 12, 18, 20];
const MINUTES = [0, 15, 30, 45];

export default function NotificationsScreen() {
  const { settings, updateSettings } = useAppStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [reminderTime, setReminderTime] = useState(settings.default_reminder_time);
  const [draftTime, setDraftTime] = useState(settings.default_reminder_time);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [draftHour, draftMinute] = draftTime.split(':').map(Number);

  useEffect(() => { notifService.checkPermission().then(setHasPermission); }, []);

  const setHour = (hour: number) => setDraftTime(`${String(hour).padStart(2, '0')}:${String(draftMinute || 0).padStart(2, '0')}`);
  const setMinute = (minute: number) => setDraftTime(`${String(draftHour || 9).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);

  const handleToggle = async (enabled: boolean) => {
    haptics.light();
    if (!enabled) {
      updateSettings({ notifications_enabled: false });
      await notifService.cancelDailyCheckIn();
      return;
    }
    const granted = await notifService.requestPermission();
    setHasPermission(granted);
    updateSettings({ notifications_enabled: granted });
    if (granted) await notifService.rescheduleDailyCheckIn(reminderTime);
  };

  const confirmTime = async () => {
    setReminderTime(draftTime);
    setPickerVisible(false);
    updateSettings({ default_reminder_time: draftTime });
    if (settings.notifications_enabled) await notifService.rescheduleDailyCheckIn(draftTime);
    haptics.selection();
  };

  const openPicker = () => {
    setDraftTime(reminderTime);
    setPickerVisible(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>REMINDERS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Enable reminders</Text>
              <Text style={styles.rowDescription}>Get a daily Nudge check-in</Text>
            </View>
            <Switch value={settings.notifications_enabled && hasPermission} onValueChange={handleToggle} trackColor={{ false: Colors.light.surfaceVariant, true: Colors.light.primarySoft }} thumbColor={settings.notifications_enabled ? Colors.light.primary : Colors.light.textTertiary} />
          </View>
          <Divider />
          <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={openPicker} accessibilityRole="button" accessibilityLabel="Choose default reminder time">
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Default reminder time</Text>
              <Text style={styles.rowDescription}>Choose when Nudge checks in</Text>
            </View>
            <View style={styles.timePill}>
              <Text style={styles.timePillText}>{formatTime(reminderTime)}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
            </View>
          </Pressable>
        </View>

        {!hasPermission && settings.notifications_enabled && <View style={styles.warning}><Text style={styles.warningText}>Notification permission is required. Enable it in device settings.</Text></View>}
        <Text style={styles.hint}>Reminders are scheduled locally on your device. No data is sent to any server.</Text>
      </View>

      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Reminder time</Text>
            <Text style={styles.sheetTime}>{formatTime(draftTime)}</Text>
            <Text style={styles.pickerLabel}>QUICK PICKS</Text>
            <View style={styles.presets}>{PRESET_HOURS.map((hour) => <TimeChoice key={hour} selected={draftHour === hour && draftMinute === 0} label={formatTime(`${String(hour).padStart(2, '0')}:00`)} onPress={() => setDraftTime(`${String(hour).padStart(2, '0')}:00`)} />)}</View>
            <Text style={styles.pickerLabel}>HOUR</Text>
            <View style={styles.hourGrid}>{Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => { const value = draftHour >= 12 ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour); return <TimeChoice key={hour} selected={draftHour === value} label={String(hour)} onPress={() => setHour(value)} />; })}</View>
            <Text style={styles.pickerLabel}>MINUTES</Text>
            <View style={styles.minuteRow}>{MINUTES.map((minute) => <TimeChoice key={minute} selected={draftMinute === minute} label={String(minute).padStart(2, '0')} onPress={() => setMinute(minute)} />)}</View>
            <View style={styles.actions}><Pressable onPress={() => setPickerVisible(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable style={styles.doneButton} onPress={confirmTime}><Text style={styles.doneText}>Done</Text></Pressable></View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function TimeChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable style={[styles.choice, selected && styles.choiceSelected]} onPress={onPress}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>;
}

function formatTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute || 0).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  section: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: Spacing.xl },
  sectionLabel: { ...Typography.captionMedium, color: Colors.light.textTertiary, letterSpacing: 0.5, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs },
  card: { backgroundColor: Colors.light.surface, borderRadius: Radius.medium, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md + 2 },
  rowPressed: { backgroundColor: Colors.light.surfaceVariant },
  rowInfo: { flex: 1, gap: Spacing.xxs },
  rowLabel: { ...Typography.body, color: Colors.light.text },
  rowDescription: { ...Typography.secondary, color: Colors.light.textSecondary },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.light.primarySoft, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.pill },
  timePillText: { ...Typography.secondaryMedium, color: Colors.light.primary },
  warning: { marginTop: Spacing.md, padding: Spacing.md, backgroundColor: Colors.light.warningSoft, borderRadius: Radius.small },
  warningText: { ...Typography.secondary, color: Colors.light.warning },
  hint: { ...Typography.secondary, color: Colors.light.textTertiary, marginTop: Spacing.xl, paddingHorizontal: Spacing.xs },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(32,33,36,0.32)' },
  sheet: { backgroundColor: Colors.light.surface, borderTopLeftRadius: Radius.extra, borderTopRightRadius: Radius.extra, padding: Spacing.xl, gap: Spacing.md },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.light.border },
  sheetTitle: { ...Typography.section, color: Colors.light.text, textAlign: 'center' },
  sheetTime: { fontSize: 32, fontWeight: '600', color: Colors.light.primary, textAlign: 'center' },
  pickerLabel: { ...Typography.captionMedium, color: Colors.light.textTertiary, letterSpacing: 0.6, marginTop: Spacing.xs },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  minuteRow: { flexDirection: 'row', justifyContent: 'space-between' },
  choice: { minWidth: 40, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.small, backgroundColor: Colors.light.surfaceVariant },
  choiceSelected: { backgroundColor: Colors.light.primary },
  choiceText: { ...Typography.secondaryMedium, color: Colors.light.textSecondary },
  choiceTextSelected: { color: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.xl, marginTop: Spacing.sm },
  cancelText: { ...Typography.bodyMedium, color: Colors.light.textSecondary },
  doneButton: { backgroundColor: Colors.light.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.small },
  doneText: { ...Typography.bodyMedium, color: '#fff' },
});
