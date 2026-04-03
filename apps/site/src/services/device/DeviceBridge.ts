import type { DeviceInputEventType, DeviceOutputState } from "@colorwalking/shared";

export interface DeviceMeta {
  connected: boolean;
  deviceId: string | null;
  battery: number | null;
  firmware: string | null;
}

export interface DeviceBridge {
  connect: () => Promise<DeviceMeta>;
  disconnect: () => Promise<DeviceMeta>;
  getMeta: () => DeviceMeta;
  sendOutput: (output: DeviceOutputState) => Promise<void>;
  testSensor: (sensor: DeviceInputEventType) => Promise<"ok" | "error">;
}
