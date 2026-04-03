import type { DeviceInputEventType, DeviceOutputState } from "@colorwalking/shared";
import { useAppSelector, useAppStore } from "../store";
import type { AppRootState, DeviceSensorStatus } from "../types";
import { nowIso } from "../../utils/time";

export const deviceSelectors = {
  device: (state: AppRootState) => state.deviceState,
  connected: (state: AppRootState) => state.deviceState.connected,
  syncState: (state: AppRootState) => state.deviceState.syncState,
  syncMode: (state: AppRootState) => state.deviceState.syncMode,
  pendingCommands: (state: AppRootState) => state.deviceState.pendingCommands,
  sensors: (state: AppRootState) => state.deviceState.sensors
};

export function useDeviceStore() {
  const deviceState = useAppSelector(deviceSelectors.device);
  const { dispatch } = useAppStore();

  return {
    deviceState,
    actions: {
      setConnectionChanged: (connected: boolean) => {
        dispatch({ type: "DEVICE_CONNECTION_CHANGED", nowIso: nowIso(), connected });
      },
      setDeviceMeta: (battery: number | null, firmware: string | null) => {
        dispatch({ type: "DEVICE_STATUS_SYNCED", nowIso: nowIso(), battery, firmware });
      },
      setSyncMode: (mode: "app_master" | "device_follow") => {
        dispatch({ type: "DEVICE_SYNC_MODE_CHANGED", mode });
      },
      requestSyncRetry: () => {
        dispatch({ type: "DEVICE_SYNC_RETRY_REQUESTED", nowIso: nowIso() });
      },
      clearPendingCommands: () => {
        dispatch({ type: "DEVICE_PENDING_COMMANDS_CLEARED", nowIso: nowIso() });
      },
      enqueueCommand: (commandId: string, output: DeviceOutputState) => {
        dispatch({ type: "DEVICE_COMMAND_ENQUEUED", nowIso: nowIso(), commandId, output });
      },
      flushCommand: (commandId: string) => {
        dispatch({ type: "DEVICE_COMMAND_FLUSHED", nowIso: nowIso(), commandId });
      },
      markSyncFailed: (error: string) => {
        dispatch({ type: "DEVICE_OUTPUT_SYNC_FAILED", nowIso: nowIso(), error });
      },
      markOutputSynced: (output: DeviceOutputState) => {
        dispatch({ type: "DEVICE_OUTPUT_SYNCED", nowIso: nowIso(), output });
      },
      markSensorTested: (sensor: DeviceInputEventType, status: DeviceSensorStatus) => {
        dispatch({ type: "DEVICE_SENSOR_TESTED", nowIso: nowIso(), sensor, status });
      }
    }
  };
}
