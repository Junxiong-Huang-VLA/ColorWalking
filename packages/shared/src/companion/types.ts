import type { ColorItem } from "../colors";

export type CompanionEmotion = "calm" | "soft" | "happy" | "sleepy" | "shy" | "sad";

export type EyeState = "open" | "half_closed" | "closed";

export type MotionTemplate = "idle_breathe" | "nuzzle" | "tiny_hop" | "rest_pose";

export type VoiceStyle = "soft" | "whisper" | "light_bright";

export type DeviceInputEventType =
  | "touch_head"
  | "touch_body"
  | "hug_pressure"
  | "proximity_near"
  | "picked_up"
  | "laid_down";

export interface DeviceInputEvent {
  type: DeviceInputEventType;
  at: string;
  source: "ui" | "hardware";
  intensity?: number;
}

export interface DeviceOutputState {
  emotion: CompanionEmotion;
  emotion_level?: number;
  eye_state: EyeState;
  eye_color_hex?: string;
  scarf_color: string;
  scarf_color_hex?: string;
  motion_template: MotionTemplate;
  voice_style: VoiceStyle;
}

export interface UserProfile {
  id: string;
  nickname: string;
  timezone: string;
  created_at: string;
}

export interface LuckyColorRecord {
  id: string;
  day_key: string;
  color: ColorItem;
  synced_at: string;
  source: "daily_draw";
}

export interface RelationshipState {
  bond_points: number;
  bond_level: number;
  streak_days: number;
  last_interaction_at: string;
  last_check_in_day_key: string;
}

export interface EmotionState {
  value: CompanionEmotion;
  energy: number;
  comfort: number;
  social_need: number;
  updated_at: string;
}

export interface GrowthProgress {
  day_key: string;
  today_care_count: number;
  total_care_count: number;
  milestones: string[];
}

export type MemoryKind = "moment" | "preference" | "daily_summary";

export interface CompanionMemory {
  id: string;
  kind: MemoryKind;
  summary: string;
  detail?: string;
  created_at: string;
  day_key: string;
}

export interface CharacterConfig {
  id: "xiao-yang-juan";
  name: string;
  title: string;
  origin: string;
  traits: string[];
  tone_rules: string[];
  boundaries: string[];
  lines: {
    greeting: string[];
    comfort: string[];
    gratitude: string[];
    sleepy: string[];
    lucky_color: string[];
  };
}

export type CompanionEventType =
  | DeviceInputEventType
  | "daily_color_drawn"
  | "chat_started"
  | "bedtime_mode_started"
  | "daily_check_in"
  | "lucky_color_synced"
  | "chat_sent"
  | "voice_listen"
  | "gentle_goodnight";

export interface CompanionEvent {
  id: string;
  type: CompanionEventType;
  at: string;
  source: "app" | "device";
  note?: string;
}

export interface CompanionChatMessage {
  id: string;
  role: "user" | "sheep";
  text: string;
  at: string;
  channel: "text" | "voice";
}

export interface CompanionAppState {
  user: UserProfile;
  character: CharacterConfig;
  today_lucky_color: LuckyColorRecord | null;
  lucky_color_history: LuckyColorRecord[];
  relationship: RelationshipState;
  emotion: EmotionState;
  growth: GrowthProgress;
  memories: CompanionMemory[];
  event_log: CompanionEvent[];
  chats: CompanionChatMessage[];
}
