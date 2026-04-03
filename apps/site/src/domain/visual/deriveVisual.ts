/**
 * @deprecated 已由 `src/lib/expressionEngine.ts` 接管主链视觉映射。
 * 保留仅用于历史回溯，不应继续引用。
 */
import type { DailyColorState, SheepEmotionState, SheepVisualState } from "../../state/types";
import { hexToRgb, rgbToHex } from "../../utils/color";

type EmotionVisualPreset = {
  eyeState: SheepVisualState["eyeState"];
  expression: SheepVisualState["expression"];
  motionTemplate: SheepVisualState["motionTemplate"];
  voiceStyle: SheepVisualState["voiceStyle"];
  statusText: string;
  tint: { r: number; g: number; b: number };
};

const VISUAL_PRESET: Record<SheepEmotionState["emotion"], EmotionVisualPreset> = {
  calm: {
    eyeState: "open",
    expression: "idle",
    motionTemplate: "idle_breathe",
    voiceStyle: "soft",
    statusText: "慢一点也没关系。",
    tint: { r: 0, g: 6, b: 10 }
  },
  soft: {
    eyeState: "half_closed",
    expression: "blink",
    motionTemplate: "nuzzle",
    voiceStyle: "soft",
    statusText: "这份颜色是送给今天的你。",
    tint: { r: 8, g: 4, b: 12 }
  },
  happy: {
    eyeState: "open",
    expression: "smile",
    motionTemplate: "tiny_hop",
    voiceStyle: "light_bright",
    statusText: "今天有一点轻轻的开心。",
    tint: { r: 14, g: 10, b: 2 }
  },
  sleepy: {
    eyeState: "closed",
    expression: "rest",
    motionTemplate: "rest_pose",
    voiceStyle: "whisper",
    statusText: "困一点也没关系，我在。",
    tint: { r: -8, g: -4, b: -2 }
  },
  shy: {
    eyeState: "half_closed",
    expression: "blink",
    motionTemplate: "nuzzle",
    voiceStyle: "whisper",
    statusText: "不着急，我会轻轻陪你。",
    tint: { r: 8, g: 0, b: 16 }
  },
  sad: {
    eyeState: "half_closed",
    expression: "rest",
    motionTemplate: "idle_breathe",
    voiceStyle: "whisper",
    statusText: "今天先对自己温柔一点。",
    tint: { r: -6, g: 2, b: 10 }
  }
};

function clampColor(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function tintHex(hex: string, tint: EmotionVisualPreset["tint"], factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    clampColor(r + tint.r * factor),
    clampColor(g + tint.g * factor),
    clampColor(b + tint.b * factor)
  );
}

export function deriveSheepVisualState(
  current: SheepVisualState,
  dailyColorState: DailyColorState,
  emotionState: SheepEmotionState
): SheepVisualState {
  const preset = VISUAL_PRESET[emotionState.emotion];
  const intensity = Math.max(0.35, Math.min(1, emotionState.emotionLevel / 100));
  const eyeBaseHex = dailyColorState.softHex || current.eyeColorHex;
  return {
    eyeState: preset.eyeState,
    eyeColorHex: tintHex(eyeBaseHex, preset.tint, intensity),
    scarfColorHex: dailyColorState.colorHex || current.scarfColorHex,
    expression: preset.expression,
    motionTemplate: preset.motionTemplate,
    voiceStyle: preset.voiceStyle,
    statusText: preset.statusText
  };
}
