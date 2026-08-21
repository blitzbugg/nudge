import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text, Pressable } from 'react-native';
import { useAppStore } from '@/stores/appStore';
import { getDatabase } from '@/database/connection';
import { Colors } from '@/constants/theme';
import * as haptics from '@/services/haptics';
import * as biometrics from '@/services/biometrics';

export default function RootLayout() {
  const setHydrated = useAppStore((s) => s.setHydrated);
  const settings = useAppStore((s) => s.settings);
  const [locked, setLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);
  const [preferencesReady, setPreferencesReady] = useState(() => useAppStore.persist.hasHydrated());
  const lockChecked = useRef(false);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        setHydrated(true);
      } catch {
        setHydrated(true);
      }
    }
    init();
  }, [setHydrated]);

  useEffect(() => {
    if (preferencesReady) return;
    return useAppStore.persist.onFinishHydration(() => setPreferencesReady(true));
  }, [preferencesReady]);

  useEffect(() => {
    haptics.setHapticsEnabled(settings.haptics_enabled);
    biometrics.setBiometricEnabled(settings.biometric_enabled);
  }, [settings]);

  // Authenticate once after persisted preferences load—not whenever Haptics,
  // reminders, or any other setting changes.
  useEffect(() => {
    if (!preferencesReady || lockChecked.current) return;
    lockChecked.current = true;
    async function checkLock() {
      if (settings.biometric_enabled) {
        setLocked(!(await biometrics.authenticate()));
      }
      setCheckingLock(false);
    }
    checkLock();
  }, [preferencesReady, settings.biometric_enabled]);

  if (checkingLock) {
    return <View style={styles.lock}><ActivityIndicator color={Colors.light.primary} /></View>;
  }

  if (locked) {
    return <View style={styles.lock}>
      <Text style={styles.lockTitle}>Nudge is locked</Text>
      <Pressable style={styles.unlockButton} onPress={async () => setLocked(!(await biometrics.authenticate()))}>
        <Text style={styles.unlockText}>Unlock</Text>
      </Pressable>
    </View>;
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.light.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="habits/create"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'New Habit',
            headerTintColor: Colors.light.primary,
            headerTitleStyle: { color: Colors.light.text },
          }}
        />
        <Stack.Screen
          name="habits/[id]"
          options={{
            headerShown: true,
            title: 'Habit',
            headerTintColor: Colors.light.primary,
            headerTitleStyle: { color: Colors.light.text },
          }}
        />
        <Stack.Screen
          name="habits/edit"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Edit Habit',
            headerTintColor: Colors.light.primary,
            headerTitleStyle: { color: Colors.light.text },
          }}
        />
        <Stack.Screen
          name="settings/appearance"
          options={{
            headerShown: true,
            title: 'Appearance',
            headerTintColor: Colors.light.primary,
            headerTitleStyle: { color: Colors.light.text },
          }}
        />
        <Stack.Screen
          name="settings/notifications"
          options={{
            headerShown: true,
            title: 'Notifications',
            headerTintColor: Colors.light.primary,
            headerTitleStyle: { color: Colors.light.text },
          }}
        />
        <Stack.Screen
          name="settings/security"
          options={{
            headerShown: true,
            title: 'Security',
            headerTintColor: Colors.light.primary,
            headerTitleStyle: { color: Colors.light.text },
          }}
        />
        <Stack.Screen
          name="settings/backup"
          options={{
            headerShown: true,
            title: 'Backup & Restore',
            headerTintColor: Colors.light.primary,
            headerTitleStyle: { color: Colors.light.text },
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  lock: { flex: 1, backgroundColor: Colors.light.background, alignItems: 'center', justifyContent: 'center', gap: 16 },
  lockTitle: { color: Colors.light.text, fontSize: 20, fontWeight: '600' },
  unlockButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.light.primary },
  unlockText: { color: '#fff', fontWeight: '600' },
});
