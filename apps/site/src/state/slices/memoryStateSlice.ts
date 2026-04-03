import type { MemoryState } from "../types";

export function createInitialMemoryState(nowIso: string, dayKey: string): MemoryState {
  return {
    rememberedItems: [
      {
        id: `memory-${Date.now()}`,
        type: "moment",
        text: "今天，小羊卷把第一份温柔放在你身边。",
        at: nowIso
      }
    ],
    timeline: [
      {
        id: `timeline-${Date.now()}`,
        event: "初次相遇",
        at: nowIso
      }
    ],
    colorCalendar: [
      {
        dayKey,
        colorHex: "#F7E1B5",
        colorName: "未领取"
      }
    ],
    memoryCards: [
      {
        id: `card-${Date.now()}`,
        title: "初见",
        desc: "小羊卷从颜色云岛来到你的身边。",
        mood: "安静",
        at: nowIso,
        category: "memory"
      }
    ],
    interactionSummaries: [],
    sharedMoments: [],
    bedtimeMemories: []
  };
}
