import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, Alert } from 'react-native';
import { Colors, Spacing, Typography, Radius, Layout } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';
import * as biometrics from '@/services/biometrics';
import * as haptics from '@/services/haptics';

export default function SecurityScreen() {
  const { settings, updateSettings } = useAppStore();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    biometrics.isAvailable().then(setBiometricAvailable);
    biometrics.getBiometricType().then(setBiometricType);
  }, []);

  const handleToggle = async (val: boolean) => {
    haptics.light();
    if (val) {
      if (!biometricAvailable) {
        Alert.alert(
          'Not Available',
          'Biometric authentication is not available on this device.',
        );
        return;
      }
      const success = await biometrics.authenticate('Enable biometric lock');
      if (success) {
        biometrics.setBiometricEnabled(true);
        updateSettings({ biometric_enabled: true });
      }
    } else {
      biometrics.setBiometricEnabled(false);
      updateSettings({ biometric_enabled: false });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Biometric lock</Text>
              <Text style={styles.rowDescription}>
                {biometricAvailable
                  ? `${biometricType === 'face' ? 'Face ID' : biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric'} authentication`
                  : 'Not available on this device'}
              </Text>
            </View>
            <Switch
              value={settings.biometric_enabled && biometricAvailable}
              onValueChange={handleToggle}
              disabled={!biometricAvailable}
              trackColor={{ false: Colors.light.surfaceVariant, true: Colors.light.primarySoft }}
              thumbColor={settings.biometric_enabled ? Colors.light.primary : Colors.light.textTertiary}
            />
          </View>
        </View>

        <Text style={styles.hint}>
          When enabled, Nudge will require biometric authentication when the app opens.
          This is an architectural foundation — full lock screen integration requires a development build.
        </Text>
      </View>
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
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  rowInfo: { flex: 1, gap: Spacing.xxs },
  rowLabel: { ...Typography.body, color: Colors.light.text },
  rowDescription: { ...Typography.secondary, color: Colors.light.textSecondary },
  hint: { ...Typography.secondary, color: Colors.light.textTertiary, marginTop: Spacing.xl, paddingHorizontal: Spacing.xs },
});
