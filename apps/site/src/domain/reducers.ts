import type { DeviceInputEventType } from "@colorwalking/shared";
import { lineForLuckyColor } from "../features/sheep/sheepCopy";
import {
  applyEmotionEvent as applyEmotionEventByEngine,
  applyTaskCompletionsByEvents,
  createEmotionStateFromLuckyColor,
  deriveVisualFromEmotion,
  drawDailyLuckyColor,
  getDailyTasksConfig,
  getLuckyColors,
  getGrowthTreeConfig,
  getLuckyColorById,
  rollbackEmotionState
} from "../lib";
import type { AppEvent } from "./events";
import type {
  AppRootState,
  ColorCalendarItem,
  CompanionEventType,
  DemoPresetBondStage,
  DemoPresetColorCategory,
  DemoPresetDeviceState,
  DemoPresetIntensity,
  DemoPresetOptions,
  DemoPresetTimeWindow,
  DemoScenarioPreset,
  EmotionSource,
  GrowthLineState,
  GrowthState,
  GrowthTaskRewardItem,
  InteractionScene,
  MilestoneMockPayload,
  TimelineItem
} from "../state/types";
import type { EmotionState as EngineEmotionState, TimeScene } from "../types/emotion";
import type { GrowthRuntimeState } from "../types/growth";
import { getTaskRewardHint } from "./growth/taskRewardCopy";
import { dayKeyOf } from "../utils/time";
import { hexToRgb, moodThemeByColor, rgbToHex, softenColor } from "../utils/color";
import { COMPANION_EVENT_LABEL } from "./companionEvents";
import { sceneProfileOf } from "./interactionScenes";
import { shouldAppendSharedMoment } from "./memory/sharedMomentDeduper";
import { composeCompanionReplyPipeline, resolveEventBehaviorDecision } from "./companion/replyPipeline";
import { createInitialBondState } from "../state/slices/bondStateSlice";
import { createInitialDailyColorState } from "../state/slices/dailyColorSlice";
import { createInitialDeviceState } from "../state/slices/deviceStateSlice";
import { createInitialGrowthState } from "../state/slices/growthStateSlice";
import { createInitialInteractionState } from "../state/slices/interactionStateSlice";
import { createInitialMemoryState } from "../state/slices/memoryStateSlice";
import { createInitialSheepEmotionState } from "../state/slices/sheepEmotionStateSlice";
import { createInitialSheepProfileState } from "../state/slices/sheepStateSlice";
import { createInitialSheepVisualState } from "../state/slices/sheepVisualStateSlice";
import { createInitialTelemetryState } from "../state/slices/telemetryStateSlice";
import { createInitialUserProfile } from "../state/slices/userProfileSlice";

const MAX_MESSAGES = 80;
const MAX_TIMELINE = 120;
const MAX_MEMORY = 80;
const MAX_CARDS = 80;
const MAX_CALENDAR = 365;
const MAX_EMOTION_TREND = 120;
const MAX_TASK_REWARDS = 80;
const MAX_PENDING_COMMANDS = 30;
const MAX_DEVICE_LOGS = 80;
const MAX_INTERACTION_SUMMARIES = 40;
const MAX_SHARED_MOMENTS = 80;
const MAX_BEDTIME_MEMORIES = 80;
const MAX_TELEMETRY_EVENTS = 240;

const GROWTH_TREE = getGrowthTreeConfig();
const DAILY_TASKS = getDailyTasksConfig();
const TASK_BY_ID = new Map(DAILY_TASKS.tasks.map((task) => [task.taskId, task]));

type GrowthLineId = "color_sense" | "expression" | "companion" | "island_story";

function makeId(prefix: string, atIso: string): string {
  return `${prefix}-${new Date(atIso).getTime()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function blendHex(baseHex: string, overlayHex: string, weight: number): string {
  const base = hexToRgb(baseHex);
  const overlay = hexToRgb(overlayHex);
  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex(
    base.r * (1 - w) + overlay.r * w,
    base.g * (1 - w) + overlay.g * w,
    base.b * (1 - w) + overlay.b * w
  );
}

function isSameDay(prevDayKey: string, dayKey: string): boolean {
  return prevDayKey === dayKey;
}

function previousDayKey(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return dayKeyOf(date.toISOString());
}

function updateStreak(lastCheckInDayKey: string, nextDayKey: string, currentStreak: number): number {
  if (!lastCheckInDayKey) return 1;
  if (lastCheckInDayKey === nextDayKey) return Math.max(1, currentStreak);
  if (lastCheckInDayKey === previousDayKey(nextDayKey)) return Math.max(1, currentStreak) + 1;
  return 1;
}

function resolveScene(
  atIso: string,
  sceneMode: AppRootState["ui"]["sceneMode"],
  preferBedtime = false
): TimeScene {
  if (sceneMode !== "auto") return sceneMode;
  const date = new Date(atIso);
  const hour = Number.isFinite(date.getTime()) ? date.getHours() : 12;
  if (preferBedtime || hour >= 22 || hour < 5) return "bedtime";
  if (hour >= 19 || hour < 8) return "night";
  return "daytime";
}

function pickBySeed<T>(items: T[], seed: string): T {
  const base = seed.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return items[Math.abs(base) % items.length] ?? items[0];
}

function withDeviceLog(
  state: AppRootState,
  log: AppRootState["deviceState"]["recentEventLogs"][number]
): AppRootState {
  return {
    ...state,
    deviceState: {
      ...state.deviceState,
      recentEventLogs: [log, ...state.deviceState.recentEventLogs].slice(0, MAX_DEVICE_LOGS)
    }
  };
}

function withTelemetry(
  state: AppRootState,
  item: AppRootState["telemetryState"]["events"][number]
): AppRootState {
  return {
    ...state,
    telemetryState: {
      ...state.telemetryState,
      events: [item, ...state.telemetryState.events].slice(0, MAX_TELEMETRY_EVENTS)
    }
  };
}

function upsertInteractionSummary(state: AppRootState, nowIso: string): AppRootState {
  const dayKey = dayKeyOf(nowIso);
  const currentScene = state.interactionState.activeScene;
  const currentDayCount = state.bondState.lastCheckInDayKey === dayKey ? state.bondState.todayInteractCount : 0;
  const bedtimeCount = state.memoryState.timeline.filter((item) => dayKeyOf(item.at) === dayKey && item.event.includes("睡前")).length;
  const summary = {
    dayKey,
    summary: `今天互动 ${currentDayCount} 次，场景以 ${sceneLabel(currentScene)} 为主。`,
    interactionCount: currentDayCount,
    bedtimeCount,
    lastScene: currentScene,
    updatedAt: nowIso
  };

  const rest = state.memoryState.interactionSummaries.filter((item) => item.dayKey !== dayKey);
  return {
    ...state,
    memoryState: {
      ...state.memoryState,
      interactionSummaries: [summary, ...rest].slice(0, MAX_INTERACTION_SUMMARIES)
    }
  };
}

function pushTimeline(state: AppRootState, item: TimelineItem): AppRootState {
  return {
    ...state,
    memoryState: {
      ...state.memoryState,
      timeline: [item, ...state.memoryState.timeline].slice(0, MAX_TIMELINE)
    }
  };
}

function pushRemembered(state: AppRootState, item: AppRootState["memoryState"]["rememberedItems"][number]): AppRootState {
  return {
    ...state,
    memoryState: {
      ...state.memoryState,
      rememberedItems: [item, ...state.memoryState.rememberedItems].slice(0, MAX_MEMORY)
    }
  };
}

function pushMemoryCard(state: AppRootState, item: AppRootState["memoryState"]["memoryCards"][number]): AppRootState {
  return {
    ...state,
    memoryState: {
      ...state.memoryState,
      memoryCards: [item, ...state.memoryState.memoryCards].slice(0, MAX_CARDS)
    }
  };
}

function upsertColorCalendar(state: AppRootState, item: ColorCalendarItem): AppRootState {
  const filtered = state.memoryState.colorCalendar.filter((entry) => entry.dayKey !== item.dayKey);
  return {
    ...state,
    memoryState: {
      ...state.memoryState,
      colorCalendar: [item, ...filtered].slice(0, MAX_CALENDAR)
    }
  };
}

function appendEmotionTrend(state: AppRootState, atIso: string): AppRootState {
  const latest = state.sheepEmotionState.trend[state.sheepEmotionState.trend.length - 1];
  const current = state.sheepEmotionState;
  const lastAt = latest ? new Date(latest.at).getTime() : 0;
  const nowAt = new Date(atIso).getTime();
  const sameEmotion = latest?.emotion === current.emotion;
  const levelDelta = latest ? Math.abs(latest.level - current.emotionLevel) : 100;
  const sourceSame = latest?.source === current.emotionSource;
  const nearInTime = Number.isFinite(lastAt) && Number.isFinite(nowAt) ? nowAt - lastAt < 45000 : false;
  if (sameEmotion && sourceSame && levelDelta < 1.2 && nearInTime) {
    return state;
  }

  return {
    ...state,
    sheepEmotionState: {
      ...current,
      trend: [
        ...current.trend,
        {
          at: atIso,
          emotion: current.emotion,
          level: Number(current.emotionLevel.toFixed(2)),
          source: current.emotionSource
        }
      ].slice(-MAX_EMOTION_TREND)
    }
  };
}

function pushMessage(
  state: AppRootState,
  message: { role: "user" | "sheep"; text: string; at: string; channel: "text" | "voice" }
): AppRootState {
  return {
    ...state,
    interactionState: {
      ...state.interactionState,
      messages: [
        ...state.interactionState.messages,
        {
          id: makeId("msg", message.at),
          role: message.role,
          text: message.text,
          at: message.at,
          channel: message.channel
        }
      ].slice(-MAX_MESSAGES)
    }
  };
}

function eventBondGain(eventType: CompanionEventType): number {
  if (eventType === "daily_color_drawn") return 10;
  if (eventType === "hug_pressure") return 8;
  if (eventType === "touch_head") return 5;
  if (eventType === "picked_up") return 6;
  if (eventType === "touch_body") return 4;
  if (eventType === "proximity_near") return 4;
  if (eventType === "laid_down") return 2;
  if (eventType === "bedtime_mode_started") return 3;
  return 4;
}

function scarfEmotionBlendWeight(emotion: AppRootState["sheepEmotionState"]["emotion"], emotionLevel: number): number {
  const normalizedLevel = clamp(emotionLevel, 0, 100) / 100;
  if (emotion === "happy") return 0.24 + normalizedLevel * 0.08;
  if (emotion === "sad") return 0.08 + normalizedLevel * 0.05;
  if (emotion === "sleepy") return 0.12 + normalizedLevel * 0.06;
  if (emotion === "shy") return 0.16 + normalizedLevel * 0.06;
  if (emotion === "soft") return 0.18 + normalizedLevel * 0.05;
  return 0.14 + normalizedLevel * 0.04;
}

function toEngineEmotion(state: AppRootState["sheepEmotionState"]): EngineEmotionState {
  return {
    emotion: state.emotion,
    emotionLevel: state.emotionLevel,
    emotionSource: state.emotionSource,
    emotionStability: state.emotionStability,
    baseEmotion: state.baseEmotion,
    baseLevel: state.baseLevel,
    updatedAt: state.updatedAt,
    lastEventAt: state.lastEventAt
  };
}

function fromEngineEmotion(
  previous: AppRootState["sheepEmotionState"],
  next: EngineEmotionState
): AppRootState["sheepEmotionState"] {
  return {
    ...previous,
    emotion: next.emotion,
    emotionLevel: next.emotionLevel,
    emotionSource: next.emotionSource as EmotionSource,
    emotionStability: next.emotionStability,
    baseEmotion: next.baseEmotion,
    baseLevel: next.baseLevel,
    updatedAt: next.updatedAt,
    lastEventAt: next.lastEventAt
  };
}

function deriveVisualState(
  current: AppRootState["sheepVisualState"],
  dailyColorState: AppRootState["dailyColorState"],
  emotionState: AppRootState["sheepEmotionState"],
  seed: string | number
): AppRootState["sheepVisualState"] {
  const visual = deriveVisualFromEmotion({
    emotionState: toEngineEmotion(emotionState),
    luckyColor: {
      hex: dailyColorState.colorHex,
      softHex: dailyColorState.softHex
    },
    seed
  });
  const baseScarfColor = dailyColorState.colorHex || current.scarfColorHex;
  const scarfColorHex = blendHex(
    baseScarfColor,
    visual.eyeColorHex,
    scarfEmotionBlendWeight(emotionState.emotion, emotionState.emotionLevel)
  );
  return {
    ...current,
    eyeState: visual.eyeState,
    eyeColorHex: visual.eyeColorHex,
    scarfColorHex,
    expression: visual.expression,
    motionTemplate: visual.motionTemplate,
    voiceStyle: visual.voiceStyle,
    statusText: visual.statusText
  };
}

function applySceneVisualBias(
  visualState: AppRootState["sheepVisualState"],
  scene: InteractionScene,
  seed: string
): AppRootState["sheepVisualState"] {
  const profile = sceneProfileOf(scene);
  return {
    ...visualState,
    eyeState: pickBySeed(profile.eyeStateCandidates, `${seed}-${scene}-eye`),
    eyeColorHex: blendHex(visualState.eyeColorHex, profile.eyeColorBlendHex, profile.eyeColorBlendWeight),
    scarfColorHex: blendHex(visualState.scarfColorHex, profile.eyeColorBlendHex, profile.eyeColorBlendWeight * 0.35),
    expression: pickBySeed(profile.expressionCandidates, `${seed}-${scene}-exp`),
    motionTemplate: pickBySeed(profile.motionCandidates, `${seed}-${scene}-motion`),
    statusText: pickBySeed(profile.statusText, `${seed}-${scene}-status`)
  };
}

function applySceneGrowthBonus(state: AppRootState, scene: InteractionScene): AppRootState {
  const profile = sceneProfileOf(scene);
  const current = state.growthState;
  const bonus = profile.growthWeight;
  const nextGrowthState: GrowthState = {
    ...current,
    colorSense: {
      ...current.colorSense,
      xp: current.colorSense.xp + (bonus.lineXpBonus.color_sense ?? 0)
    },
    expression: {
      ...current.expression,
      xp: current.expression.xp + (bonus.lineXpBonus.expression ?? 0)
    },
    companion: {
      ...current.companion,
      xp: current.companion.xp + (bonus.lineXpBonus.companion ?? 0)
    },
    islandStory: {
      ...current.islandStory,
      xp: current.islandStory.xp + (bonus.lineXpBonus.island_story ?? 0)
    }
  };

  return {
    ...state,
    growthState: nextGrowthState,
    bondState: {
      ...state.bondState,
      bondPoints: state.bondState.bondPoints + bonus.bondBonus,
      level: resolveBondLevelByPoints(state.bondState.bondPoints + bonus.bondBonus)
    }
  };
}

function sceneLabel(scene: InteractionScene): string {
  if (scene === "chat") return "聊天";
  if (scene === "comfort") return "安抚";
  if (scene === "bedtime") return "睡前";
  if (scene === "mood") return "心情";
  return "幸运色";
}

function normalizeMilestoneMetaValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function appendMilestoneMeta(desc: string, meta: MilestoneMockPayload | undefined): string {
  if (!meta) return desc;
  const activityId = normalizeMilestoneMetaValue(meta.activityId);
  const channel = normalizeMilestoneMetaValue(meta.channel);
  const batchId = normalizeMilestoneMetaValue(meta.batchId);
  const labels: string[] = [];
  if (activityId) labels.push(`活动:${activityId}`);
  if (channel) labels.push(`渠道:${channel}`);
  if (batchId) labels.push(`批次:${batchId}`);
  if (!labels.length) return desc;
  return `${desc}（${labels.join(" / ")}）`;
}

function pushSharedMoment(
  state: AppRootState,
  item: AppRootState["memoryState"]["sharedMoments"][number]
): AppRootState {
  if (!shouldAppendSharedMoment(state.memoryState.sharedMoments, item)) {
    return state;
  }
  return {
    ...state,
    memoryState: {
      ...state.memoryState,
      sharedMoments: [item, ...state.memoryState.sharedMoments].slice(0, MAX_SHARED_MOMENTS)
    }
  };
}

function pushMilestoneCard(
  state: AppRootState,
  item: AppRootState["memoryState"]["memoryCards"][number]
): AppRootState {
  if (!item.milestoneId) return pushMemoryCard(state, item);
  if (state.memoryState.memoryCards.some((card) => card.milestoneId === item.milestoneId)) {
    return state;
  }
  return pushMemoryCard(state, item);
}

function pushBedtimeMemory(
  state: AppRootState,
  item: AppRootState["memoryState"]["bedtimeMemories"][number]
): AppRootState {
  return {
    ...state,
    memoryState: {
      ...state.memoryState,
      bedtimeMemories: [item, ...state.memoryState.bedtimeMemories].slice(0, MAX_BEDTIME_MEMORIES)
    }
  };
}

function hasSharedMoment(state: AppRootState, key: string): boolean {
  return state.memoryState.sharedMoments.some((item) => item.key === key || item.milestoneId === key);
}

function updateSurveySubmissionStatus(
  state: AppRootState,
  submissionId: string,
  patch: Partial<AppRootState["userProfile"]["surveySubmissions"][number]>
): AppRootState {
  const nextSubmissions = state.userProfile.surveySubmissions.map((item) =>
    item.id === submissionId ? { ...item, ...patch } : item
  );
  return {
    ...state,
    userProfile: {
      ...state.userProfile,
      surveySubmissions: nextSubmissions
    }
  };
}

function upsertDailyHistory(
  history: AppRootState["dailyColorState"]["history"],
  item: AppRootState["dailyColorState"]["history"][number]
): AppRootState["dailyColorState"]["history"] {
  const filtered = history.filter((entry) => entry.dayKey !== item.dayKey);
  return [item, ...filtered].slice(0, MAX_CALENDAR);
}

function resolveBondLevelByPoints(points: number): number {
  let level = 1;
  for (const item of GROWTH_TREE.bondLevels) {
    if (points >= item.requiredBondPoints) {
      level = item.level;
    }
  }
  return level;
}

function xpToLevel(xp: number): number {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

function lineStateFromRuntime(runtime: GrowthRuntimeState, lineId: GrowthLineId): GrowthLineState {
  const xp = runtime.lineXp[lineId] ?? 0;
  const line = GROWTH_TREE.growthLines.find((entry) => entry.lineId === lineId);
  const unlocked = line
    ? line.nodes.filter((node) => runtime.unlockedNodeIds.includes(node.nodeId)).map((node) => node.title)
    : [];
  return {
    level: xpToLevel(xp),
    xp,
    unlocked
  };
}

function resetGrowthTracking(state: GrowthState, dayKey: string): GrowthState {
  return {
    ...state,
    taskDayKey: dayKey,
    eventCounter: {},
    completedTaskIds: [],
    taskRewards: []
  };
}

function toGrowthRuntime(state: AppRootState, growthState: GrowthState, dayKey: string): GrowthRuntimeState {
  return {
    dayKey,
    bondPoints: state.bondState.bondPoints,
    bondLevel: state.bondState.level,
    lineXp: {
      color_sense: growthState.colorSense.xp,
      expression: growthState.expression.xp,
      companion: growthState.companion.xp,
      island_story: growthState.islandStory.xp
    },
    unlockedNodeIds: growthState.unlockedNodeIds,
    completedTaskIds: growthState.completedTaskIds,
    streakDays: state.bondState.streakDays
  };
}

function buildTaskRewardEntries(newTaskIds: string[], at: string): GrowthTaskRewardItem[] {
  const entries: GrowthTaskRewardItem[] = [];
  for (const taskId of newTaskIds) {
    const task = TASK_BY_ID.get(taskId);
    if (!task) continue;
    const entry: GrowthTaskRewardItem = {
      taskId: task.taskId,
      at,
      bondPoints: task.reward.bondPoints,
      lineXp: task.reward.lineXp
    };
    if (task.reward.itemReward) {
      entry.itemReward = task.reward.itemReward;
    }
    entries.push(entry);
  }
  return entries;
}

function applyGrowthProgressForEvent(
  state: AppRootState,
  eventType: CompanionEventType,
  nowIso: string,
  dayKey: string
): { state: AppRootState; newTaskIds: string[]; newUnlockedNodeIds: string[]; leveledUp: boolean } {
  const growthBase = state.growthState.taskDayKey === dayKey ? state.growthState : resetGrowthTracking(state.growthState, dayKey);
  const eventCounter = {
    ...growthBase.eventCounter,
    [eventType]: (growthBase.eventCounter[eventType] ?? 0) + 1
  };

  const runtimeBefore = toGrowthRuntime(state, growthBase, dayKey);
  const runtimeAfter = applyTaskCompletionsByEvents(runtimeBefore, eventCounter);
  const newTaskIds = runtimeAfter.completedTaskIds.filter((taskId) => !runtimeBefore.completedTaskIds.includes(taskId));
  const newUnlockedNodeIds = runtimeAfter.unlockedNodeIds.filter((nodeId) => !runtimeBefore.unlockedNodeIds.includes(nodeId));
  const leveledUp = runtimeAfter.bondLevel > runtimeBefore.bondLevel;
  const rewardEntries = buildTaskRewardEntries(newTaskIds, nowIso);

  const nextGrowthState: GrowthState = {
    colorSense: lineStateFromRuntime(runtimeAfter, "color_sense"),
    expression: lineStateFromRuntime(runtimeAfter, "expression"),
    companion: lineStateFromRuntime(runtimeAfter, "companion"),
    islandStory: lineStateFromRuntime(runtimeAfter, "island_story"),
    taskDayKey: dayKey,
    eventCounter,
    completedTaskIds: runtimeAfter.completedTaskIds,
    unlockedNodeIds: runtimeAfter.unlockedNodeIds,
    taskRewards: rewardEntries.length
      ? [...rewardEntries, ...growthBase.taskRewards].slice(0, MAX_TASK_REWARDS)
      : growthBase.taskRewards
  };

  return {
    state: {
      ...state,
      growthState: nextGrowthState,
      ui: rewardEntries.length
        ? {
            ...state.ui,
            activeModal: "task_reward"
          }
        : state.ui,
      bondState: {
        ...state.bondState,
        bondPoints: runtimeAfter.bondPoints,
        level: runtimeAfter.bondLevel
      }
    },
    newTaskIds,
    newUnlockedNodeIds,
    leveledUp
  };
}

function appendTaskTimelines(state: AppRootState, taskIds: string[], nowIso: string): AppRootState {
  let next = state;
  for (const taskId of taskIds) {
    const task = TASK_BY_ID.get(taskId);
    if (!task) continue;
    next = pushTimeline(next, {
      id: makeId("timeline", nowIso),
      event: `完成任务：${task.title}`,
      at: nowIso
    });
  }
  return next;
}

function applyCompanionEvent(
  state: AppRootState,
  eventType: CompanionEventType,
  nowIso: string
): {
  state: AppRootState;
  newTaskIds: string[];
  newUnlockedNodeIds: string[];
  leveledUp: boolean;
  bondDelta: number;
  emotionBefore: AppRootState["sheepEmotionState"]["emotion"];
  emotionAfter: AppRootState["sheepEmotionState"]["emotion"];
} {
  const activeScene = state.interactionState.activeScene;
  const sceneProfile = sceneProfileOf(activeScene);
  const scene = resolveScene(
    nowIso,
    state.ui.sceneMode,
    eventType === "bedtime_mode_started" || activeScene === "bedtime"
  );
  const emotionBefore = state.sheepEmotionState.emotion;
  const emotionEventType = eventType === "chat_started" ? sceneProfile.biasEvent : eventType;
  const emotionCore = applyEmotionEventByEngine({
    state: toEngineEmotion(state.sheepEmotionState),
    eventType: emotionEventType,
    nowIso,
    scene
  });
  const nextEmotion = fromEngineEmotion(state.sheepEmotionState, emotionCore);
  const sceneBiasedVisual = applySceneVisualBias(
    deriveVisualState(state.sheepVisualState, state.dailyColorState, nextEmotion, nowIso),
    activeScene,
    `${nowIso}-${eventType}`
  );
  const eventDecision = resolveEventBehaviorDecision({
    eventType,
    scene: activeScene,
    colorName: state.dailyColorState.colorName,
    emotion: nextEmotion.emotion,
    fallbackStatusText: sceneBiasedVisual.statusText
  });
  const nextVisual = {
    ...sceneBiasedVisual,
    ...eventDecision,
    statusText: eventDecision.statusText ?? sceneBiasedVisual.statusText
  };

  let next: AppRootState = {
    ...state,
    sheepEmotionState: nextEmotion,
    sheepVisualState: nextVisual,
    interactionState: {
      ...state.interactionState,
      lastEventType: eventType,
      lastEventAt: nowIso
    },
    bondState: {
      ...state.bondState,
      bondPoints: state.bondState.bondPoints + eventBondGain(eventType),
      todayInteractCount: state.bondState.todayInteractCount + 1,
      lastInteractAt: nowIso
    },
    deviceState: {
      ...state.deviceState,
      syncState: "pending"
    }
  };

  const bondBefore = state.bondState.bondPoints;
  const growthApplied = applyGrowthProgressForEvent(next, eventType, nowIso, dayKeyOf(nowIso));
  next = growthApplied.state;
  next = applySceneGrowthBonus(next, activeScene);
  const bondDelta = next.bondState.bondPoints - bondBefore;
  const emotionAfter = next.sheepEmotionState.emotion;
  const leveledUp = growthApplied.leveledUp || next.bondState.level > state.bondState.level;
  next = appendEmotionTrend(next, nowIso);
  next = pushTimeline(next, {
    id: makeId("timeline", nowIso),
    event: `互动：${COMPANION_EVENT_LABEL[eventType]}`,
    at: nowIso
  });
  next = appendTaskTimelines(next, growthApplied.newTaskIds, nowIso);
  if (growthApplied.newUnlockedNodeIds.length) {
    next = pushTimeline(next, {
      id: makeId("timeline", nowIso),
      event: `解锁新成长节点 ${growthApplied.newUnlockedNodeIds.length} 个`,
      at: nowIso
    });
  }
  if (leveledUp) {
    const dayKey = dayKeyOf(nowIso);
    const levelKey = `bond-level-${next.bondState.level}`;
    next = pushSharedMoment(next, {
      id: makeId("shared", nowIso),
      title: `关系升到 Lv.${next.bondState.level}`,
      desc: "今天又靠近了一点。",
      dayKey,
      at: nowIso,
      key: levelKey,
      milestoneId: levelKey,
      milestoneType: "bond_level",
      scene: activeScene,
      category: "milestone"
    });
    next = pushMilestoneCard(next, {
      id: makeId("card", nowIso),
      title: `关系 Lv.${next.bondState.level}`,
      desc: "你和小羊卷的羁绊更深了一点。",
      mood: "gentle",
      at: nowIso,
      milestoneId: levelKey,
      category: "milestone"
    });
  }
  if (eventType === "bedtime_mode_started" || activeScene === "bedtime") {
    const firstBedtime = next.memoryState.bedtimeMemories.length === 0;
    next = pushBedtimeMemory(next, {
      id: makeId("bedtime", nowIso),
      title: "睡前陪伴",
      desc: "晚一点也没关系，我在这里。",
      mood: "soft",
      at: nowIso,
      category: "memory"
    });
    if (firstBedtime) {
      next = pushSharedMoment(next, {
        id: makeId("shared", nowIso),
        title: "第一次晚安",
        desc: "你把第一句晚安交给了小羊卷。",
        dayKey: dayKeyOf(nowIso),
        at: nowIso,
        key: "first-bedtime",
        milestoneId: "first-bedtime",
        milestoneType: "first_bedtime",
        scene: "bedtime",
        category: "first_time"
      });
    }
  }
  next = upsertInteractionSummary(next, nowIso);
  next = withDeviceLog(next, {
    id: makeId("devlog", nowIso),
    at: nowIso,
    level: "info",
    type: "interaction",
    message: `${COMPANION_EVENT_LABEL[eventType]} 路 ${sceneLabel(activeScene)}`
  });
  next = {
    ...next,
    interactionState: {
      ...next.interactionState,
      lastFeedback: {
        at: nowIso,
        scene: activeScene,
        eventType,
        bondDelta,
        emotionBefore,
        emotionAfter,
        sceneGrowthBonus: {
          bondBonus: sceneProfile.growthWeight.bondBonus,
          lineXpBonus: sceneProfile.growthWeight.lineXpBonus
        },
        newTaskIds: growthApplied.newTaskIds,
        unlockedNodeIds: growthApplied.newUnlockedNodeIds
      }
    }
  };

  return {
    state: next,
    newTaskIds: growthApplied.newTaskIds,
    newUnlockedNodeIds: growthApplied.newUnlockedNodeIds,
    leveledUp,
    bondDelta,
    emotionBefore,
    emotionAfter
  };
}

function applyDailyColorWithLuckyColor(
  state: AppRootState,
  dayKey: string,
  nowIso: string,
  luckyColor: ReturnType<typeof drawDailyLuckyColor>,
  force = false
): AppRootState {
  if (!force && state.dailyColorState.dayKey === dayKey && state.dailyColorState.colorId) {
    return state;
  }

  const isFirstDraw = !state.dailyColorState.colorId && state.dailyColorState.history.every((item) => item.colorId !== luckyColor.colorId);
  const eyeSoftness = clamp(state.dailyColorState.eyeSoftness, 0.2, 0.8);
  const softHex = softenColor(luckyColor.hex, eyeSoftness);
  const drawnAt = nowIso;

  const nextDailyColorState = {
    ...state.dailyColorState,
    dayKey,
    colorId: luckyColor.colorId,
    colorName: luckyColor.colorName,
    colorHex: luckyColor.hex,
    softHex,
    glowHex: luckyColor.glowHex,
    category: luckyColor.category,
    keywords: luckyColor.keywords,
    message: luckyColor.message,
    moodBias: luckyColor.moodBias,
    syncStatus: "pending_device" as const,
    atmosphereTheme: moodThemeByColor(luckyColor.hex),
    drawnAt,
    history: upsertDailyHistory(state.dailyColorState.history, {
      dayKey,
      colorId: luckyColor.colorId,
      colorName: luckyColor.colorName,
      hex: luckyColor.hex,
      softHex,
      glowHex: luckyColor.glowHex,
      category: luckyColor.category,
      drawnAt
    })
  };

  const emotionCore = createEmotionStateFromLuckyColor({
    category: luckyColor.category,
    moodBias: luckyColor.moodBias,
    nowIso,
    scene: resolveScene(nowIso, state.ui.sceneMode)
  });
  const nextEmotion = fromEngineEmotion(state.sheepEmotionState, emotionCore);
  const activeScene = state.interactionState.activeScene;
  const sceneBiasedVisual = applySceneVisualBias(
    deriveVisualState(state.sheepVisualState, nextDailyColorState, nextEmotion, dayKey),
    activeScene,
    `${dayKey}-${luckyColor.colorId}`
  );
  const drawDecision = resolveEventBehaviorDecision({
    eventType: "daily_color_drawn",
    scene: activeScene,
    colorName: luckyColor.colorName,
    emotion: nextEmotion.emotion,
    fallbackStatusText: sceneBiasedVisual.statusText
  });
  const nextVisual = {
    ...sceneBiasedVisual,
    ...drawDecision,
    statusText: drawDecision.statusText ?? sceneBiasedVisual.statusText
  };

  let next: AppRootState = {
    ...state,
    dailyColorState: nextDailyColorState,
    sheepEmotionState: nextEmotion,
    sheepVisualState: nextVisual,
    sheepProfile: {
      ...state.sheepProfile,
      greeting: luckyColor.message
    },
    interactionState: {
      ...state.interactionState,
      lastEventType: "daily_color_drawn",
      lastEventAt: nowIso
    },
    bondState: {
      ...state.bondState,
      bondPoints: state.bondState.bondPoints + eventBondGain("daily_color_drawn"),
      todayInteractCount: state.bondState.todayInteractCount + 1,
      lastInteractAt: nowIso
    },
    deviceState: {
      ...state.deviceState,
      syncState: "pending"
    }
  };

  const growthApplied = applyGrowthProgressForEvent(next, "daily_color_drawn", nowIso, dayKey);
  next = growthApplied.state;
  next = appendEmotionTrend(next, nowIso);
  next = upsertColorCalendar(next, {
    dayKey,
    colorHex: luckyColor.hex,
    colorName: luckyColor.colorName
  });
  next = pushTimeline(next, {
    id: makeId("timeline", nowIso),
    event: `抽到今日幸运色：${luckyColor.colorName}`,
    at: nowIso
  });
  next = appendTaskTimelines(next, growthApplied.newTaskIds, nowIso);
  if (growthApplied.newUnlockedNodeIds.length) {
    next = pushTimeline(next, {
      id: makeId("timeline", nowIso),
      event: `幸运色唤醒了 ${growthApplied.newUnlockedNodeIds.length} 个成长节点`,
      at: nowIso
    });
  }
  if (growthApplied.leveledUp) {
    next = pushSharedMoment(next, {
      id: makeId("shared", nowIso),
      title: `关系升到 Lv.${next.bondState.level}`,
      desc: "今天的幸运色把我们拉近了一点。",
      dayKey,
      at: nowIso,
      key: `bond-level-${next.bondState.level}`,
      milestoneId: `bond-level-${next.bondState.level}`,
      milestoneType: "bond_level",
      scene: activeScene,
      category: "milestone"
    });
  }
  next = pushMilestoneCard(next, {
    id: makeId("card", nowIso),
    title: luckyColor.colorName,
    desc: lineForLuckyColor(luckyColor.colorName),
    mood: "gentle",
    at: nowIso,
    category: "daily"
  });
  if (isFirstDraw && !hasSharedMoment(next, "first-draw")) {
    next = pushSharedMoment(next, {
      id: makeId("shared", nowIso),
      title: "第一次抽到幸运色",
      desc: "小羊卷把第一份颜色送到了你身边。",
      dayKey,
      at: nowIso,
      key: "first-draw",
      milestoneId: "first-draw",
      milestoneType: "first_draw",
      scene: "color",
      category: "first_time"
    });
    next = pushMilestoneCard(next, {
      id: makeId("card", nowIso),
      title: "第一次收下颜色",
      desc: "从今天起，你和小羊卷开始共享幸运色。",
      mood: "gentle",
      at: nowIso,
      milestoneId: "first-draw",
      category: "milestone"
    });
  }
  next = pushMessage(next, {
    role: "sheep",
    text: luckyColor.message,
    at: nowIso,
    channel: "text"
  });
  next = upsertInteractionSummary(next, nowIso);
  next = withDeviceLog(next, {
    id: makeId("devlog", nowIso),
    at: nowIso,
    level: "info",
    type: "daily_color",
    message: `抽取幸运色 ${luckyColor.colorName} (${luckyColor.hex})`
  });
  return next;
}

function applyDailyColor(state: AppRootState, dayKey: string, nowIso: string): AppRootState {
  const luckyColor = drawDailyLuckyColor(dayKey, state.userProfile.userId);
  return applyDailyColorWithLuckyColor(state, dayKey, nowIso, luckyColor);
}

function applyDemoGrowthBoost(state: AppRootState, nowIso: string): AppRootState {
  const nextBondPoints = state.bondState.bondPoints + 48;
  const nextLevel = resolveBondLevelByPoints(nextBondPoints);
  const nextUnlocked = new Set(state.growthState.unlockedNodeIds);
  for (const line of GROWTH_TREE.growthLines) {
    const firstNode = line.nodes[0];
    if (firstNode) nextUnlocked.add(firstNode.nodeId);
  }

  let next: AppRootState = {
    ...state,
    bondState: {
      ...state.bondState,
      bondPoints: nextBondPoints,
      level: nextLevel,
      lastInteractAt: nowIso
    },
    growthState: {
      ...state.growthState,
      colorSense: { ...state.growthState.colorSense, xp: state.growthState.colorSense.xp + 36 },
      expression: { ...state.growthState.expression, xp: state.growthState.expression.xp + 24 },
      companion: { ...state.growthState.companion, xp: state.growthState.companion.xp + 30 },
      islandStory: { ...state.growthState.islandStory, xp: state.growthState.islandStory.xp + 18 },
      unlockedNodeIds: [...nextUnlocked]
    },
    interactionState: {
      ...state.interactionState,
      lastFeedback: {
        at: nowIso,
        scene: state.interactionState.activeScene,
        eventType: "chat_started",
        bondDelta: 48,
        emotionBefore: state.sheepEmotionState.emotion,
        emotionAfter: state.sheepEmotionState.emotion,
        sceneGrowthBonus: {
          bondBonus: 0,
          lineXpBonus: {}
        },
        newTaskIds: [],
        unlockedNodeIds: [...nextUnlocked].filter((item) => !state.growthState.unlockedNodeIds.includes(item))
      }
    }
  };

  next = pushTimeline(next, {
    id: makeId("timeline", nowIso),
    event: "Demo：模拟羁绊增长",
    at: nowIso
  });

  next = pushSharedMoment(next, {
    id: makeId("shared", nowIso),
    title: "Demo 体验加速",
    desc: "演示模式下快速体验了成长解锁。",
    dayKey: dayKeyOf(nowIso),
    at: nowIso,
    key: `demo-boost-${dayKeyOf(nowIso)}`,
    milestoneId: `demo-boost-${dayKeyOf(nowIso)}`,
    milestoneType: "demo_boost",
    scene: state.interactionState.activeScene,
    category: "milestone"
  });

  return next;
}

const DEMO_PRESET_DEFAULT_OPTIONS: Record<DemoScenarioPreset, DemoPresetOptions> = {
  today_first_meet: {
    intensity: "light",
    timeWindow: "day",
    deviceState: "offline",
    bondStage: "intro",
    colorCategory: "soft"
  },
  tonight_tired: {
    intensity: "light",
    timeWindow: "bedtime",
    deviceState: "degraded",
    bondStage: "intro",
    colorCategory: "sleepy"
  },
  companionship_growth: {
    intensity: "light",
    timeWindow: "night",
    deviceState: "ok",
    bondStage: "intro",
    colorCategory: "hope"
  }
};

const DEMO_BASE_COLOR_BY_PRESET: Record<DemoScenarioPreset, string> = {
  today_first_meet: "apricot_mist",
  tonight_tired: "cocoa_night",
  companionship_growth: "rose_dawn"
};

const DEMO_COLOR_BY_CATEGORY: Record<DemoPresetColorCategory, string> = {
  calm: "cloud_blue",
  soft: "apricot_mist",
  energy: "amber_honey",
  hope: "rose_dawn",
  sleepy: "cocoa_night"
};

function normalizeDemoPresetOptions(preset: DemoScenarioPreset, options?: DemoPresetOptions): DemoPresetOptions {
  return {
    ...DEMO_PRESET_DEFAULT_OPTIONS[preset],
    ...(options ?? {})
  };
}

function basePresetTitle(preset: DemoScenarioPreset): string {
  if (preset === "today_first_meet") return "今日第一次见面";
  if (preset === "tonight_tired") return "今晚有点累";
  return "连续陪伴后的关系感";
}

function sceneByTimeWindow(window: DemoPresetTimeWindow, fallback: InteractionScene): InteractionScene {
  if (window === "bedtime") return "bedtime";
  if (window === "night") return fallback === "chat" ? "mood" : fallback;
  return fallback;
}

function interactionByIntensity(scene: InteractionScene, intensity: DemoPresetIntensity): DeviceInputEventType[] {
  if (intensity === "light") return [];
  if (intensity === "medium") return [scene === "bedtime" ? "hug_pressure" : "touch_head"];
  return [scene === "bedtime" ? "hug_pressure" : "touch_head", "proximity_near"];
}

function applyDevicePresetState(state: AppRootState, nowIso: string, deviceState: DemoPresetDeviceState): AppRootState {
  let next = appReducer(state, { type: "DEVICE_CONNECTION_CHANGED", nowIso, connected: deviceState !== "offline" });

  if (deviceState === "offline") {
    return next;
  }

  if (deviceState === "degraded") {
    return appReducer(next, { type: "DEVICE_OUTPUT_SYNC_FAILED", nowIso, error: "demo preset: degraded bridge" });
  }

  if (deviceState === "recovering") {
    next = appReducer(next, { type: "DEVICE_OUTPUT_SYNC_FAILED", nowIso, error: "demo preset: transient bridge" });
    next = appReducer(next, { type: "DEVICE_SYNC_RETRY_REQUESTED", nowIso });
  }

  return appReducer(next, {
    type: "DEVICE_OUTPUT_SYNCED",
    nowIso,
    output: {
      emotion: next.sheepEmotionState.emotion,
      emotion_level: Math.round(next.sheepEmotionState.emotionLevel),
      eye_state: next.sheepVisualState.eyeState,
      eye_color_hex: next.sheepVisualState.eyeColorHex,
      scarf_color: next.sheepVisualState.scarfColorHex,
      scarf_color_hex: next.sheepVisualState.scarfColorHex,
      motion_template: next.sheepVisualState.motionTemplate,
      voice_style: next.sheepVisualState.voiceStyle
    }
  });
}

function applyBondStageBoost(state: AppRootState, nowIso: string, stage: DemoPresetBondStage): AppRootState {
  if (stage === "intro") return state;
  if (stage === "familiar") return appReducer(state, { type: "DEMO_GROWTH_BOOST", nowIso });
  let next = appReducer(state, { type: "DEMO_GROWTH_BOOST", nowIso });
  next = appReducer(next, { type: "DEMO_GROWTH_BOOST", nowIso });
  return next;
}

function applyDemoPreset(
  state: AppRootState,
  preset: DemoScenarioPreset,
  dayKey: string,
  nowIso: string,
  options?: DemoPresetOptions
): AppRootState {
  const resolvedOptions = normalizeDemoPresetOptions(preset, options);
  const colorId =
    getLuckyColorById(DEMO_COLOR_BY_CATEGORY[resolvedOptions.colorCategory])?.colorId ??
    getLuckyColorById(DEMO_BASE_COLOR_BY_PRESET[preset])?.colorId ??
    getLuckyColors()[0]?.colorId ??
    DEMO_BASE_COLOR_BY_PRESET[preset];

  let next = appReducer(state, { type: "DEMO_STATE_RESET", nowIso, dayKey });
  next = appReducer(next, { type: "DEMO_DAILY_COLOR_SET", nowIso, dayKey, colorId });

  if (preset === "today_first_meet") {
    next = appReducer(next, { type: "INTERACTION_SCENE_CHANGED", nowIso, scene: "chat" });
    next = appReducer(next, { type: "CHAT_SENT", nowIso, text: "你好，小羊卷，今天第一次见面。" });
  }

  if (preset === "tonight_tired") {
    next = appReducer(next, { type: "INTERACTION_SCENE_CHANGED", nowIso, scene: "bedtime" });
    next = appReducer(next, { type: "BEDTIME_MODE_STARTED", nowIso });
    next = appReducer(next, { type: "INTERACTION_TRIGGERED", nowIso, interaction: "hug_pressure" });
  }

  if (preset === "companionship_growth") {
    next = appReducer(next, { type: "INTERACTION_SCENE_CHANGED", nowIso, scene: "comfort" });
    next = appReducer(next, { type: "DEMO_GROWTH_BOOST", nowIso });
    next = appReducer(next, { type: "INTERACTION_TRIGGERED", nowIso, interaction: "touch_head" });
    next = appReducer(next, { type: "CHAT_SENT", nowIso, text: "谢谢你一直都在，感觉关系更近了。" });
  }

  const preferredScene =
    preset === "today_first_meet" ? "chat" : preset === "tonight_tired" ? "bedtime" : "comfort";
  const scene = sceneByTimeWindow(resolvedOptions.timeWindow, preferredScene);
  if (scene !== next.interactionState.activeScene) {
    next = appReducer(next, { type: "INTERACTION_SCENE_CHANGED", nowIso, scene });
  }
  if (resolvedOptions.timeWindow === "bedtime") {
    next = appReducer(next, { type: "BEDTIME_MODE_STARTED", nowIso });
  }

  for (const interaction of interactionByIntensity(scene, resolvedOptions.intensity)) {
    next = appReducer(next, { type: "INTERACTION_TRIGGERED", nowIso, interaction });
  }

  next = applyBondStageBoost(next, nowIso, resolvedOptions.bondStage);
  next = applyDevicePresetState(next, nowIso, resolvedOptions.deviceState);

  return pushTimeline(next, {
    id: makeId("timeline", nowIso),
    event: `Demo剧本：${basePresetTitle(preset)} · ${resolvedOptions.intensity}/${resolvedOptions.timeWindow}/${resolvedOptions.deviceState}`,
    at: nowIso
  });
}

function interactionToEvent(interaction: DeviceInputEventType): CompanionEventType {
  return interaction;
}

export function appReducer(state: AppRootState, event: AppEvent): AppRootState {
  if (event.type === "PRODUCT_EVENT_TRACKED") {
    return withTelemetry(state, {
      id: makeId("telemetry", event.nowIso),
      at: event.nowIso,
      traceId: makeId("trace", event.nowIso),
      eventType: "product_event",
      eventName: event.eventName,
      source: event.source,
      status: event.status ?? "info",
      error: null,
      payload: event.payload
    });
  }

  if (event.type === "TAB_CHANGED") {
    return {
      ...state,
      ui: { ...state.ui, activeTab: event.tab }
    };
  }

  if (event.type === "UI_MODAL_CHANGED") {
    return {
      ...state,
      ui: { ...state.ui, activeModal: event.modal }
    };
  }

  if (event.type === "UI_RECORDING_CHANGED") {
    return {
      ...state,
      ui: { ...state.ui, isVoiceRecording: event.recording }
    };
  }

  if (event.type === "UI_DEBUG_PANEL_CHANGED") {
    return {
      ...state,
      ui: { ...state.ui, showDebugPanel: event.visible }
    };
  }

  if (event.type === "UI_QUIET_MODE_CHANGED") {
    return {
      ...state,
      ui: { ...state.ui, quietUI: event.quiet }
    };
  }

  if (event.type === "UI_SCENE_MODE_CHANGED") {
    return {
      ...state,
      ui: { ...state.ui, sceneMode: event.mode }
    };
  }

  if (event.type === "UI_DEMO_MODE_CHANGED") {
    return {
      ...state,
      ui: { ...state.ui, demoMode: event.enabled }
    };
  }

  if (event.type === "INTERACTION_SCENE_CHANGED") {
    const profile = sceneProfileOf(event.scene);
    let next: AppRootState = {
      ...state,
      interactionState: {
        ...state.interactionState,
        activeScene: event.scene
      },
      sheepVisualState: applySceneVisualBias(
        state.sheepVisualState,
        event.scene,
        `${event.nowIso}-${event.scene}`
      ),
      deviceState: {
        ...state.deviceState,
        syncState: state.deviceState.connected ? "pending" : state.deviceState.syncState
      }
    };
    next = pushMessage(next, {
      role: "sheep",
      text: profile.guide,
      at: event.nowIso,
      channel: "text"
    });
    next = pushTimeline(next, {
      id: makeId("timeline", event.nowIso),
      event: `切换互动场景：${sceneLabel(event.scene)}`,
      at: event.nowIso
    });
    return withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "info",
      type: "scene",
      message: `互动场景切换为 ${sceneLabel(event.scene)}`
    });
  }

  if (event.type === "INTERACTION_CONTEXT_CAPTURED") {
    return {
      ...state,
      interactionState: {
        ...state.interactionState,
        contextSnapshot: {
          at: event.nowIso,
          fromTab: event.fromTab,
          sceneMode: state.ui.sceneMode,
          scene: state.interactionState.activeScene,
          colorName: state.dailyColorState.colorName || "未领取",
          colorHex: state.dailyColorState.colorHex || state.sheepVisualState.scarfColorHex,
          emotion: state.sheepEmotionState.emotion
        }
      }
    };
  }

  if (event.type === "USER_PROFILE_UPDATED") {
    return {
      ...state,
      userProfile: {
        ...state.userProfile,
        ...event.patch
      }
    };
  }

  if (event.type === "USER_SURVEY_UPLOAD_STARTED") {
    const current = state.userProfile.surveySubmissions.find((item) => item.id === event.submissionId);
    if (!current) return state;
    const next = updateSurveySubmissionStatus(state, event.submissionId, {
      status: "upload_pending",
      attemptCount: current.attemptCount + 1,
      lastAttemptAt: event.nowIso,
      nextRetryAt: null,
      permanentFailedAt: null,
      lastError: null
    });
    return withTelemetry(next, {
      id: makeId("telemetry", event.nowIso),
      at: event.nowIso,
      traceId: event.submissionId,
      eventType: "survey_upload",
      eventName: "survey_upload_started",
      source: "survey_queue",
      status: "started",
      error: null,
      payload: {
        attempt: current.attemptCount + 1
      }
    });
  }

  if (event.type === "USER_SURVEY_UPLOAD_SUCCEEDED") {
    const next = updateSurveySubmissionStatus(state, event.submissionId, {
      status: "upload_success",
      uploadedAt: event.nowIso,
      nextRetryAt: null,
      permanentFailedAt: null,
      lastError: null
    });
    return withTelemetry(next, {
      id: makeId("telemetry", event.nowIso),
      at: event.nowIso,
      traceId: event.submissionId,
      eventType: "survey_upload",
      eventName: "survey_upload_success",
      source: "survey_queue",
      status: "success",
      error: null
    });
  }

  if (event.type === "USER_SURVEY_UPLOAD_FAILED") {
    const next = updateSurveySubmissionStatus(state, event.submissionId, {
      status: event.permanent ? "upload_permanent_failed" : "upload_failed",
      nextRetryAt: event.nextRetryAt,
      permanentFailedAt: event.permanent ? event.nowIso : null,
      lastError: event.error
    });
    return withTelemetry(next, {
      id: makeId("telemetry", event.nowIso),
      at: event.nowIso,
      traceId: event.submissionId,
      eventType: "survey_upload",
      eventName: "survey_upload_failed",
      source: "survey_queue",
      status: event.permanent ? "permanent_failed" : "failed",
      error: event.error,
      payload: {
        nextRetryAt: event.nextRetryAt ?? "none"
      }
    });
  }

  if (event.type === "MILESTONE_PLACEHOLDER_TRIGGERED") {
    const resolvedDesc = appendMilestoneMeta(event.desc, event.meta);
    let next = pushSharedMoment(state, {
      id: makeId("shared", event.nowIso),
      title: event.title,
      desc: resolvedDesc,
      dayKey: event.dayKey,
      at: event.nowIso,
      key: event.milestoneId,
      milestoneId: event.milestoneId,
      milestoneType: event.milestoneType,
      scene: event.scene ?? state.interactionState.activeScene,
      category: "milestone"
    });
    next = pushMilestoneCard(next, {
      id: makeId("card", event.nowIso),
      title: event.title,
      desc: resolvedDesc,
      mood: "gentle",
      at: event.nowIso,
      milestoneId: event.milestoneId,
      category: "milestone"
    });
    return next;
  }

  if (event.type === "USER_INPUT_MODE_CHANGED") {
    return {
      ...state,
      userProfile: {
        ...state.userProfile,
        preferredInputMode: event.mode
      }
    };
  }

  if (event.type === "APP_BOOTSTRAP") {
    const sameDay = isSameDay(state.bondState.lastCheckInDayKey, event.dayKey);
    const streakDays = updateStreak(state.bondState.lastCheckInDayKey, event.dayKey, state.bondState.streakDays);
    let next: AppRootState = {
      ...state,
      bondState: {
        ...state.bondState,
        streakDays,
        todayInteractCount: sameDay ? state.bondState.todayInteractCount : 0,
        lastCheckInDayKey: event.dayKey,
        lastInteractAt: event.nowIso
      },
      growthState: sameDay ? state.growthState : resetGrowthTracking(state.growthState, event.dayKey)
    };
    if (!sameDay) {
      next = pushTimeline(next, {
        id: makeId("timeline", event.nowIso),
        event: "今天和小羊卷见面了",
        at: event.nowIso
      });
      if ([3, 7, 14].includes(streakDays)) {
        const streakKey = `streak-${streakDays}`;
        next = pushSharedMoment(next, {
          id: makeId("shared", event.nowIso),
          title: `连续陪伴 ${streakDays} 天`,
          desc: "你和小羊卷把陪伴过成了习惯。",
          dayKey: event.dayKey,
          at: event.nowIso,
          key: streakKey,
          milestoneId: streakKey,
          milestoneType: "streak",
          scene: next.interactionState.activeScene,
          category: "streak"
        });
        next = pushMilestoneCard(next, {
          id: makeId("card", event.nowIso),
          title: `连续陪伴 ${streakDays} 天`,
          desc: "这段关系正在慢慢生长。",
          mood: "gentle",
          at: event.nowIso,
          milestoneId: streakKey,
          category: "milestone"
        });
      }
    }
    return applyDailyColor(next, event.dayKey, event.nowIso);
  }

  if (event.type === "DAILY_COLOR_DRAWN") {
    return applyDailyColor(state, event.dayKey, event.nowIso);
  }

  if (event.type === "DEMO_DAILY_COLOR_SET") {
    const selected = getLuckyColorById(event.colorId);
    if (!selected) return state;
    const next = applyDailyColorWithLuckyColor(state, event.dayKey, event.nowIso, selected, true);
    return pushTimeline(next, {
      id: makeId("timeline", event.nowIso),
      event: `Demo：切换幸运色为 ${selected.colorName}`,
      at: event.nowIso
    });
  }

  if (event.type === "DEMO_GROWTH_BOOST") {
    return applyDemoGrowthBoost(state, event.nowIso);
  }

  if (event.type === "DEMO_PRESET_APPLIED") {
    return applyDemoPreset(state, event.preset, event.dayKey, event.nowIso, event.options);
  }

  if (event.type === "DEMO_STATE_RESET") {
    const resetProfile = createInitialUserProfile(event.nowIso);
    const base: AppRootState = {
      userProfile: {
        ...resetProfile,
        userId: state.userProfile.userId,
        nickname: state.userProfile.nickname,
        timezone: state.userProfile.timezone,
        createdAt: state.userProfile.createdAt
      },
      sheepProfile: createInitialSheepProfileState(),
      sheepEmotionState: createInitialSheepEmotionState(event.nowIso),
      sheepVisualState: createInitialSheepVisualState(),
      dailyColorState: createInitialDailyColorState(event.dayKey),
      bondState: createInitialBondState(event.nowIso),
      growthState: createInitialGrowthState(event.dayKey),
      memoryState: createInitialMemoryState(event.nowIso, event.dayKey),
      deviceState: createInitialDeviceState(),
      interactionState: createInitialInteractionState(event.nowIso),
      telemetryState: createInitialTelemetryState(),
      ui: {
        ...state.ui,
        activeTab: "home",
        activeModal: "none",
        isVoiceRecording: false,
        sceneMode: "auto",
        quietUI: false
      }
    };
    return applyDailyColor(base, event.dayKey, event.nowIso);
  }

  if (event.type === "INTERACTION_TRIGGERED") {
    const eventType = interactionToEvent(event.interaction);
    const applied = applyCompanionEvent(state, eventType, event.nowIso);
    let next = applied.state;
    next = pushMessage(next, {
      role: "sheep",
      text: next.sheepVisualState.statusText,
      at: event.nowIso,
      channel: "text"
    });
    const taskHint = getTaskRewardHint(applied.newTaskIds);
    if (taskHint) {
      next = pushMessage(next, {
        role: "sheep",
        text: taskHint,
        at: event.nowIso,
        channel: "text"
      });
    }
    next = {
      ...next,
      deviceState: {
        ...next.deviceState,
        sensors: {
          ...next.deviceState.sensors,
          [event.interaction]: "ok"
        },
        lastSensorEventAt: event.nowIso,
        syncState: "pending"
      }
    };
    return withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "info",
      type: "device_input",
      message: `鏀跺埌浜や簰浜嬩欢 ${event.interaction}`
    });
  }

  if (event.type === "BEDTIME_MODE_STARTED") {
    const stateWithBedtimeScene: AppRootState =
      state.interactionState.activeScene === "bedtime"
        ? state
        : {
            ...state,
            interactionState: {
              ...state.interactionState,
              activeScene: "bedtime"
            }
          };
    const applied = applyCompanionEvent(stateWithBedtimeScene, "bedtime_mode_started", event.nowIso);
    let next = applied.state;
    next = pushMessage(next, {
      role: "sheep",
      text: next.sheepVisualState.statusText,
      at: event.nowIso,
      channel: "text"
    });
    const taskHint = getTaskRewardHint(applied.newTaskIds);
    if (taskHint) {
      next = pushMessage(next, {
        role: "sheep",
        text: taskHint,
        at: event.nowIso,
        channel: "text"
      });
    }
    return next;
  }

  if (event.type === "CHAT_SENT") {
    let next = pushMessage(state, { role: "user", text: event.text, at: event.nowIso, channel: "text" });
    const applied = applyCompanionEvent(next, "chat_started", event.nowIso);
    next = applied.state;
    const replyPipeline = composeCompanionReplyPipeline({
      state: next,
      userText: event.text,
      nowIso: event.nowIso
    });
    const taskHint = getTaskRewardHint(applied.newTaskIds);
    const reply = taskHint ? `${taskHint} ${replyPipeline.replyText}` : replyPipeline.replyText;
    next = {
      ...next,
      sheepVisualState: {
        ...next.sheepVisualState,
        ...replyPipeline.visualPatch,
        statusText: replyPipeline.statusText
      },
      deviceState: {
        ...next.deviceState,
        syncState: "pending"
      }
    };
    next = pushMessage(next, { role: "sheep", text: reply, at: event.nowIso, channel: "text" });
    if (replyPipeline.memoryRecallTag !== "none") {
      next = pushTimeline(next, {
        id: makeId("timeline", event.nowIso),
        event: `回复链已召回${replyPipeline.memoryRecallTag === "relation" ? "关系" : replyPipeline.memoryRecallTag === "ritual" ? "仪式" : "情绪"}记忆`,
        at: event.nowIso
      });
    }
    if (event.text.includes("喜欢") || event.text.includes("想要") || event.text.includes("记得")) {
      next = pushRemembered(next, {
        id: makeId("remember", event.nowIso),
        type: "preference",
        text: event.text,
        at: event.nowIso
      });
    }
    return next;
  }

  if (event.type === "VOICE_INTERACTION") {
    let next = pushMessage(state, { role: "user", text: event.transcript, at: event.nowIso, channel: "voice" });
    const applied = applyCompanionEvent(next, "chat_started", event.nowIso);
    next = applied.state;
    const taskHint = getTaskRewardHint(applied.newTaskIds);
    const replyPipeline = composeCompanionReplyPipeline({
      state: next,
      userText: event.transcript,
      nowIso: event.nowIso
    });
    const voiceLine = taskHint ? `${taskHint} ${replyPipeline.replyText}` : replyPipeline.replyText;
    next = {
      ...next,
      sheepVisualState: {
        ...next.sheepVisualState,
        ...replyPipeline.visualPatch,
        statusText: replyPipeline.statusText
      },
      deviceState: {
        ...next.deviceState,
        syncState: "pending"
      }
    };
    next = pushMessage(next, {
      role: "sheep",
      text: voiceLine,
      at: event.nowIso,
      channel: "voice"
    });
    if (replyPipeline.memoryRecallTag !== "none") {
      next = pushTimeline(next, {
        id: makeId("timeline", event.nowIso),
        event: `语音回复已召回${replyPipeline.memoryRecallTag === "relation" ? "关系" : replyPipeline.memoryRecallTag === "ritual" ? "仪式" : "情绪"}记忆`,
        at: event.nowIso
      });
    }
    return next;
  }

  if (event.type === "EMOTION_TICK") {
    const nextEmotionCore = rollbackEmotionState({
      state: toEngineEmotion(state.sheepEmotionState),
      nowIso: event.nowIso,
      scene: resolveScene(event.nowIso, state.ui.sceneMode)
    });
    const nextEmotion = fromEngineEmotion(state.sheepEmotionState, nextEmotionCore);
    const changed =
      nextEmotion.emotion !== state.sheepEmotionState.emotion ||
      Math.abs(nextEmotion.emotionLevel - state.sheepEmotionState.emotionLevel) >= 0.5;
    if (!changed) return state;

    const nextVisual = applySceneVisualBias(
      deriveVisualState(state.sheepVisualState, state.dailyColorState, nextEmotion, event.nowIso),
      state.interactionState.activeScene,
      `${event.nowIso}-${state.interactionState.activeScene}`
    );
    const next: AppRootState = {
      ...state,
      sheepEmotionState: nextEmotion,
      sheepVisualState: nextVisual,
      deviceState: {
        ...state.deviceState,
        syncState: "pending"
      }
    };
    return appendEmotionTrend(next, event.nowIso);
  }

  if (event.type === "COMPANION_EVENT_TRIGGERED") {
    return applyCompanionEvent(state, event.eventType, event.nowIso).state;
  }

  if (event.type === "GROWTH_TASK_REWARDS_CLEARED") {
    return {
      ...state,
      growthState: {
        ...state.growthState,
        taskRewards: []
      },
      ui: {
        ...state.ui,
        activeModal: "none"
      }
    };
  }

  if (event.type === "DEVICE_CONNECTION_CHANGED") {
    const next: AppRootState = {
      ...state,
      deviceState: {
        ...state.deviceState,
        connected: event.connected,
        deviceId: event.connected ? state.deviceState.deviceId ?? "mock-lambroll-device" : null,
        syncState: event.connected ? state.deviceState.syncState : "ok",
        pendingCommands: event.connected ? state.deviceState.pendingCommands : [],
        lastSyncError: event.connected ? state.deviceState.lastSyncError : null
      }
    };
    return withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "info",
      type: "device_connection",
      message: event.connected ? "设备连接已建立" : "设备连接已断开"
    });
  }

  if (event.type === "DEVICE_STATUS_SYNCED") {
    const next: AppRootState = {
      ...state,
      deviceState: {
        ...state.deviceState,
        battery: event.battery,
        firmware: event.firmware
      }
    };
    return withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "info",
      type: "device_meta",
      message: `设备信息更新 电量:${event.battery ?? "--"} 固件:${event.firmware ?? "--"}`
    });
  }

  if (event.type === "DEVICE_SYNC_MODE_CHANGED") {
    return {
      ...state,
      deviceState: {
        ...state.deviceState,
        syncMode: event.mode
      }
    };
  }

  if (event.type === "DEVICE_SYNC_RETRY_REQUESTED") {
    if (!state.deviceState.pendingCommands.length || !state.deviceState.connected) {
      return state;
    }
    const next: AppRootState = {
      ...state,
      deviceState: {
        ...state.deviceState,
        syncState: "pending",
        lastSyncError: null
      }
    };
    const withLog = withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "info",
      type: "sync_retry",
      message: "已请求重新同步待发送命令"
    });
    return withTelemetry(withLog, {
      id: makeId("telemetry", event.nowIso),
      at: event.nowIso,
      traceId: `device-retry-${event.nowIso}`,
      eventType: "device_sync",
      eventName: "device_sync_retry",
      source: "device_bridge",
      status: "retrying",
      error: null,
      payload: {
        pendingCommands: state.deviceState.pendingCommands.length
      }
    });
  }

  if (event.type === "DEVICE_PENDING_COMMANDS_CLEARED") {
    const next: AppRootState = {
      ...state,
      deviceState: {
        ...state.deviceState,
        pendingCommands: [],
        syncState: state.deviceState.connected ? "ok" : state.deviceState.syncState,
        lastSyncError: null
      }
    };
    return withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "warn",
      type: "queue_cleared",
      message: "待发送命令已清空"
    });
  }

  if (event.type === "DEVICE_COMMAND_ENQUEUED") {
    const next: AppRootState = {
      ...state,
      deviceState: {
        ...state.deviceState,
        syncState: "syncing",
        pendingCommands: [
          ...state.deviceState.pendingCommands,
          {
            commandId: event.commandId,
            queuedAt: event.nowIso,
            output: event.output
          }
        ].slice(-MAX_PENDING_COMMANDS),
        lastSyncError: null
      }
    };
    return withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "info",
      type: "queue_enqueue",
      message: `命令已入队 ${event.commandId}`
    });
  }

  if (event.type === "DEVICE_COMMAND_FLUSHED") {
    const pendingCommands = state.deviceState.pendingCommands.filter((item) => item.commandId !== event.commandId);
    const next: AppRootState = {
      ...state,
      deviceState: {
        ...state.deviceState,
        pendingCommands,
        syncState: pendingCommands.length ? "pending" : state.deviceState.syncState
      }
    };
    return withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "info",
      type: "queue_flush",
      message: `命令已出队 ${event.commandId}`
    });
  }

  if (event.type === "DEVICE_OUTPUT_SYNC_FAILED") {
    let next: AppRootState = {
      ...state,
      deviceState: {
        ...state.deviceState,
        syncState: "error",
        lastSyncError: event.error
      }
    };
    next = pushTimeline(next, {
      id: makeId("timeline", event.nowIso),
      event: "设备同步失败",
      at: event.nowIso
    });
    const withLog = withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "error",
      type: "sync_failed",
      message: event.error
    });
    return withTelemetry(withLog, {
      id: makeId("telemetry", event.nowIso),
      at: event.nowIso,
      traceId: `device-fail-${event.nowIso}`,
      eventType: "device_sync",
      eventName: "device_sync_failed",
      source: "device_bridge",
      status: "failed",
      error: event.error
    });
  }

  if (event.type === "DEVICE_SENSOR_TESTED") {
    const next: AppRootState = {
      ...state,
      deviceState: {
        ...state.deviceState,
        sensors: {
          ...state.deviceState.sensors,
          [event.sensor]: event.status
        },
        lastSensorEventAt: event.nowIso
      }
    };
    return withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: event.status === "ok" ? "info" : "warn",
      type: "sensor_test",
      message: `${event.sensor} 测试${event.status === "ok" ? "通过" : "异常"}`
    });
  }

  if (event.type === "DEVICE_OUTPUT_SYNCED") {
    let next: AppRootState = {
      ...state,
      deviceState: {
        ...state.deviceState,
        syncState: "ok",
        lastOutput: event.output,
        lastSyncedAt: event.nowIso,
        lastSyncError: null,
        lastSuccessfulSync: {
          at: event.nowIso,
          output: event.output
        }
      },
      dailyColorState: {
        ...state.dailyColorState,
        syncStatus: "synced"
      }
    };
    next = pushTimeline(next, {
      id: makeId("timeline", event.nowIso),
      event: "设备同步成功",
      at: event.nowIso
    });
    const dayKey = dayKeyOf(event.nowIso);
    const dayTimeline = next.memoryState.timeline.filter((item) => dayKeyOf(item.at) === dayKey);
    const hasDraw = dayTimeline.some((item) => item.event.includes("抽到今日幸运色"));
    const hasInteraction = dayTimeline.some((item) => item.event.includes("互动："));
    const hasTask = dayTimeline.some((item) => item.event.includes("完成任务："));
    const loopKey = "first-loop-complete";
    if (hasDraw && hasInteraction && hasTask && !hasSharedMoment(next, loopKey)) {
      next = pushSharedMoment(next, {
        id: makeId("shared", event.nowIso),
        title: "第一次完整链路达成",
        desc: "抽色、互动、成长与同步都完成了。",
        dayKey,
        at: event.nowIso,
        key: loopKey,
        milestoneId: loopKey,
        milestoneType: "loop_complete",
        scene: next.interactionState.activeScene,
        category: "loop"
      });
      next = pushMilestoneCard(next, {
        id: makeId("card", event.nowIso),
        title: "完整链路完成",
        desc: "今天的小羊卷陪伴闭环顺利跑通。",
        mood: "gentle",
        at: event.nowIso,
        milestoneId: loopKey,
        category: "milestone"
      });
    }
    const withLog = withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "info",
      type: "sync_ok",
      message: "设备状态同步成功"
    });
    return withTelemetry(withLog, {
      id: makeId("telemetry", event.nowIso),
      at: event.nowIso,
      traceId: `device-sync-${event.nowIso}`,
      eventType: "device_sync",
      eventName: "device_sync_success",
      source: "device_bridge",
      status: "success",
      error: null
    });
  }

  if (event.type === "COLOR_CALIBRATED") {
    const eyeSoftness = clamp(event.eyeSoftness, 0.2, 0.8);
    const nextDailyColorState = {
      ...state.dailyColorState,
      eyeSoftness,
      softHex: softenColor(state.dailyColorState.colorHex, eyeSoftness),
      syncStatus: "pending_device" as const
    };
    const nextVisualState = deriveVisualState(
      state.sheepVisualState,
      nextDailyColorState,
      state.sheepEmotionState,
      event.nowIso
    );
    const next: AppRootState = {
      ...state,
      dailyColorState: nextDailyColorState,
      sheepVisualState: nextVisualState,
      deviceState: {
        ...state.deviceState,
        syncState: "pending"
      }
    };
    return withDeviceLog(next, {
      id: makeId("devlog", event.nowIso),
      at: event.nowIso,
      level: "info",
      type: "color_calibration",
      message: `眼睛柔化系数更新为 ${eyeSoftness.toFixed(2)}`
    });
  }

  return state;
}


