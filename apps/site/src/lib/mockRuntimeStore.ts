import type { DailyLuckyColorRecord } from "../types/color";
import type { DeviceRuntimeState, DeviceOutputStatePayload } from "../types/device";
import type { EmotionState } from "../types/emotion";
import type { GrowthRuntimeState } from "../types/growth";
import { createMockDeviceRuntime } from "./deviceBridge";
import { createMockGrowthRuntime } from "./growthEngine";

const STORAGE_KEY = "xiao-yang-juan.runtime.v1";

export interface RuntimeUserProfile {
  userId: string;
  nickname: string;
  timezone: string;
  createdAt: string;
}

export interface RuntimeBondState {
  bondPoints: number;
  bondLevel: number;
  streakDays: number;
  todayInteractCount: number;
  lastInteractAt: string;
}

export interface RuntimeChatMessage {
  id: string;
  role: "user" | "sheep";
  text: string;
  at: string;
}

export interface RuntimeMemoryItem {
  id: string;
  kind: "moment" | "preference";
  summary: string;
  at: string;
}

export interface CompanionRuntimeState {
  userProfile: RuntimeUserProfile;
  bondState: RuntimeBondState;
  currentEmotion: EmotionState;
  luckyColorHistory: DailyLuckyColorRecord[];
  growthState: GrowthRuntimeState;
  chatHistory: RuntimeChatMessage[];
  memoryState: RuntimeMemoryItem[];
  deviceState: DeviceRuntimeState;
  lastOutputState: DeviceOutputStatePayload | null;
  updatedAt: string;
}

function defaultEmotion(nowIso: string): EmotionState {
  return {
    emotion: "soft",
    emotionLevel: 56,
    emotionSource: "rollback",
    emotionStability: 0.65,
    baseEmotion: "soft",
    baseLevel: 56,
    updatedAt: nowIso,
    lastEventAt: null
  };
}

export function createDefaultRuntimeState(nowIso = new Date().toISOString(), dayKey = "2026-04-01"): CompanionRuntimeState {
  return {
    userProfile: {
      userId: "mock-user",
      nickname: "今天的你",
      timezone: "Asia/Shanghai",
      createdAt: nowIso
    },
    bondState: {
      bondPoints: 12,
      bondLevel: 1,
      streakDays: 0,
      todayInteractCount: 0,
      lastInteractAt: nowIso
    },
    currentEmotion: defaultEmotion(nowIso),
    luckyColorHistory: [],
    growthState: createMockGrowthRuntime(dayKey),
    chatHistory: [],
    memoryState: [],
    deviceState: createMockDeviceRuntime(),
    lastOutputState: null,
    updatedAt: nowIso
  };
}

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadRuntimeState(): CompanionRuntimeState {
  const storage = safeStorage();
  if (!storage) return createDefaultRuntimeState();
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return createDefaultRuntimeState();
  try {
    const parsed = JSON.parse(raw) as Partial<CompanionRuntimeState>;
    const base = createDefaultRuntimeState();
    return {
      ...base,
      ...parsed,
      userProfile: parsed.userProfile ? { ...base.userProfile, ...parsed.userProfile } : base.userProfile,
      bondState: parsed.bondState ? { ...base.bondState, ...parsed.bondState } : base.bondState,
      currentEmotion: parsed.currentEmotion ? { ...base.currentEmotion, ...parsed.currentEmotion } : base.currentEmotion,
      growthState: parsed.growthState ? { ...base.growthState, ...parsed.growthState } : base.growthState,
      deviceState: parsed.deviceState ? { ...base.deviceState, ...parsed.deviceState } : base.deviceState,
      luckyColorHistory: parsed.luckyColorHistory ?? base.luckyColorHistory,
      chatHistory: parsed.chatHistory ?? base.chatHistory,
      memoryState: parsed.memoryState ?? base.memoryState
    };
  } catch {
    return createDefaultRuntimeState();
  }
}

export function saveRuntimeState(state: CompanionRuntimeState): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function patchRuntimeState(patch: Partial<CompanionRuntimeState>): CompanionRuntimeState {
  const current = loadRuntimeState();
  const next: CompanionRuntimeState = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  saveRuntimeState(next);
  return next;
}
