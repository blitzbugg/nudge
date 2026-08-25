/**
 * Nudge Mascot Animation Presets
 *
 * Reusable animation configurations for the otter mascot.
 * All animations are designed to run on the UI thread via Reanimated.
 */

import {
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  type SharedValue,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

/* ── Spring configs ────────────────────────────────────────────────────── */

const GENTLE_SPRING: WithSpringConfig = {
  damping: 12,
  stiffness: 100,
  mass: 0.8,
};

const BOUNCY_SPRING: WithSpringConfig = {
  damping: 10,
  stiffness: 180,
  mass: 0.6,
};

const SUBTLE_SPRING: WithSpringConfig = {
  damping: 14,
  stiffness: 80,
  mass: 1,
};

const CELEBRATION_SPRING: WithSpringConfig = {
  damping: 8,
  stiffness: 150,
  mass: 0.5,
};

/* ── Idle: breathing ───────────────────────────────────────────────────── */

/**
 * Continuous gentle breathing animation for the mascot.
 * Oscillates scale Y between 0.98 and 1.02 with a slow rhythm.
 */
export function startBreathing(
  scaleY: SharedValue<number>,
  enabled: boolean = true,
) {
  if (!enabled) {
    scaleY.value = 1;
    return;
  }
  scaleY.value = withRepeat(
    withSequence(
      withTiming(1.015, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
    ),
    -1, // infinite
    false,
  );
}

/* ── Idle: subtle sway ─────────────────────────────────────────────────── */

export function startSway(
  rotateZ: SharedValue<number>,
  enabled: boolean = true,
) {
  if (!enabled) {
    rotateZ.value = 0;
    return;
  }
  rotateZ.value = withRepeat(
    withSequence(
      withTiming(1.2, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-1.2, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
    ),
    -1,
    false,
  );
}

/* ── Reaction: happy bounce ────────────────────────────────────────────── */

export function mascotHappyBounce(
  scaleY: SharedValue<number>,
  translateY: SharedValue<number>,
) {
  translateY.value = withSpring(-8, BOUNCY_SPRING, () => {
    translateY.value = withSpring(0, GENTLE_SPRING);
  });
  scaleY.value = withSequence(
    withSpring(0.93, BOUNCY_SPRING),
    withSpring(1, GENTLE_SPRING),
  );
}

/* ── Reaction: celebrate ───────────────────────────────────────────────── */

export function mascotCelebrate(
  scaleY: SharedValue<number>,
  translateY: SharedValue<number>,
  rotateZ: SharedValue<number>,
) {
  // Jump up
  translateY.value = withSpring(-18, CELEBRATION_SPRING, () => {
    translateY.value = withSpring(0, GENTLE_SPRING);
  });
  // Squash & stretch
  scaleY.value = withSequence(
    withSpring(0.88, BOUNCY_SPRING),
    withSpring(1.08, BOUNCY_SPRING),
    withSpring(1, SUBTLE_SPRING),
  );
  // Little wiggle
  rotateZ.value = withSequence(
    withTiming(6, { duration: 120, easing: Easing.out(Easing.quad) }),
    withTiming(-6, { duration: 120, easing: Easing.out(Easing.quad) }),
    withTiming(4, { duration: 100, easing: Easing.out(Easing.quad) }),
    withTiming(-2, { duration: 100, easing: Easing.out(Easing.quad) }),
    withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) }),
  );
}

/* ── Reaction: subtle nudge / completion ───────────────────────────────── */

export function mascotNudgeReaction(
  translateY: SharedValue<number>,
  scaleX: SharedValue<number>,
) {
  // Small tilt
  translateY.value = withSequence(
    withSpring(-4, BOUNCY_SPRING),
    withSpring(0, SUBTLE_SPRING),
  );
  scaleX.value = withSequence(
    withSpring(1.04, SUBTLE_SPRING),
    withSpring(1, SUBTLE_SPRING),
  );
}

/* ── Appear / Disappear ────────────────────────────────────────────────── */

export function mascotAppear(
  opacity: SharedValue<number>,
  translateY: SharedValue<number>,
  scaleY: SharedValue<number>,
) {
  opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
  translateY.value = withSpring(0, GENTLE_SPRING);
  scaleY.value = withSpring(1, SUBTLE_SPRING);
}

export function mascotDisappear(
  opacity: SharedValue<number>,
  translateY: SharedValue<number>,
) {
  opacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) });
  translateY.value = withTiming(10, { duration: 300, easing: Easing.in(Easing.quad) });
}

/* ── Idle entrance ─────────────────────────────────────────────────────── */

export function mascotIdleEntrance(
  opacity: SharedValue<number>,
  translateY: SharedValue<number>,
) {
  opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
  translateY.value = withDelay(
    200,
    withSpring(0, GENTLE_SPRING),
  );
}
