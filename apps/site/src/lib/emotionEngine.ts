import emotionMapJson from "../config/emotion-map.json";
import type { LuckyColorMoodBias } from "../types/color";
import type {
  CompanionEmotion,
  CompanionEventType,
  EmotionMapConfig,
  EmotionState,
  TimeScene
} from "../types/emotion";
import { validateEmotionMapConfig } from "./configValidator";

const EMOTION_MAP_CONFIG: EmotionMapConfig = validateEmotionMapConfig(emotionMapJson);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function secondsBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 1000));
}

function resolveScene(scene: TimeScene): EmotionMapConfig["sceneModifiers"][TimeScene] {
  return EMOTION_MAP_CONFIG.sceneModifiers[scene] ?? EMOTION_MAP_CONFIG.sceneModifiers.daytime;
}

export function getEmotionMapConfig(): EmotionMapConfig {
  return EMOTION_MAP_CONFIG;
}

export function resolveBaseEmotionByCategory(category: string): CompanionEmotion {
  return EMOTION_MAP_CONFIG.baseEmotionByCategory[category] ?? "soft";
}

export function createEmotionStateFromLuckyColor(params: {
  category: string;
  moodBias: LuckyColorMoodBias;
  nowIso: string;
  scene?: TimeScene;
}): EmotionState {
  const scene = resolveScene(params.scene ?? "daytime");
  const baseEmotion = params.moodBias.baseEmotion ?? resolveBaseEmotionByCategory(params.category);
  const baseLevel = clamp(54 + params.moodBias.levelBias + scene.levelOffset, 0, 100);
  const stability = clamp(0.62 + params.moodBias.stabilityBias + scene.stabilityOffset, 0.25, 0.95);
  return {
    emotion: baseEmotion,
    emotionLevel: baseLevel,
    emotionSource: "daily_color_drawn",
    emotionStability: stability,
    baseEmotion,
    baseLevel,
    updatedAt: params.nowIso,
    lastEventAt: params.nowIso
  };
}

export function applyEmotionEvent(params: {
  state: EmotionState;
  eventType: CompanionEventType;
  nowIso: string;
  scene?: TimeScene;
}): EmotionState {
  const rule = EMOTION_MAP_CONFIG.eventOffsets[params.eventType];
  if (!rule) return params.state;

  const rollbackRules = EMOTION_MAP_CONFIG.rollbackRules;
  const scene = resolveScene(params.scene ?? "daytime");
  const passedCooldown = secondsBetween(params.state.updatedAt, params.nowIso) >= rollbackRules.switchCooldownSeconds;
  const shouldSwitch = Boolean(rule.forceSwitch) || passedCooldown || params.state.emotion === rule.targetEmotion;

  return {
    ...params.state,
    emotion: shouldSwitch ? rule.targetEmotion : params.state.emotion,
    emotionLevel: clamp(params.state.emotionLevel + rule.levelDelta + scene.levelOffset * 0.2, 0, 100),
    emotionSource: params.eventType,
    emotionStability: clamp(
      params.state.emotionStability + rule.stabilityDelta + scene.stabilityOffset * 0.15,
      rollbackRules.minStability,
      rollbackRules.maxStability
    ),
    updatedAt: params.nowIso,
    lastEventAt: params.nowIso
  };
}

export function rollbackEmotionState(params: {
  state: EmotionState;
  nowIso: string;
  scene?: TimeScene;
}): EmotionState {
  const scene = resolveScene(params.scene ?? "daytime");
  const rules = EMOTION_MAP_CONFIG.rollbackRules;
  const elapsedSec = secondsBetween(params.state.updatedAt, params.nowIso);
  if (elapsedSec < rules.tickSeconds) return params.state;

  const stepScale = elapsedSec / rules.tickSeconds;
  const recoverRate = rules.recoverRate * stepScale;
  const nextLevel = params.state.emotionLevel + (params.state.baseLevel - params.state.emotionLevel) * recoverRate;
  const idleSec = params.state.lastEventAt ? secondsBetween(params.state.lastEventAt, params.nowIso) : rules.idleRollbackSeconds + 1;
  const nearBase = Math.abs(nextLevel - params.state.baseLevel) <= rules.levelEpsilon;
  const shouldRollbackEmotion = idleSec >= rules.idleRollbackSeconds && nearBase;
  const stability = params.state.emotionStability +
    (rules.stabilityRecoveryTarget + scene.stabilityOffset - params.state.emotionStability) * rules.stabilityRecoveryRate * stepScale;

  return {
    ...params.state,
    emotion: shouldRollbackEmotion ? params.state.baseEmotion : params.state.emotion,
    emotionLevel: clamp(nextLevel, 0, 100),
    emotionSource: shouldRollbackEmotion ? "rollback" : params.state.emotionSource,
    emotionStability: clamp(stability, rules.minStability, rules.maxStability),
    updatedAt: params.nowIso
  };
}
