/**
 * Nudge Otter SVG – the product character.
 *
 * A clean, recognizable otter rendered entirely in SVG primitives.
 * Emotional states are controlled via the `state` prop, which adjusts
 * eye shape, mouth curve, pupil direction, and posture subtly.
 *
 * Designed for react-native-svg. All coordinates are relative to a
 * 120×140 viewBox.
 */

import React from 'react';
import Svg, { G, Path, Circle, Ellipse, Line } from 'react-native-svg';

export type OtterState =
  | 'idle'
  | 'curious'
  | 'happy'
  | 'encouraging'
  | 'sleepy'
  | 'celebrating'
  | 'thinking'
  | 'surprised'
  | 'proud'
  | 'neutral'
  | 'disappointed';

interface OtterSvgProps {
  state?: OtterState;
  /** Optional accent color for cheeks / highlights */
  accentColor?: string;
}

/* ── Helper: eye component ─────────────────────────────────────────────── */

interface EyeProps {
  cx: number;
  cy: number;
  /** Pupil offset x */
  px?: number;
  /** Pupil offset y */
  py?: number;
  /** Eye open ratio (0 = closed, 1 = fully open) */
  open?: number;
  /** Whether the eye is a happy arc (for smile/celebrate) */
  happyArc?: boolean;
  /** Pupil radius */
  pupilR?: number;
}

const Eye: React.FC<EyeProps> = ({
  cx, cy, px = 0, py = 0, open = 1, happyArc = false, pupilR = 2.2,
}) => {
  if (open <= 0.05) {
    // closed / blink – a gentle arc
    return (
      <Path
        d={`M ${cx - 3.5} ${cy} Q ${cx} ${cy + 2.5} ${cx + 3.5} ${cy}`}
        fill="none"
        stroke="#2D2A26"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    );
  }

  if (happyArc) {
    // Upward arc for happy / celebrating
    return (
      <Path
        d={`M ${cx - 3.5} ${cy + 1} Q ${cx} ${cy - 3.5} ${cx + 3.5} ${cy + 1}`}
        fill="none"
        stroke="#2D2A26"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    );
  }

  const eyeH = 3.8 * open;
  return (
    <G>
      {/* Eye white (subtle warmth) */}
      <Ellipse cx={cx} cy={cy} rx={4} ry={eyeH} fill="#FAFAFA" />
      {/* Pupil */}
      <Circle cx={cx + px} cy={cy + py} r={pupilR} fill="#2D2A26" />
      {/* Tiny highlight */}
      <Circle cx={cx + px + 1} cy={cy + py - 0.8} r={0.7} fill="#fff" opacity={0.8} />
    </G>
  );
};

/* ── Helper: whisker set ───────────────────────────────────────────────── */

const Whiskers: React.FC<{ cx: number; cy: number; flip?: boolean }> = ({
  cx, cy, flip = false,
}) => {
  const dir = flip ? -1 : 1;
  return (
    <G opacity={0.35} stroke="#2D2A26" strokeWidth={0.7} strokeLinecap="round">
      <Line x1={cx} y1={cy - 2} x2={cx + dir * 14} y2={cy - 5} />
      <Line x1={cx} y1={cy} x2={cx + dir * 15} y2={cy} />
      <Line x1={cx} y1={cy + 2} x2={cx + dir * 14} y2={cy + 4.5} />
    </G>
  );
};

/* ── Mouth helper ──────────────────────────────────────────────────────── */

const Mouth: React.FC<{
  cx: number; cy: number;
  variant: 'neutral' | 'smile' | 'open-smile' | 'small-o' | 'worried' | 'grin';
}> = ({ cx, cy, variant }) => {
  const color = '#2D2A26';
  const sw = 1.3;

  switch (variant) {
    case 'smile':
      return (
        <Path
          d={`M ${cx - 5} ${cy} Q ${cx} ${cy + 5} ${cx + 5} ${cy}`}
          fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
        />
      );
    case 'open-smile':
      return (
        <G>
          <Path
            d={`M ${cx - 5.5} ${cy - 0.5} Q ${cx} ${cy + 6} ${cx + 5.5} ${cy - 0.5}`}
            fill="#8B6F5C" stroke={color} strokeWidth={sw} strokeLinecap="round"
          />
          {/* Tongue hint */}
          <Ellipse cx={cx} cy={cy + 3.5} rx={2.5} ry={1.5} fill="#C4907A" opacity={0.7} />
        </G>
      );
    case 'small-o':
      return (
        <Ellipse cx={cx} cy={cy + 1.5} rx={2.2} ry={2.8} fill="#8B6F5C" stroke={color} strokeWidth={sw * 0.8} />
      );
    case 'worried':
      return (
        <Path
          d={`M ${cx - 4} ${cy + 2} Q ${cx} ${cy - 0.5} ${cx + 4} ${cy + 2}`}
          fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
        />
      );
    case 'grin':
      return (
        <G>
          <Path
            d={`M ${cx - 6} ${cy} Q ${cx} ${cy + 7} ${cx + 6} ${cy}`}
            fill="#8B6F5C" stroke={color} strokeWidth={sw} strokeLinecap="round"
          />
          <Ellipse cx={cx} cy={cy + 4} rx={3} ry={1.8} fill="#C4907A" opacity={0.6} />
        </G>
      );
    case 'neutral':
    default:
      return (
        <Path
          d={`M ${cx - 3.5} ${cy + 1} L ${cx + 3.5} ${cy + 1}`}
          fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
        />
      );
  }
};

/* ── Main Otter Component ──────────────────────────────────────────────── */

export function OtterSvg({ state = 'idle', accentColor = '#F4A98C' }: OtterSvgProps) {
  const params = getStateParams(state);

  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 140">
      <G>
        {/* ── TAIL ─────────────────────────────────────── */}
        <Path
          d={params.tailPath}
          fill="#A0795B"
          stroke="#8B6A4E"
          strokeWidth={0.5}
        />

        {/* ── BODY ─────────────────────────────────────── */}
        <Ellipse
          cx={60}
          cy={98 + params.bodyOffsetY}
          rx={28}
          ry={36}
          fill="#B08968"
          stroke="#9A7756"
          strokeWidth={0.5}
        />

        {/* Belly patch */}
        <Ellipse
          cx={60}
          cy={102 + params.bodyOffsetY}
          rx={18}
          ry={24}
          fill="#D4B896"
        />

        {/* ── LEFT ARM (viewer's left = otter's right) ── */}
        <Path
          d={params.leftArmPath}
          fill="#B08968"
          stroke="#9A7756"
          strokeWidth={0.5}
        />
        {/* Paw pad */}
        <Ellipse cx={params.leftPawCx} cy={params.leftPawCy} rx={4.5} ry={3.5} fill="#8B6A4E" />

        {/* ── RIGHT ARM ────────────────────────────────── */}
        <Path
          d={params.rightArmPath}
          fill="#B08968"
          stroke="#9A7756"
          strokeWidth={0.5}
        />
        <Ellipse cx={params.rightPawCx} cy={params.rightPawCy} rx={4.5} ry={3.5} fill="#8B6A4E" />

        {/* ── FEET ─────────────────────────────────────── */}
        <Ellipse cx={47} cy={130} rx={7} ry={4} fill="#8B6A4E" />
        <Ellipse cx={73} cy={130} rx={7} ry={4} fill="#8B6A4E" />

        {/* ── HEAD ─────────────────────────────────────── */}
        <Ellipse
          cx={60}
          cy={55 + params.headOffsetY}
          rx={24}
          ry={21}
          fill="#B08968"
          stroke="#9A7756"
          strokeWidth={0.5}
        />

        {/* Face patch (lighter) */}
        <Ellipse
          cx={60}
          cy={58 + params.headOffsetY}
          rx={17}
          ry={14}
          fill="#D4B896"
        />

        {/* ── EARS ─────────────────────────────────────── */}
        {/* Small rounded ears – distinctive otter feature */}
        <Circle cx={38} cy={39 + params.headOffsetY} r={5.5} fill="#B08968" stroke="#9A7756" strokeWidth={0.5} />
        <Circle cx={38} cy={39 + params.headOffsetY} r={3} fill={accentColor} />

        <Circle cx={82} cy={39 + params.headOffsetY} r={5.5} fill="#B08968" stroke="#9A7756" strokeWidth={0.5} />
        <Circle cx={82} cy={39 + params.headOffsetY} r={3} fill={accentColor} />

        {/* ── NOSE / MUZZLE ────────────────────────────── */}
        {/* Broad otter nose */}
        <Ellipse
          cx={60}
          cy={54 + params.headOffsetY}
          rx={5.5}
          ry={3.8}
          fill="#2D2A26"
        />
        {/* Nose highlight */}
        <Ellipse
          cx={60}
          cy={52.5 + params.headOffsetY}
          rx={2}
          ry={1}
          fill="#5A5550"
          opacity={0.5}
        />

        {/* ── EYES ─────────────────────────────────────── */}
        <Eye
          cx={49}
          cy={49 + params.headOffsetY}
          px={params.eyePx}
          py={params.eyePy}
          open={params.eyeOpen}
          happyArc={params.happyArc}
          pupilR={params.pupilR}
        />
        <Eye
          cx={71}
          cy={49 + params.headOffsetY}
          px={params.eyePx}
          py={params.eyePy}
          open={params.eyeOpen}
          happyArc={params.happyArc}
          pupilR={params.pupilR}
        />

        {/* Eyebrows (expressive) */}
        {params.showEyebrows && (
          <G>
            <Path
              d={`M ${46} ${42 + params.headOffsetY - params.browLift} Q ${49} ${39 + params.headOffsetY - params.browLift} ${52} ${42 + params.headOffsetY - params.browLift}`}
              fill="none" stroke="#8B6A4E" strokeWidth={1} strokeLinecap="round"
            />
            <Path
              d={`M ${68} ${42 + params.headOffsetY - params.browLift} Q ${71} ${39 + params.headOffsetY - params.browLift} ${74} ${42 + params.headOffsetY - params.browLift}`}
              fill="none" stroke="#8B6A4E" strokeWidth={1} strokeLinecap="round"
            />
          </G>
        )}

        {/* ── WHISKERS ─────────────────────────────────── */}
        <Whiskers cx={42} cy={56 + params.headOffsetY} />
        <Whiskers cx={78} cy={56 + params.headOffsetY} flip />

        {/* ── MOUTH ────────────────────────────────────── */}
        <Mouth cx={60} cy={59 + params.headOffsetY} variant={params.mouthVariant} />

        {/* ── CHEEK BLUSH (optional) ────────────────────── */}
        {params.showBlush && (
          <G>
            <Ellipse cx={42} cy={55 + params.headOffsetY} rx={4} ry={2.5} fill={accentColor} opacity={0.35} />
            <Ellipse cx={78} cy={55 + params.headOffsetY} rx={4} ry={2.5} fill={accentColor} opacity={0.35} />
          </G>
        )}

        {/* ── SLEEPY Zs ────────────────────────────────── */}
        {state === 'sleepy' && (
          <G>
            <Path
              d={`M 80 ${35} L 86 ${35} L 80 ${41} L 86 ${41}`}
              fill="none" stroke="#9AA0A6" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round"
            />
            <Path
              d={`M 88 ${26} L 94 ${26} L 88 ${32} L 94 ${32}`}
              fill="none" stroke="#9AA0A6" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round"
              opacity={0.6}
            />
          </G>
        )}

        {/* ── THINKING DOTS ────────────────────────────── */}
        {state === 'thinking' && (
          <G>
            <Circle cx={85} cy={38} r={1.8} fill="#9AA0A6" />
            <Circle cx={91} cy={31} r={2.2} fill="#9AA0A6" />
            <Circle cx={95} cy={23} r={2.6} fill="#9AA0A6" />
          </G>
        )}
      </G>
    </Svg>
  );
}



/* ── State → Visual Parameters ────────────────────────────────────────── */

interface StateParams {
  headOffsetY: number;
  bodyOffsetY: number;
  eyePx: number;
  eyePy: number;
  eyeOpen: number;
  happyArc: boolean;
  pupilR: number;
  mouthVariant: 'neutral' | 'smile' | 'open-smile' | 'small-o' | 'worried' | 'grin';
  showEyebrows: boolean;
  browLift: number;
  showBlush: boolean;
  tailPath: string;
  leftArmPath: string;
  rightArmPath: string;
  leftPawCx: number;
  leftPawCy: number;
  rightPawCx: number;
  rightPawCy: number;
}

function getStateParams(state: OtterState): StateParams {
  const base: StateParams = {
    headOffsetY: 0,
    bodyOffsetY: 0,
    eyePx: 0,
    eyePy: 0,
    eyeOpen: 1,
    happyArc: false,
    pupilR: 2.2,
    mouthVariant: 'neutral',
    showEyebrows: false,
    browLift: 0,
    showBlush: false,
    tailPath: 'M 85 115 Q 105 110 110 95 Q 115 80 100 78 Q 90 77 88 90 Q 86 100 85 115',
    leftArmPath: 'M 38 82 Q 28 88 25 98 Q 23 104 28 106 Q 32 107 36 100 Q 38 94 40 88',
    rightArmPath: 'M 82 82 Q 92 88 95 98 Q 97 104 92 106 Q 88 107 84 100 Q 82 94 80 88',
    leftPawCx: 28,
    leftPawCy: 104,
    rightPawCx: 92,
    rightPawCy: 104,
  };

  switch (state) {
    case 'idle':
      return {
        ...base,
        mouthVariant: 'neutral',
        tailPath: 'M 85 115 Q 105 112 110 98 Q 114 85 102 82 Q 92 80 88 92 Q 86 102 85 115',
      };

    case 'curious':
      return {
        ...base,
        headOffsetY: -2,
        eyePx: 1.5,
        eyePy: -0.5,
        pupilR: 2.5,
        mouthVariant: 'small-o',
        showEyebrows: true,
        browLift: 2,
        // Head slightly tilted
        tailPath: 'M 85 115 Q 102 112 108 98 Q 112 84 100 80 Q 90 78 88 90 Q 86 102 85 115',
      };

    case 'happy':
      return {
        ...base,
        happyArc: true,
        mouthVariant: 'smile',
        showBlush: true,
        showEyebrows: true,
        browLift: 1.5,
        tailPath: 'M 85 115 Q 104 108 112 95 Q 116 82 104 80 Q 92 78 88 92 Q 86 104 85 115',
      };

    case 'encouraging':
      return {
        ...base,
        headOffsetY: -1,
        happyArc: true,
        mouthVariant: 'smile',
        showEyebrows: true,
        browLift: 1,
        showBlush: true,
        // One arm raised (waving)
        rightArmPath: 'M 82 82 Q 96 72 100 60 Q 102 54 98 52 Q 94 50 90 56 Q 86 66 82 76',
        rightPawCx: 98,
        rightPawCy: 53,
      };

    case 'sleepy':
      return {
        ...base,
        headOffsetY: 2,
        bodyOffsetY: 2,
        eyeOpen: 0.15,
        mouthVariant: 'neutral',
        tailPath: 'M 85 115 Q 100 114 106 102 Q 110 90 100 88 Q 92 86 88 96 Q 86 106 85 115',
        leftArmPath: 'M 38 84 Q 30 90 28 100 Q 26 106 30 108 Q 34 109 38 102 Q 40 96 40 90',
        rightArmPath: 'M 82 84 Q 90 90 92 100 Q 94 106 90 108 Q 86 109 82 102 Q 80 96 80 90',
      };

    case 'celebrating':
      return {
        ...base,
        headOffsetY: -4,
        bodyOffsetY: -2,
        happyArc: true,
        mouthVariant: 'grin',
        showBlush: true,
        showEyebrows: true,
        browLift: 3,
        // Both arms up
        leftArmPath: 'M 38 80 Q 24 68 20 56 Q 18 50 22 48 Q 26 46 30 54 Q 34 64 38 74',
        rightArmPath: 'M 82 80 Q 96 68 100 56 Q 102 50 98 48 Q 94 46 90 54 Q 86 64 82 74',
        leftPawCx: 22,
        leftPawCy: 49,
        rightPawCx: 98,
        rightPawCy: 49,
        tailPath: 'M 85 112 Q 100 104 110 92 Q 116 80 106 76 Q 94 74 88 88 Q 86 100 85 112',
      };

    case 'thinking':
      return {
        ...base,
        headOffsetY: -1,
        eyePx: 2,
        eyePy: -1,
        pupilR: 2.2,
        mouthVariant: 'neutral',
        showEyebrows: true,
        browLift: 2,
        // One paw near chin
        leftArmPath: 'M 38 82 Q 32 78 36 70 Q 38 66 42 68 Q 46 70 44 76 Q 42 80 40 84',
        leftPawCx: 40,
        leftPawCy: 68,
      };

    case 'surprised':
      return {
        ...base,
        headOffsetY: -3,
        eyePx: 0,
        eyePy: 0,
        eyeOpen: 1.2,
        pupilR: 1.8,
        mouthVariant: 'small-o',
        showEyebrows: true,
        browLift: 4,
      };

    case 'proud':
      return {
        ...base,
        headOffsetY: -2,
        happyArc: true,
        mouthVariant: 'smile',
        showEyebrows: true,
        browLift: 1,
        showBlush: true,
        tailPath: 'M 85 115 Q 106 108 114 92 Q 118 78 106 76 Q 94 74 88 90 Q 86 104 85 115',
      };

    case 'neutral':
      return {
        ...base,
        mouthVariant: 'neutral',
      };

    case 'disappointed':
      return {
        ...base,
        headOffsetY: 1,
        eyeOpen: 0.7,
        eyePy: 0.5,
        mouthVariant: 'worried',
        showEyebrows: true,
        browLift: -1,
        tailPath: 'M 85 116 Q 98 118 104 108 Q 108 98 100 96 Q 92 94 88 104 Q 86 112 85 116',
      };
  }
}

export default OtterSvg;
