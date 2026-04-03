import type { BondState } from "../types";

export function createInitialBondState(nowIso: string): BondState {
  return {
    level: 1,
    bondPoints: 12,
    streakDays: 0,
    todayInteractCount: 0,
    lastInteractAt: nowIso,
    lastCheckInDayKey: ""
  };
}
