import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Layout, Radius } from '@/constants/theme';
import { Divider } from '@/components/ui/Divider';
import { useAppStore } from '@/stores/appStore';
import * as haptics from '@/services/haptics';
import * as notifications from '@/services/notifications';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  destructive?: boolean;
}

function SettingsRow({ icon, label, value, onPress, toggle, toggleValue, onToggle, destructive }: SettingsRowProps) {
  const content = (
    <>
      <Ionicons
        name={icon}
        size={22}
        color={destructive ? Colors.light.error : Colors.light.textSecondary}
      />
      <Text style={[styles.rowLabel, destructive && { color: Colors.light.error }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {toggle && onToggle && (
          <Switch
            value={Boolean(toggleValue)}
            onValueChange={(v) => {
              haptics.light();
              void onToggle(v);
            }}
            trackColor={{ false: Colors.light.surfaceVariant, true: Colors.light.primarySoft }}
            thumbColor={toggleValue ? Colors.light.primary : Colors.light.textTertiary}
            accessibilityLabel={label}
          />
        )}
        {!toggle && onPress && (
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textTertiary} />
        )}
      </View>
    </>
  );

  // A disabled Pressable can swallow touches intended for a nested Switch on Android.
  if (toggle) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useAppStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APPEARANCE</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="color-palette-outline"
              label="Theme"
              value={settings.theme === 'light' ? 'Light' : settings.theme === 'dark' ? 'Dark' : 'System'}
              onPress={() => router.push('/settings/appearance')}
            />
            <Divider />
            <SettingsRow
              icon="finger-print-outline"
              label="Haptics"
              toggle
              toggleValue={settings.haptics_enabled}
              onToggle={(v) => { haptics.setHapticsEnabled(v); updateSettings({ haptics_enabled: v }); }}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="notifications-outline"
              label="Reminders"
              toggle
              toggleValue={settings.notifications_enabled}
              onToggle={async (v) => {
                // Update the controlled switch first; native cancellation must not make
                // it feel stuck if notification APIs are slow or unavailable.
                if (!v) {
                  updateSettings({ notifications_enabled: false });
                  await notifications.cancelDailyCheckIn();
                  return;
                }
                const enabled = await notifications.requestPermission();
                updateSettings({ notifications_enabled: enabled });
                if (enabled) await notifications.rescheduleDailyCheckIn(settings.default_reminder_time);
              }}
            />
            <Divider />
            <SettingsRow
              icon="time-outline"
              label="Default reminder time"
              value={settings.default_reminder_time}
              onPress={() => router.push('/settings/notifications')}
            />
          </View>
        </View>

        {/* Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BEHAVIOR</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="snow-outline"
              label="Streak freezes"
              toggle
              toggleValue={settings.streak_freezes_enabled}
              onToggle={(v) => updateSettings({ streak_freezes_enabled: v })}
            />
            <Divider />
            <SettingsRow
              icon="shield-outline"
              label="Biometric lock"
              onPress={() => router.push('/settings/security')}
            />
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="download-outline"
              label="Export backup"
              onPress={() => router.push('/settings/backup')}
            />
            <Divider />
            <SettingsRow
              icon="arrow-up-outline"
              label="Import backup"
              onPress={() => router.push('/settings/backup')}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="information-circle-outline"
              label="Version"
              value="1.0.0"
            />
            <Divider />
            <SettingsRow
              icon="heart-outline"
              label="Privacy"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
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
  screenTitle: {
    ...Typography.largeHeading,
    color: Colors.light.text,
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.captionMedium,
    color: Colors.light.textTertiary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  rowPressed: {
    backgroundColor: Colors.light.surfaceVariant,
  },
  rowLabel: {
    ...Typography.body,
    color: Colors.light.text,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowValue: {
    ...Typography.secondary,
    color: Colors.light.textSecondary,
  },
});
