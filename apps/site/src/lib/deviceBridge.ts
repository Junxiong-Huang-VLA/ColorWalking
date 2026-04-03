import deviceProtocolJson from "../config/device-protocol.json";
import mockDeviceEventsJson from "../config/mock-device-events.json";
import type {
  DeviceInputEventPayload,
  DeviceInputEventType,
  DeviceOutputStatePayload,
  DeviceProtocolConfig,
  DeviceRuntimeState,
  MockDeviceEventsConfig
} from "../types/device";
import { validateDeviceProtocolConfig, validateMockDeviceEventsConfig } from "./configValidator";

const DEVICE_PROTOCOL: DeviceProtocolConfig = validateDeviceProtocolConfig(deviceProtocolJson);
const MOCK_DEVICE_EVENTS: MockDeviceEventsConfig = validateMockDeviceEventsConfig(mockDeviceEventsJson);

function isInputEventType(value: string): value is DeviceInputEventType {
  return DEVICE_PROTOCOL.inputEvents.some((item) => item.eventType === value);
}

export function getDeviceProtocolConfig(): DeviceProtocolConfig {
  return DEVICE_PROTOCOL;
}

export function getMockDeviceEventsConfig(): MockDeviceEventsConfig {
  return MOCK_DEVICE_EVENTS;
}

export function listSupportedInputEvents(): DeviceInputEventType[] {
  return DEVICE_PROTOCOL.inputEvents.map((item) => item.eventType);
}

export function parseMockInputEvent(eventType: DeviceInputEventType): DeviceInputEventPayload | null {
  const found = MOCK_DEVICE_EVENTS.events.find((item) => item.eventType === eventType);
  return found ?? null;
}

export function normalizeInputEvent(raw: unknown): DeviceInputEventPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  if (typeof candidate.eventType !== "string" || !isInputEventType(candidate.eventType)) return null;
  const payload = (candidate.payload ?? {}) as Record<string, unknown>;
  const timestamp = typeof payload.timestamp === "string" ? payload.timestamp : new Date().toISOString();
  const source = payload.source === "hardware" ? "hardware" : "mock";
  return {
    eventType: candidate.eventType,
    payload: {
      ...payload,
      timestamp,
      source
    }
  };
}

export function buildOutputStatePayload(
  partial: Partial<DeviceOutputStatePayload>
): DeviceOutputStatePayload {
  return {
    emotion: partial.emotion ?? "soft",
    emotionLevel: partial.emotionLevel ?? 55,
    eyeState: partial.eyeState ?? "half_closed",
    eyeColorHex: partial.eyeColorHex ?? "#C9DBEE",
    scarfColorHex: partial.scarfColorHex ?? "#F5C7A8",
    motionTemplate: partial.motionTemplate ?? "idle_breathe",
    voiceStyle: partial.voiceStyle ?? "soft"
  };
}

export function createMockDeviceRuntime(): DeviceRuntimeState {
  return {
    connected: false,
    battery: 86,
    firmware: "mock-0.1.0",
    lastInputEvent: null,
    lastOutputState: null
  };
}
