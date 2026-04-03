/**
 * @deprecated 已由 `src/lib/emotionEngine.ts` 接管主链。
 * 保留此文件仅用于历史回溯与对比，不应在新逻辑中继续引用。
 */
import type { CompanionEventType, SheepEmotionState } from "../../state/types";

type EmotionEventRule = {
  targetEmotion: SheepEmotionState["emotion"];
  levelDelta: number;
  stabilityDelta: number;
  forceSwitch?: boolean;
};

export const EMOTION_EVENT_RULES: Record<CompanionEventType, EmotionEventRule> = {
  daily_color_drawn: { targetEmotion: "soft", levelDelta: 6, stabilityDelta: 0.08, forceSwitch: true },
  touch_head: { targetEmotion: "soft", levelDelta: 9, stabilityDelta: 0.08 },
  touch_body: { targetEmotion: "calm", levelDelta: 6, stabilityDelta: 0.06 },
  hug_pressure: { targetEmotion: "happy", levelDelta: 14, stabilityDelta: 0.04 },
  proximity_near: { targetEmotion: "shy", levelDelta: 7, stabilityDelta: 0.05 },
  picked_up: { targetEmotion: "shy", levelDelta: 9, stabilityDelta: -0.03 },
  laid_down: { targetEmotion: "sleepy", levelDelta: 10, stabilityDelta: 0.1 },
  bedtime_mode_started: { targetEmotion: "sleepy", levelDelta: 15, stabilityDelta: 0.12, forceSwitch: true },
  chat_started: { targetEmotion: "soft", levelDelta: 5, stabilityDelta: 0.05 }
};

function clampLevel(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function clampStability(value: number): number {
  return Math.max(0.25, Math.min(0.95, value));
}

function secondsBetween(prevIso: string, nextIso: string): number {
  const prev = new Date(prevIso).getTime();
  const next = new Date(nextIso).getTime();
  if (!Number.isFinite(prev) || !Number.isFinite(next)) return 0;
  return Math.max(0, (next - prev) / 1000);
}

export function resetByLuckyColor(
  state: SheepEmotionState,
  payload: { baseEmotion: SheepEmotionState["emotion"]; levelBias: number; stabilityBias: number },
  atIso: string
): SheepEmotionState {
  const baseLevel = clampLevel(54 + payload.levelBias);
  return {
    ...state,
    emotion: payload.baseEmotion,
    emotionLevel: baseLevel,
    emotionSource: "daily_color_drawn",
    emotionStability: clampStability(0.62 + payload.stabilityBias),
    baseEmotion: payload.baseEmotion,
    baseLevel,
    updatedAt: atIso,
    lastEventAt: atIso
  };
}

export function applyEmotionEvent(
  state: SheepEmotionState,
  eventType: CompanionEventType,
  atIso: string,
  switchCooldownSec = 45
): SheepEmotionState {
  const rule = EMOTION_EVENT_RULES[eventType];
  const cooldownPassed = secondsBetween(state.updatedAt, atIso) >= switchCooldownSec;
  const shouldSwitch = rule.forceSwitch || state.emotion === rule.targetEmotion || cooldownPassed;
  const nextEmotion = shouldSwitch ? rule.targetEmotion : state.emotion;

  return {
    ...state,
    emotion: nextEmotion,
    emotionLevel: clampLevel(state.emotionLevel + rule.levelDelta),
    emotionSource: eventType,
    emotionStability: clampStability(state.emotionStability + rule.stabilityDelta),
    updatedAt: atIso,
    lastEventAt: atIso
  };
}

export function decayEmotionToBase(state: SheepEmotionState, atIso: string): SheepEmotionState {
  const elapsedSec = secondsBetween(state.updatedAt, atIso);
  if (elapsedSec < 20) return state;

  const stepScale = elapsedSec / 30;
  const recoverRate = 0.12 + state.emotionStability * 0.08;
  const nextLevel = state.emotionLevel + (state.baseLevel - state.emotionLevel) * recoverRate * stepScale;
  const nearBase = Math.abs(nextLevel - state.baseLevel) < 2;
  const idleLongEnough = state.lastEventAt ? secondsBetween(state.lastEventAt, atIso) >= 8 * 60 : true;

  return {
    ...state,
    emotion: nearBase && idleLongEnough ? state.baseEmotion : state.emotion,
    emotionLevel: clampLevel(nextLevel),
    emotionSource: nearBase ? "rollback" : state.emotionSource,
    emotionStability: clampStability(state.emotionStability + (0.68 - state.emotionStability) * 0.08 * stepScale),
    updatedAt: atIso
  };
}
