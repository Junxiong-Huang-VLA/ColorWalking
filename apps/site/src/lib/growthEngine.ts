import dailyTasksJson from "../config/daily-tasks.json";
import growthTreeJson from "../config/growth-tree.json";
import type { CompanionEventType } from "../types/emotion";
import type {
  DailyTaskDefinition,
  DailyTasksConfig,
  GrowthRuntimeState,
  GrowthTreeConfig,
  StreakRewardDefinition
} from "../types/growth";
import { validateDailyTasksConfig, validateGrowthTreeConfig } from "./configValidator";

const GROWTH_TREE_CONFIG: GrowthTreeConfig = validateGrowthTreeConfig(growthTreeJson);
const DAILY_TASKS_CONFIG: DailyTasksConfig = validateDailyTasksConfig(dailyTasksJson);

function createEmptyLineXp(): GrowthRuntimeState["lineXp"] {
  return {
    color_sense: 0,
    expression: 0,
    companion: 0,
    island_story: 0
  };
}

function resolveBondLevel(points: number): number {
  const sorted = [...GROWTH_TREE_CONFIG.bondLevels].sort((a, b) => a.requiredBondPoints - b.requiredBondPoints);
  let level = 1;
  for (const item of sorted) {
    if (points >= item.requiredBondPoints) level = item.level;
  }
  return level;
}

function isTaskConditionMet(
  task: DailyTaskDefinition,
  eventCounter: Partial<Record<CompanionEventType, number>>,
  completedTaskIds: string[]
): boolean {
  const count = eventCounter[task.condition.eventType] ?? 0;
  if (count < task.condition.minCount) return false;
  if (task.condition.oncePerDay && completedTaskIds.includes(task.taskId)) return false;
  return true;
}

function resolveUnlockedNodeIds(state: GrowthRuntimeState): string[] {
  const unlocked = new Set<string>(state.unlockedNodeIds);
  for (const line of GROWTH_TREE_CONFIG.growthLines) {
    for (const node of line.nodes) {
      const condition = node.condition;
      const meetsBondLevel = state.bondLevel >= condition.requiredBondLevel;
      const meetsLineXp = (state.lineXp[line.lineId] ?? 0) >= condition.requiredLineXp;
      const meetsTasks = (condition.requiredTaskIds ?? []).every((taskId) => state.completedTaskIds.includes(taskId));
      if (meetsBondLevel && meetsLineXp && meetsTasks) unlocked.add(node.nodeId);
    }
  }
  return [...unlocked];
}

export function getGrowthTreeConfig(): GrowthTreeConfig {
  return GROWTH_TREE_CONFIG;
}

export function getDailyTasksConfig(): DailyTasksConfig {
  return DAILY_TASKS_CONFIG;
}

export function createMockGrowthRuntime(dayKey: string): GrowthRuntimeState {
  return {
    dayKey,
    bondPoints: 12,
    bondLevel: 1,
    lineXp: createEmptyLineXp(),
    unlockedNodeIds: [],
    completedTaskIds: [],
    streakDays: 0
  };
}

export function applyTaskCompletion(state: GrowthRuntimeState, taskId: string): {
  applied: boolean;
  reward: DailyTaskDefinition["reward"] | null;
  nextState: GrowthRuntimeState;
} {
  const task = DAILY_TASKS_CONFIG.tasks.find((item) => item.taskId === taskId);
  if (!task) return { applied: false, reward: null, nextState: state };
  if (state.completedTaskIds.includes(taskId) && task.condition.oncePerDay) {
    return { applied: false, reward: null, nextState: state };
  }

  const nextLineXp: GrowthRuntimeState["lineXp"] = {
    ...state.lineXp,
    color_sense: (state.lineXp.color_sense ?? 0) + (task.reward.lineXp.color_sense ?? 0),
    expression: (state.lineXp.expression ?? 0) + (task.reward.lineXp.expression ?? 0),
    companion: (state.lineXp.companion ?? 0) + (task.reward.lineXp.companion ?? 0),
    island_story: (state.lineXp.island_story ?? 0) + (task.reward.lineXp.island_story ?? 0)
  };
  const nextBondPoints = state.bondPoints + task.reward.bondPoints;

  const draft: GrowthRuntimeState = {
    ...state,
    bondPoints: nextBondPoints,
    bondLevel: resolveBondLevel(nextBondPoints),
    lineXp: nextLineXp,
    completedTaskIds: [...state.completedTaskIds, task.taskId]
  };

  const unlockedNodeIds = resolveUnlockedNodeIds(draft);
  return {
    applied: true,
    reward: task.reward,
    nextState: {
      ...draft,
      unlockedNodeIds
    }
  };
}

export function applyTaskCompletionsByEvents(
  state: GrowthRuntimeState,
  eventCounter: Partial<Record<CompanionEventType, number>>
): GrowthRuntimeState {
  let nextState = state;
  for (const task of DAILY_TASKS_CONFIG.tasks) {
    if (isTaskConditionMet(task, eventCounter, nextState.completedTaskIds)) {
      const applied = applyTaskCompletion(nextState, task.taskId);
      nextState = applied.nextState;
    }
  }
  return nextState;
}

export function getReachedStreakRewards(streakDays: number): StreakRewardDefinition[] {
  return DAILY_TASKS_CONFIG.streakRewards.filter((item) => streakDays >= item.streakDays);
}
