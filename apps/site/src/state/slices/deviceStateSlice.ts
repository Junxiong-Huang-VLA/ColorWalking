import { DEVICE_INPUT_EVENT_TYPES } from "@colorwalking/shared";
import type { DeviceState } from "../types";

export function createInitialDeviceState(): DeviceState {
  const sensors = Object.fromEntries(DEVICE_INPUT_EVENT_TYPES.map((type) => [type, "unknown"])) as DeviceState["sensors"];
  return {
    connected: false,
    deviceId: null,
    battery: null,
    firmware: null,
    syncState: "ok",
    syncMode: "app_master",
    pendingCommands: [],
    sensors,
    lastSensorEventAt: null,
    lastOutput: null,
    lastSyncedAt: null,
    lastSyncError: null,
    lastSuccessfulSync: null,
    recentEventLogs: []
  };
}
