import { formatDayKey } from "../engine";
import type {
  CompanionEmotion,
  CompanionEventType,
  DeviceOutputState,
  EmotionState,
  GrowthProgress,
  RelationshipState
} from "./types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function previousDayKey(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return formatDayKey(date);
}

function toEmotion(energy: number, comfort: number, socialNeed: number): CompanionEmotion {
  if (energy < 30) return "sleepy";
  if (socialNeed > 74) return "sad";
  if (comfort > 82 && energy > 62) return "happy";
  if (comfort > 66) return "soft";
  if (socialNeed > 58) return "shy";
  return "calm";
}

function eventImpact(eventType: CompanionEventType): { energy: number; comfort: number; socialNeed: number } {
  switch (eventType) {
    case "touch_head":
      return { energy: 2, comfort: 7, socialNeed: -5 };
    case "touch_body":
      return { energy: 1, comfort: 5, socialNeed: -3 };
    case "hug_pressure":
      return { energy: 4, comfort: 10, socialNeed: -8 };
    case "proximity_near":
      return { energy: 1, comfort: 4, socialNeed: -4 };
    case "picked_up":
      return { energy: 2, comfort: 3, socialNeed: -2 };
    case "laid_down":
      return { energy: -2, comfort: 2, socialNeed: 0 };
    case "daily_color_drawn":
    case "daily_check_in":
      return { energy: 3, comfort: 6, socialNeed: -4 };
    case "chat_started":
    case "chat_sent":
      return { energy: 1, comfort: 4, socialNeed: -5 };
    case "voice_listen":
      return { energy: 1, comfort: 4, socialNeed: -4 };
    case "bedtime_mode_started":
    case "gentle_goodnight":
      return { energy: -8, comfort: 3, socialNeed: 1 };
    case "lucky_color_synced":
      return { energy: 2, comfort: 5, socialNeed: -3 };
    default:
      return { energy: 0, comfort: 0, socialNeed: 0 };
  }
}

export function createInitialEmotion(atIso: string): EmotionState {
  return {
    value: "soft",
    energy: 68,
    comfort: 74,
    social_need: 32,
    updated_at: atIso
  };
}

export function decayEmotion(state: EmotionState, now = new Date()): EmotionState {
  const prevMs = new Date(state.updated_at).getTime();
  if (!Number.isFinite(prevMs)) return { ...state, updated_at: now.toISOString() };
  const hours = Math.max(0, (now.getTime() - prevMs) / 3600000);
  if (hours < 0.01) return state;

  const energy = clamp(state.energy - hours * 2.4);
  const comfort = clamp(state.comfort - hours * 1.2);
  const socialNeed = clamp(state.social_need + hours * 2.3);
  return {
    value: toEmotion(energy, comfort, socialNeed),
    energy,
    comfort,
    social_need: socialNeed,
    updated_at: now.toISOString()
  };
}

export function reduceEmotion(state: EmotionState, eventType: CompanionEventType, atIso: string): EmotionState {
  const impact = eventImpact(eventType);
  const energy = clamp(state.energy + impact.energy);
  const comfort = clamp(state.comfort + impact.comfort);
  const socialNeed = clamp(state.social_need + impact.socialNeed);
  return {
    value: toEmotion(energy, comfort, socialNeed),
    energy,
    comfort,
    social_need: socialNeed,
    updated_at: atIso
  };
}

function eventBondGain(eventType: CompanionEventType): number {
  switch (eventType) {
    case "touch_head":
    case "touch_body":
      return 3;
    case "hug_pressure":
      return 6;
    case "proximity_near":
      return 2;
    case "picked_up":
      return 3;
    case "laid_down":
      return 1;
    case "daily_color_drawn":
    case "daily_check_in":
      return 5;
    case "lucky_color_synced":
      return 8;
    case "chat_started":
    case "chat_sent":
      return 4;
    case "voice_listen":
      return 4;
    case "bedtime_mode_started":
    case "gentle_goodnight":
      return 2;
    default:
      return 0;
  }
}

export function createInitialRelationship(atIso: string, dayKey: string): RelationshipState {
  return {
    bond_points: 12,
    bond_level: 1,
    streak_days: 0,
    last_interaction_at: atIso,
    last_check_in_day_key: dayKey
  };
}

export function reduceRelationship(
  state: RelationshipState,
  eventType: CompanionEventType,
  atIso: string,
  dayKey: string
): RelationshipState {
  const bondPoints = state.bond_points + eventBondGain(eventType);
  let streakDays = state.streak_days;
  let lastCheckInDayKey = state.last_check_in_day_key;

  if (eventType === "daily_check_in" || eventType === "daily_color_drawn") {
    if (state.last_check_in_day_key === dayKey) {
      streakDays = Math.max(1, state.streak_days);
    } else if (state.last_check_in_day_key === previousDayKey(dayKey)) {
      streakDays = Math.max(1, state.streak_days) + 1;
    } else {
      streakDays = 1;
    }
    lastCheckInDayKey = dayKey;
  }

  return {
    bond_points: bondPoints,
    bond_level: Math.max(1, Math.floor(bondPoints / 120) + 1),
    streak_days: streakDays,
    last_interaction_at: atIso,
    last_check_in_day_key: lastCheckInDayKey
  };
}

function isCareEvent(eventType: CompanionEventType): boolean {
  return (
    eventType === "touch_head" ||
    eventType === "touch_body" ||
    eventType === "hug_pressure" ||
    eventType === "proximity_near" ||
    eventType === "daily_check_in" ||
    eventType === "daily_color_drawn" ||
    eventType === "lucky_color_synced" ||
    eventType === "chat_started" ||
    eventType === "chat_sent" ||
    eventType === "voice_listen"
  );
}

function pushMilestone(existing: string[], text: string): string[] {
  if (existing.includes(text)) return existing;
  return [...existing, text];
}

export function createInitialGrowth(dayKey: string): GrowthProgress {
  return {
    day_key: dayKey,
    today_care_count: 0,
    total_care_count: 0,
    milestones: []
  };
}

export function reduceGrowth(state: GrowthProgress, eventType: CompanionEventType, dayKey: string): GrowthProgress {
  const sameDay = state.day_key === dayKey;
  const baseToday = sameDay ? state.today_care_count : 0;
  const baseTotal = state.total_care_count;
  const delta = isCareEvent(eventType) ? 1 : 0;
  const todayCareCount = baseToday + delta;
  const totalCareCount = baseTotal + delta;

  let milestones = state.milestones;
  if (totalCareCount >= 7) milestones = pushMilestone(milestones, "一起度过了 7 次陪伴");
  if (totalCareCount >= 21) milestones = pushMilestone(milestones, "陪伴进入稳定期");
  if (totalCareCount >= 49) milestones = pushMilestone(milestones, "拥有了长期默契");

  return {
    day_key: dayKey,
    today_care_count: todayCareCount,
    total_care_count: totalCareCount,
    milestones
  };
}

export function buildDeviceOutput(emotion: EmotionState, scarfColorHex: string): DeviceOutputState {
  const modeByEmotion: Record<
    CompanionEmotion,
    { eyeState: DeviceOutputState["eye_state"]; motion: DeviceOutputState["motion_template"]; voice: DeviceOutputState["voice_style"] }
  > = {
    calm: { eyeState: "open", motion: "idle_breathe", voice: "soft" },
    soft: { eyeState: "half_closed", motion: "nuzzle", voice: "soft" },
    happy: { eyeState: "open", motion: "tiny_hop", voice: "light_bright" },
    sleepy: { eyeState: "closed", motion: "rest_pose", voice: "whisper" },
    shy: { eyeState: "half_closed", motion: "nuzzle", voice: "whisper" },
    sad: { eyeState: "half_closed", motion: "idle_breathe", voice: "whisper" }
  };

  const mapped = modeByEmotion[emotion.value];
  return {
    emotion: emotion.value,
    emotion_level: Math.round(emotion.comfort),
    eye_state: mapped.eyeState,
    scarf_color: scarfColorHex,
    scarf_color_hex: scarfColorHex,
    motion_template: mapped.motion,
    voice_style: mapped.voice
  };
}
