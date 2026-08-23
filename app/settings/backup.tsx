import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Colors, Spacing, Typography, Radius, Layout } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import * as HabitRepo from '@/database/repositories/habitRepository';
import * as LogRepo from '@/database/repositories/logRepository';
import * as StreakRepo from '@/database/repositories/streakRepository';
import * as backupService from '@/services/backup';
import { useAppStore } from '@/stores/appStore';
import * as haptics from '@/services/haptics';

export default function BackupScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const settings = useAppStore((s) => s.settings);

  const handleExport = async () => {
    setExporting(true);
    try {
      const habits = await HabitRepo.getAllHabits();
      const archived = await HabitRepo.getArchivedHabits();
      const allHabits = [...habits, ...archived];
      const allLogs = await LogRepo.getLogsInRange('2020-01-01', '2030-12-31');
      const streaks = await StreakRepo.getAllStreaks();

      await backupService.showExportOptions(allHabits, allLogs, streaks, settings);
    } catch {
      Alert.alert('Export Failed', 'Could not create backup.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const uri = await backupService.pickBackupFile();
      if (!uri) {
        setImporting(false);
        return;
      }

      const result = await backupService.readBackupFile(uri);
      if (!result.success || !result.data) {
        Alert.alert('Import Failed', result.error || 'Invalid backup file.');
        setImporting(false);
        return;
      }

      Alert.alert(
        'Import Backup',
        `This will import ${result.data.habits.length} habits and ${result.data.habit_logs.length} logs. Existing data will be merged.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              try {
                // Preserve exported IDs: logs and streak caches reference them.
                await HabitRepo.importHabits(result.data!.habits);

                // Import logs
                await LogRepo.importLogs(result.data!.habit_logs);

                // Import streaks
                await StreakRepo.importStreakCaches(result.data!.streak_caches);

                haptics.success();
                Alert.alert('Import Complete', 'Your data has been restored successfully.');
              } catch {
                Alert.alert('Import Error', 'Some data could not be imported.');
              }
              setImporting(false);
            },
          },
        ],
      );
    } catch {
      Alert.alert('Import Failed', 'Could not read the backup file.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>EXPORT</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            Export all your habits, logs, and streak data as a JSON file. This backup can be used to restore your data.
          </Text>
          <Button
            title={exporting ? 'Exporting...' : 'Export Backup'}
            onPress={handleExport}
            disabled={exporting}
            loading={exporting}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>IMPORT</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            Import a previously exported Nudge backup. Your data will be validated before import.
          </Text>
          <Button
            title={importing ? 'Importing...' : 'Import Backup'}
            onPress={handleImport}
            disabled={importing}
            loading={importing}
            variant="secondary"
          />
        </View>
      </View>

      <Text style={styles.hint}>
        Backups are stored locally on your device. No data is sent to any server.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  section: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.xl,
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
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  hint: {
    ...Typography.secondary,
    color: Colors.light.textTertiary,
    marginTop: Spacing.xxl,
    paddingHorizontal: Layout.screenPaddingHorizontal,
  },
});
