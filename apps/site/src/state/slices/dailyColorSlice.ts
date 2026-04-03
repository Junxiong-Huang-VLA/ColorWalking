import type { DailyColorState } from "../types";

export function createInitialDailyColorState(dayKey: string): DailyColorState {
  return {
    dayKey,
    colorId: null,
    colorName: "未领取",
    colorHex: "#F7E1B5",
    softHex: "#CFDDF8",
    glowHex: "#FFE7C9",
    category: "warm_cloud",
    keywords: ["温柔", "慢一点", "陪伴"],
    message: "这份颜色，送给今天的你。",
    moodBias: {
      baseEmotion: "soft",
      levelBias: 6,
      stabilityBias: 0.1
    },
    eyeSoftness: 0.45,
    syncStatus: "idle",
    atmosphereTheme: "moon_warm",
    drawnAt: null,
    history: []
  };
}
