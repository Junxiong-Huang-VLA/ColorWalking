import expressionMapJson from "../config/expression-map.json";
import type { LuckyColorItem } from "../types/color";
import type { EmotionState, ExpressionMapConfig, VisualStateOutput } from "../types/emotion";
import { validateExpressionMapConfig } from "./configValidator";

const EXPRESSION_MAP_CONFIG: ExpressionMapConfig = validateExpressionMapConfig(expressionMapJson);

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function toHex(value: number): string {
  return Math.round(value).toString(16).padStart(2, "0");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return { r: 207, g: 221, b: 248 };
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(Math.min(255, Math.max(0, r)))}${toHex(Math.min(255, Math.max(0, g)))}${toHex(Math.min(255, Math.max(0, b)))}`;
}

function blendHex(baseHex: string, overlayHex: string, weight: number): string {
  const base = hexToRgb(baseHex);
  const overlay = hexToRgb(overlayHex);
  const w = clamp(weight, 0, 1);
  return rgbToHex(
    base.r * (1 - w) + overlay.r * w,
    base.g * (1 - w) + overlay.g * w,
    base.b * (1 - w) + overlay.b * w
  );
}

function pickStatusText(list: string[], seed: string | number): string {
  if (!list.length) return "不着急，我在这里。";
  const asNumber = typeof seed === "number" ? seed : seed.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return list[Math.abs(asNumber) % list.length] ?? list[0];
}

export function getExpressionMapConfig(): ExpressionMapConfig {
  return EXPRESSION_MAP_CONFIG;
}

export function deriveVisualFromEmotion(params: {
  emotionState: EmotionState;
  luckyColor: Pick<LuckyColorItem, "softHex" | "hex">;
  seed?: string | number;
}): VisualStateOutput {
  const preset = EXPRESSION_MAP_CONFIG.emotionVisualMap[params.emotionState.emotion];
  const baseEyeHex = params.luckyColor.softHex || params.luckyColor.hex;
  const dynamicWeight = clamp(preset.eyeColorBlend.weight + (params.emotionState.emotionLevel - 50) * 0.0015, 0.02, 0.25);
  return {
    eyeState: preset.eyeState,
    eyeColorHex: blendHex(baseEyeHex, preset.eyeColorBlend.hex, dynamicWeight),
    expression: preset.expression,
    motionTemplate: preset.motionTemplate,
    voiceStyle: preset.voiceStyle,
    statusText: pickStatusText(preset.statusText, params.seed ?? params.emotionState.updatedAt)
  };
}
