import type { CompanionEventType } from "../state/types";

export const COMPANION_EVENT_ORDER: CompanionEventType[] = [
  "daily_color_drawn",
  "touch_head",
  "touch_body",
  "hug_pressure",
  "proximity_near",
  "picked_up",
  "laid_down",
  "bedtime_mode_started",
  "chat_started"
];

export const COMPANION_EVENT_LABEL: Record<CompanionEventType, string> = {
  daily_color_drawn: "抽取今日幸运色",
  touch_head: "摸摸头",
  touch_body: "轻触身体",
  hug_pressure: "抱抱",
  proximity_near: "靠近",
  picked_up: "抱起来",
  laid_down: "让它休息",
  bedtime_mode_started: "进入睡前模式",
  chat_started: "发起聊天"
};
