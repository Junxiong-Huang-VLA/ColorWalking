import type { GrowthLineState, GrowthState } from "../types";

function line(level = 1): GrowthLineState {
  return {
    level,
    xp: 0,
    unlocked: []
  };
}

export function createInitialGrowthState(dayKey: string): GrowthState {
  return {
    colorSense: line(1),
    expression: line(1),
    companion: line(1),
    islandStory: line(1),
    taskDayKey: dayKey,
    eventCounter: {},
    completedTaskIds: [],
    unlockedNodeIds: [],
    taskRewards: []
  };
}
