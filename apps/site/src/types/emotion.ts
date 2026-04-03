export type CompanionEmotion = "calm" | "soft" | "happy" | "sleepy" | "shy" | "sad";

export type CompanionEventType =
  | "daily_color_drawn"
  | "touch_head"
  | "touch_body"
  | "hug_pressure"
  | "proximity_near"
  | "picked_up"
  | "laid_down"
  | "bedtime_mode_started"
  | "chat_started";

export type EmotionSource = CompanionEventType | "rollback";

export type TimeScene = "daytime" | "night" | "bedtime";

export interface EmotionState {
  emotion: CompanionEmotion;
  emotionLevel: number;
  emotionSource: EmotionSource;
  emotionStability: number;
  baseEmotion: CompanionEmotion;
  baseLevel: number;
  updatedAt: string;
  lastEventAt: string | null;
}

export interface EventEmotionOffsetRule {
  targetEmotion: CompanionEmotion;
  levelDelta: number;
  stabilityDelta: number;
  forceSwitch?: boolean;
}

export interface EmotionRollbackRules {
  tickSeconds: number;
  switchCooldownSeconds: number;
  idleRollbackSeconds: number;
  recoverRate: number;
  levelEpsilon: number;
  stabilityRecoveryTarget: number;
  stabilityRecoveryRate: number;
  minStability: number;
  maxStability: number;
}

export interface TimeSceneModifier {
  levelOffset: number;
  stabilityOffset: number;
  preferredEmotions: CompanionEmotion[];
}

export interface EmotionMapConfig {
  version: string;
  baseEmotionByCategory: Record<string, CompanionEmotion>;
  eventOffsets: Record<CompanionEventType, EventEmotionOffsetRule>;
  rollbackRules: EmotionRollbackRules;
  sceneModifiers: Record<TimeScene, TimeSceneModifier>;
}

export type EyeState = "open" | "half_closed" | "closed";

export type CompanionExpression = "idle" | "blink" | "smile" | "rest";

export type MotionTemplate = "idle_breathe" | "nuzzle" | "tiny_hop" | "rest_pose";

export type VoiceStyle = "soft" | "whisper" | "light_bright";

export interface EyeColorBlendRule {
  hex: string;
  weight: number;
}

export interface EmotionVisualPreset {
  eyeState: EyeState;
  expression: CompanionExpression;
  motionTemplate: MotionTemplate;
  voiceStyle: VoiceStyle;
  statusText: string[];
  eyeColorBlend: EyeColorBlendRule;
}

export interface ExpressionMapConfig {
  version: string;
  emotionVisualMap: Record<CompanionEmotion, EmotionVisualPreset>;
}

export interface VisualStateOutput {
  eyeState: EyeState;
  eyeColorHex: string;
  expression: CompanionExpression;
  motionTemplate: MotionTemplate;
  voiceStyle: VoiceStyle;
  statusText: string;
}
