/**
 * Nudge Mascot Component
 *
 * A reusable, animated otter mascot that serves as the product character.
 * Supports multiple sizes, emotional states, idle animations, and
 * contextual reactions.
 *
 * The mascot is VISIBLE BY DEFAULT. Animations are purely additive.
 */

import React, { useEffect, useRef } from 'react';
import { View, AccessibilityInfo, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { OtterSvg, type OtterState } from './OtterSvg';

/* ── Types ─────────────────────────────────────────────────────────────── */

export type MascotSize = 'tiny' | 'small' | 'medium' | 'large' | 'hero';

export type MascotContext =
  | 'habit-complete'
  | 'full-day-complete'
  | 'empty-state'
  | 'idle-home'
  | 'calendar'
  | 'analytics'
  | 'settings'
  | 'onboarding'
  | 'error'
  | 'general';

interface MascotProps {
  state?: OtterState;
  size?: MascotSize;
  context?: MascotContext;
  animate?: boolean;
  accessibilityLabel?: string | null;
  style?: ViewStyle;
  onAnimationComplete?: () => void;
}

/* ── Size mapping ──────────────────────────────────────────────────────── */

const SIZE_MAP: Record<MascotSize, { width: number; height: number }> = {
  tiny:   { width: 52, height: 60 },
  small:  { width: 74, height: 86 },
  medium: { width: 102, height: 120 },
  large:  { width: 140, height: 164 },
  hero:   { width: 180, height: 210 },
};

/* ── Accessibility labels per state ────────────────────────────────────── */

const STATE_LABELS: Partial<Record<OtterState, string>> = {
  happy: 'Otter looks happy',
  celebrating: 'Otter is celebrating',
  encouraging: 'Otter is encouraging you',
  curious: 'Otter looks curious',
  thinking: 'Otter is thinking',
  sleepy: 'Otter looks sleepy',
  surprised: 'Otter looks surprised',
  proud: 'Otter looks proud',
  disappointed: 'Otter is being supportive',
  neutral: 'Otter',
};

/* ── Idle animation (breathing + sway) ─────────────────────────────────── */

function useIdleAnimations(scaleY: SharedValue<number>, rotateZ: SharedValue<number>, animate: boolean, state: OtterState) {
  const isActive = animate && ['idle', 'neutral', 'curious', 'thinking', 'sleepy', 'disappointed'].includes(state);

  useEffect(() => {
    if (!isActive) return;

    // Breathing
    scaleY.value = withSpring(1.015, { damping: 14, stiffness: 40, mass: 1.2 });
    const breathInterval = setInterval(() => {
      scaleY.value = withSequence(
        withTiming(1.015, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      );
    }, 0);

    // Gentle sway (skip for sleepy)
    if (state !== 'sleepy') {
      rotateZ.value = withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      );
    }

    return () => {
      clearInterval(breathInterval);
      scaleY.value = withTiming(1, { duration: 300 });
      rotateZ.value = withTiming(0, { duration: 300 });
    };
  }, [isActive, state]);
}

/* ── Component ─────────────────────────────────────────────────────────── */

export function Mascot({
  state = 'idle',
  size = 'medium',
  context = 'general',
  animate = true,
  accessibilityLabel,
  style,
  onAnimationComplete,
}: MascotProps) {
  const { width, height } = SIZE_MAP[size];

  // Animated values – START VISIBLE (no fade-in that might not fire)
  const scaleY = useSharedValue(1);
  const scaleX = useSharedValue(1);
  const rotateZ = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Track previous state for reaction detection
  const prevStateRef = useRef<OtterState>(state);
  const hasReacted = useRef(false);

  // ── Animated style ────────────────────────────────────────
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scaleY: scaleY.value },
      { scaleX: scaleX.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
  }));

  // ── Idle animations ───────────────────────────────────────
  useIdleAnimations(scaleY, rotateZ, animate, state);

  // ── Reaction animations (on state change) ─────────────────
  useEffect(() => {
    if (!hasReacted.current) {
      hasReacted.current = true;
      prevStateRef.current = state;
      return;
    }
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (prev === state) return;

    if (state === 'happy' || state === 'encouraging') {
      translateY.value = withSequence(
        withSpring(-6, { damping: 10, stiffness: 180, mass: 0.6 }),
        withSpring(0, { damping: 12, stiffness: 100 }),
      );
      scaleY.value = withSequence(
        withSpring(0.94, { damping: 10, stiffness: 180 }),
        withSpring(1, { damping: 12, stiffness: 100 }),
      );
      onAnimationComplete?.();
    }

    if (state === 'celebrating') {
      translateY.value = withSequence(
        withSpring(-14, { damping: 8, stiffness: 150, mass: 0.5 }),
        withSpring(0, { damping: 12, stiffness: 100 }),
      );
      scaleY.value = withSequence(
        withSpring(0.88, { damping: 10, stiffness: 180 }),
        withSpring(1.06, { damping: 10, stiffness: 180 }),
        withSpring(1, { damping: 14, stiffness: 80 }),
      );
      rotateZ.value = withSequence(
        withTiming(5, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(-5, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(3, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(-2, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) }),
      );
      onAnimationComplete?.();
    }

    if (state === 'proud' || state === 'curious') {
      translateY.value = withSequence(
        withSpring(-3, { damping: 12, stiffness: 120 }),
        withSpring(0, { damping: 14, stiffness: 80 }),
      );
      scaleX.value = withSequence(
        withSpring(1.03, { damping: 14, stiffness: 80 }),
        withSpring(1, { damping: 14, stiffness: 80 }),
      );
    }
  }, [state]);

  // ── Reduce motion ─────────────────────────────────────────
  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduced) => {
      if (reduced) {
        scaleY.value = 1;
        scaleX.value = 1;
        rotateZ.value = 0;
        translateY.value = 0;
      }
    });
    return () => sub.remove();
  }, []);

  // ── Accessibility ─────────────────────────────────────────
  const label = accessibilityLabel === null
    ? undefined
    : accessibilityLabel ?? STATE_LABELS[state];

  return (
    <Animated.View
      style={[{ width, height }, animatedStyle, style]}
      accessible={Boolean(label)}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
    >
      <OtterSvg state={state} />
    </Animated.View>
  );
}

/* ── Preset compositions ───────────────────────────────────────────────── */

export function TinyOtter(props: Omit<MascotProps, 'size'>) {
  return <Mascot {...props} size="tiny" accessibilityLabel={null} />;
}

export function SmallOtter(props: Omit<MascotProps, 'size'>) {
  return <Mascot {...props} size="small" />;
}

export function MediumOtter(props: Omit<MascotProps, 'size'>) {
  return <Mascot {...props} size="medium" />;
}

export function LargeOtter(props: Omit<MascotProps, 'size'>) {
  return <Mascot {...props} size="large" />;
}

export function HeroOtter(props: Omit<MascotProps, 'size'>) {
  return <Mascot {...props} size="hero" />;
}
