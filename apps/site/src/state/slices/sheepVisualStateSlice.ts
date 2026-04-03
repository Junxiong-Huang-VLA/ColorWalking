import type { SheepVisualState } from "../types";

export function createInitialSheepVisualState(): SheepVisualState {
  return {
    eyeState: "half_closed",
    eyeColorHex: "#CFDDF8",
    scarfColorHex: "#F7E1B5",
    expression: "idle",
    motionTemplate: "idle_breathe",
    voiceStyle: "soft",
    statusText: "这份颜色，送给今天的你。"
  };
}
