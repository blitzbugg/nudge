import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Layout } from '@/constants/theme';
import { Divider } from '@/components/ui/Divider';
import { useAppStore } from '@/stores/appStore';
import * as haptics from '@/services/haptics';

const THEMES = [
  { value: 'light' as const, label: 'Light', icon: 'sunny-outline' as const },
  { value: 'system' as const, label: 'System', icon: 'phone-portrait-outline' as const },
  { value: 'dark' as const, label: 'Dark', icon: 'moon-outline' as const },
];

export default function AppearanceScreen() {
  const { settings, updateSettings } = useAppStore();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>THEME</Text>
        <View style={styles.card}>
          {THEMES.map(({ value, label, icon }, i) => (
            <React.Fragment key={value}>
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => { haptics.selection(); updateSettings({ theme: value }); }}
              >
                <Ionicons name={icon} size={22} color={Colors.light.textSecondary} />
                <Text style={styles.rowLabel}>{label}</Text>
                {settings.theme === value && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.light.primary} />
                )}
              </Pressable>
              {i < THEMES.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </View>
        {settings.theme === 'dark' && (
          <Text style={styles.hint}>Dark theme is being prepared and will be available in a future update.</Text>
        )}
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
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  rowPressed: { backgroundColor: Colors.light.surfaceVariant },
  rowLabel: { ...Typography.body, color: Colors.light.text, flex: 1 },
  hint: { ...Typography.secondary, color: Colors.light.textTertiary, marginTop: Spacing.md, paddingHorizontal: Spacing.xs },
});
