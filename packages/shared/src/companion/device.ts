import type { DeviceInputEvent, DeviceInputEventType, DeviceOutputState } from "./types";

export const DEVICE_INPUT_EVENT_TYPES: DeviceInputEventType[] = [
  "touch_head",
  "touch_body",
  "hug_pressure",
  "proximity_near",
  "picked_up",
  "laid_down"
];

export interface DeviceAdapter {
  id: string;
  name: string;
  mode: "mock";
  status: "mock-ready";
  getLastOutput: () => DeviceOutputState | null;
  sendState: (state: DeviceOutputState) => Promise<void>;
}

export function createDeviceInputEvent(type: DeviceInputEventType, source: DeviceInputEvent["source"] = "ui"): DeviceInputEvent {
  return {
    type,
    source,
    at: new Date().toISOString()
  };
}

export function createMockDeviceAdapter(onSend?: (state: DeviceOutputState) => void): DeviceAdapter {
  let lastOutput: DeviceOutputState | null = null;
  return {
    id: "mock-lambroll-device",
    name: "LambRoll Mock Device",
    mode: "mock",
    status: "mock-ready",
    getLastOutput: () => lastOutput,
    sendState: async (state: DeviceOutputState) => {
      lastOutput = state;
      onSend?.(state);
    }
  };
}
