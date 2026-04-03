import type { SheepEmotionState } from "../types";

export function createInitialSheepEmotionState(nowIso: string): SheepEmotionState {
  return {
    emotion: "soft",
    emotionLevel: 56,
    emotionSource: "rollback",
    emotionStability: 0.65,
    baseEmotion: "soft",
    baseLevel: 56,
    updatedAt: nowIso,
    lastEventAt: null,
    trend: [
      {
        at: nowIso,
        emotion: "soft",
        level: 56,
        source: "rollback"
      }
    ]
  };
}
