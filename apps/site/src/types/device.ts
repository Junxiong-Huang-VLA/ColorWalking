import type { CompanionEmotion, EyeState, MotionTemplate, VoiceStyle } from "./emotion";

export type DeviceInputEventType =
  | "touch_head"
  | "touch_body"
  | "hug_pressure"
  | "proximity_near"
  | "picked_up"
  | "laid_down";

export interface DeviceInputField {
  name: string;
  type: string;
  description: string;
}

export interface DeviceInputEventDefinition {
  eventType: DeviceInputEventType;
  description: string;
  fields: DeviceInputField[];
  mockPayload: Record<string, unknown>;
}

export interface DeviceOutputFieldDefinition {
  name: string;
  type: string;
  description: string;
}

export interface DeviceProtocolConfig {
  version: string;
  inputEvents: DeviceInputEventDefinition[];
  outputState: {
    fields: DeviceOutputFieldDefinition[];
    note: string;
  };
  notes: string[];
}

export interface DeviceInputEventPayload {
  eventType: DeviceInputEventType;
  payload: {
    intensity?: number;
    distance?: number;
    timestamp: string;
    source: "mock" | "hardware";
    [key: string]: unknown;
  };
}

export interface DeviceOutputStatePayload {
  emotion: CompanionEmotion;
  emotionLevel: number;
  eyeState: EyeState;
  eyeColorHex: string;
  scarfColorHex: string;
  motionTemplate: MotionTemplate;
  voiceStyle: VoiceStyle;
}

export interface MockDeviceEventsConfig {
  version: string;
  events: DeviceInputEventPayload[];
}

export interface DeviceRuntimeState {
  connected: boolean;
  battery: number;
  firmware: string;
  lastInputEvent: DeviceInputEventPayload | null;
  lastOutputState: DeviceOutputStatePayload | null;
}
