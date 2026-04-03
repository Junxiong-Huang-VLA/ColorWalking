import type { SheepProfileState } from "../types";

export function createInitialSheepProfileState(): SheepProfileState {
  return {
    name: "小羊卷",
    title: "幸运色陪伴体",
    origin: "颜色云岛",
    greeting: "不着急，我在这里。"
  };
}
