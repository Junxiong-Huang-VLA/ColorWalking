import type { CompanionEmotion } from "./emotion";

export interface LuckyColorMoodBias {
  baseEmotion: CompanionEmotion;
  levelBias: number;
  stabilityBias: number;
}

export interface LuckyColorItem {
  colorId: string;
  colorName: string;
  hex: string;
  softHex: string;
  glowHex: string;
  category: string;
  keywords: string[];
  message: string;
  moodBias: LuckyColorMoodBias;
}

export interface LuckyColorsConfig {
  version: string;
  defaultEyeSoftness: number;
  colors: LuckyColorItem[];
}

export interface DailyLuckyColorRecord {
  dayKey: string;
  colorId: string;
  colorName: string;
  hex: string;
  softHex: string;
  glowHex: string;
  category: string;
  drawnAt: string;
}
