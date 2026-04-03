import type { CompanionEventType } from "./emotion";

export interface BondLevelDefinition {
  level: number;
  title: string;
  requiredBondPoints: number;
  reward: string;
}

export interface GrowthNodeCondition {
  requiredBondLevel: number;
  requiredLineXp: number;
  requiredTaskIds?: string[];
}

export interface GrowthNodeReward {
  unlock: string;
  bonus?: {
    bondPoints?: number;
    lineXp?: number;
  };
}

export interface GrowthNodeDefinition {
  nodeId: string;
  title: string;
  description: string;
  condition: GrowthNodeCondition;
  reward: GrowthNodeReward;
}

export interface GrowthLineDefinition {
  lineId: "color_sense" | "expression" | "companion" | "island_story";
  lineName: string;
  description: string;
  nodes: GrowthNodeDefinition[];
}

export interface GrowthTreeConfig {
  version: string;
  bondLevels: BondLevelDefinition[];
  growthLines: GrowthLineDefinition[];
}

export interface DailyTaskCondition {
  eventType: CompanionEventType;
  minCount: number;
  oncePerDay: boolean;
}

export interface DailyTaskReward {
  bondPoints: number;
  lineXp: Partial<Record<GrowthLineDefinition["lineId"], number>>;
  itemReward?: string;
}

export interface DailyTaskDefinition {
  taskId: string;
  title: string;
  description: string;
  condition: DailyTaskCondition;
  reward: DailyTaskReward;
}

export interface StreakRewardDefinition {
  streakDays: number;
  reward: {
    bondPoints: number;
    unlock: string;
  };
}

export interface DailyTasksConfig {
  version: string;
  tasks: DailyTaskDefinition[];
  streakRewards: StreakRewardDefinition[];
}

export interface GrowthRuntimeState {
  dayKey: string;
  bondPoints: number;
  bondLevel: number;
  lineXp: Record<GrowthLineDefinition["lineId"], number>;
  unlockedNodeIds: string[];
  completedTaskIds: string[];
  streakDays: number;
}

export interface TaskRewardCopyConfig {
  version: string;
  fallbackHint: string;
  taskHints: Record<string, string>;
  taskTitles: Record<string, string>;
}
