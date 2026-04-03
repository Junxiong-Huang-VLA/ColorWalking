import type { EyeState } from "@colorwalking/shared";
import type { SheepEmotion, SheepExpression, SheepMotion } from "../../state/types";

export function emotionLabel(emotion: SheepEmotion): string {
  if (emotion === "soft") return "柔和";
  if (emotion === "happy") return "开心";
  if (emotion === "sleepy") return "困困";
  if (emotion === "shy") return "害羞";
  if (emotion === "sad") return "低落";
  return "平静";
}

export function expressionLabel(expression: SheepExpression): string {
  if (expression === "blink") return "眨眼";
  if (expression === "smile") return "微笑";
  if (expression === "rest") return "休息";
  return "待机";
}

export function motionLabel(motion: SheepMotion): string {
  if (motion === "nuzzle") return "蹭蹭";
  if (motion === "tiny_hop") return "小跳";
  if (motion === "rest_pose") return "安静停留";
  return "呼吸摆动";
}

export function deriveEyeState(emotion: SheepEmotion, expression: SheepExpression): EyeState {
  if (expression === "rest" || emotion === "sleepy") return "closed";
  if (emotion === "soft" || emotion === "shy" || emotion === "sad") return "half_closed";
  return "open";
}

export function eyeStateLabel(eyeState: EyeState): string {
  if (eyeState === "half_closed") return "半眯";
  if (eyeState === "closed") return "闭眼";
  return "睁眼";
}

