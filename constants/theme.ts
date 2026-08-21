/**
 * Nudge Design System - Color Tokens
 *
 * Light theme is primary. Dark theme architecture prepared for future enablement.
 * Follows Google-inspired minimal design with restrained accent usage.
 */

import { Platform } from 'react-native';

// ─── Light Theme Colors ──────────────────────────────────────────────────────
const light = {
  // Backgrounds & surfaces
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F4F4F5',

  // Text hierarchy
  text: '#202124',
  textSecondary: '#5F6368',
  textTertiary: '#9AA0A6',

  // Borders
  border: '#E8EAED',

  // Primary brand
  primary: '#5B5CE2',
  primaryDark: '#4B4CC7',
  primarySoft: '#EEF0FF',

  // Semantic colors
  success: '#1E8E3E',
  successSoft: '#E6F4EA',
  warning: '#F9AB00',
  warningSoft: '#FEF7E0',
  error: '#D93025',
  errorSoft: '#FCE8E6',
  info: '#1A73E8',
  infoSoft: '#E8F0FE',

  // Streak
  streak: '#F29900',

  // Tab bar
  tint: '#5B5CE2',
  tabIconDefault: '#9AA0A6',
  tabIconSelected: '#5B5CE2',

  // Overlay
  overlay: 'rgba(0,0,0,0.4)',
} as const;

// ─── Dark Theme Colors (prepared, not active) ────────────────────────────────
const dark = {
  background: '#0B0B0F',
  surface: '#141419',
  surfaceVariant: '#1C1C22',

  text: '#F5F5F7',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',

  border: '#27272A',

  primary: '#7C7DF0',
  primaryDark: '#6667D9',
  primarySoft: '#20204A',

  success: '#81C995',
  successSoft: '#1A2E1A',
  warning: '#FDD663',
  warningSoft: '#2E2A1A',
  error: '#F28B82',
  errorSoft: '#2E1A1A',
  info: '#8AB4F8',
  infoSoft: '#1A1E2E',

  streak: '#F6AD55',

  tint: '#7C7DF0',
  tabIconDefault: '#71717A',
  tabIconSelected: '#7C7DF0',

  overlay: 'rgba(0,0,0,0.6)',
} as const;

export const Colors = { light, dark };

// ─── Habit Accent Colors ─────────────────────────────────────────────────────
export const HabitColors = {
  Indigo: '#5B5CE2',
  Blue: '#3B82F6',
  Cyan: '#06B6D4',
  Teal: '#14B8A6',
  Green: '#22C55E',
  Lime: '#84CC16',
  Amber: '#F59E0B',
  Orange: '#F97316',
  Rose: '#F43F5E',
  Pink: '#EC4899',
  Purple: '#8B5CF6',
  Slate: '#64748B',
} as const;

export const HABIT_COLOR_NAMES = Object.keys(HabitColors) as Array<
  keyof typeof HabitColors
>;

// ─── Heatmap Colors ──────────────────────────────────────────────────────────
export const HeatmapColors = {
  noActivity: '#F4F4F5',
  veryLow: '#E0E7FF',
  low: '#A5B4FC',
  medium: '#818CF8',
  high: '#6366F1',
  maximum: '#4B4CC7',
} as const;

export const HEATMAP_LEVELS = [
  HeatmapColors.noActivity,
  HeatmapColors.veryLow,
  HeatmapColors.low,
  HeatmapColors.medium,
  HeatmapColors.high,
  HeatmapColors.maximum,
];

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────
export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  extra: 24,
  pill: 999,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
export const Typography = {
  display: { fontSize: 34, fontWeight: '700' as const, lineHeight: 40 },
  largeHeading: { fontSize: 24, fontWeight: '600' as const, lineHeight: 30 },
  section: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, lineHeight: 22 },
  secondary: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  secondaryMedium: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  captionMedium: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
} as const;

// ─── Platform Font Family ────────────────────────────────────────────────────
export const FontFamily = Platform.select({
  ios: 'system',
  android: 'Roboto',
  default: 'system',
  web: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
});

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

// ─── Layout Constants ────────────────────────────────────────────────────────
export const Layout = {
  screenPaddingHorizontal: Spacing.lg,
  sectionGap: Spacing.xxl,
  itemGap: Spacing.sm,
  touchTarget: 44,
  listHeight: 64,
  headerHeight: 56,
  tabBarHeight: 60,
} as const;
