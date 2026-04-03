import luckyColorsJson from "../config/lucky-colors.json";
import type { DailyLuckyColorRecord, LuckyColorItem, LuckyColorsConfig } from "../types/color";
import { validateLuckyColorsConfig } from "./configValidator";

const LUCKY_COLORS_CONFIG: LuckyColorsConfig = validateLuckyColorsConfig(luckyColorsJson);

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function getLuckyColorConfig(): LuckyColorsConfig {
  return LUCKY_COLORS_CONFIG;
}

export function getLuckyColors(): LuckyColorItem[] {
  return LUCKY_COLORS_CONFIG.colors;
}

export function getDefaultEyeSoftness(): number {
  return LUCKY_COLORS_CONFIG.defaultEyeSoftness;
}

export function getLuckyColorById(colorId: string): LuckyColorItem | undefined {
  return LUCKY_COLORS_CONFIG.colors.find((item) => item.colorId === colorId);
}

export function getLuckyColorsByCategory(category: string): LuckyColorItem[] {
  return LUCKY_COLORS_CONFIG.colors.filter((item) => item.category === category);
}

export function drawDailyLuckyColor(dayKey: string, userId: string, offset = 0): LuckyColorItem {
  const seed = `${dayKey}-${userId}-${offset}`;
  const index = hashSeed(seed) % LUCKY_COLORS_CONFIG.colors.length;
  return LUCKY_COLORS_CONFIG.colors[index] ?? LUCKY_COLORS_CONFIG.colors[0];
}

export function buildDailyLuckyColorRecord(dayKey: string, userId: string, drawnAt: string): DailyLuckyColorRecord {
  const color = drawDailyLuckyColor(dayKey, userId);
  return {
    dayKey,
    colorId: color.colorId,
    colorName: color.colorName,
    hex: color.hex,
    softHex: color.softHex,
    glowHex: color.glowHex,
    category: color.category,
    drawnAt
  };
}
