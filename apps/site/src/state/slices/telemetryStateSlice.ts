import type { TelemetryState } from "../types";

export function createInitialTelemetryState(): TelemetryState {
  return {
    events: []
  };
}
