import { sceneProfileOf } from "../../domain/interactionScenes";
import type { InteractionScene, SheepEmotion } from "../../state/types";

const ASSISTANT_KEYWORDS = [
  "写代码",
  "任务",
  "计划",
  "翻译",
  "总结",
  "助手",
  "提醒",
  "生产力"
];

function pickOne(list: string[], seed = Date.now()): string {
  return list[Math.abs(seed) % list.length] ?? list[0];
}

function cleanTone(text: string, maxLen = 24): string {
  let value = text
    .replace(/[!！]+/g, "。")
    .replace(/。{2,}/g, "。")
    .replace(/\s+/g, "")
    .trim();
  if (value.length > maxLen) value = `${value.slice(0, maxLen)}。`;
  if (!value.endsWith("。")) value = `${value}。`;
  return value;
}

export function greetingByTheme(theme: "moon_warm" | "cloud_cool" | "mist_pastel"): string {
  if (theme === "cloud_cool") return "不着急，我在这里。";
  if (theme === "mist_pastel") return "今天也给自己一点温柔。";
  return "慢一点也没关系。";
}

export function lineForLuckyColor(colorName: string): string {
  return cleanTone(`今天是${colorName}。这份颜色送给你。`, 18);
}

export function emotionLine(emotion: SheepEmotion): string {
  if (emotion === "sleepy") return "我有点困，先安静陪你。";
  if (emotion === "sad") return "今天先慢一点，我在。";
  if (emotion === "happy") return "今天有一点轻轻的开心。";
  if (emotion === "shy") return "靠近一点吧，我在这。";
  if (emotion === "soft") return "现在这样就刚刚好。";
  return "我会安静陪着你。";
}

function sceneBaseLine(scene: InteractionScene, colorName: string | null): string {
  if (scene === "color") {
    if (colorName) return lineForLuckyColor(colorName);
    return "先领今天的幸运色吧。";
  }
  if (scene === "bedtime") return "晚一点也没关系。";
  if (scene === "comfort") return "先抱抱自己。";
  if (scene === "mood") return "慢一点也可以。";
  return "我在这里。";
}

export function sceneGuideLine(scene: InteractionScene): string {
  return sceneProfileOf(scene).guide;
}

export function buildSheepReply(
  text: string,
  emotion: SheepEmotion,
  colorName: string | null,
  scene: InteractionScene = "chat"
): string {
  const normalized = text.trim();
  const profile = sceneProfileOf(scene);
  if (!normalized) return cleanTone(sceneBaseLine(scene, colorName), profile.maxReplyLength);

  if (ASSISTANT_KEYWORDS.some((word) => normalized.includes(word))) {
    return cleanTone("这类事我不擅长。我会陪你。", profile.maxReplyLength);
  }
  if (normalized.includes("谢谢") || normalized.includes("感谢")) {
    return cleanTone("谢谢你也在。", profile.maxReplyLength);
  }
  if (normalized.includes("累") || normalized.includes("难过") || normalized.includes("烦")) {
    return cleanTone(scene === "comfort" ? "先慢下来，我在。" : "慢一点也没关系。", profile.maxReplyLength);
  }
  if (normalized.includes("颜色") || normalized.includes("幸运色")) {
    return cleanTone(sceneBaseLine("color", colorName), profile.maxReplyLength);
  }

  return cleanTone(
    pickOne([
      sceneBaseLine(scene, colorName),
      emotionLine(emotion),
      "今天也给自己一点温柔。",
      "不着急，我在这里。"
    ]),
    profile.maxReplyLength
  );
}
