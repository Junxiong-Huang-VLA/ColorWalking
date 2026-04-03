import { buildSheepReply } from "../../features/sheep/sheepCopy";
import { getRoleConfig } from "../../lib";
import { sceneProfileOf } from "../interactionScenes";
import type {
  AppRootState,
  CompanionEventType,
  InteractionScene,
  SheepEmotion,
  SheepVisualState
} from "../../state/types";

type MemoryRecallTag = "relation" | "ritual" | "emotion" | "none";

type VisualPatch = Partial<
  Pick<SheepVisualState, "statusText" | "eyeState" | "expression" | "motionTemplate" | "voiceStyle">
>;

export type CompanionReplyPipelineResult = {
  replyText: string;
  statusText: string;
  memoryRecallTag: MemoryRecallTag;
  recalledSnippet: string | null;
  constitutionApplied: boolean;
  visualPatch: VisualPatch;
};

const ROLE_BANNED_TOKENS = ["助手", "任务", "计划", "翻译", "总结", "客服", "老师", "生产力"];
const STYLE_ANCHORS = ["幸运色", "慢一点", "温柔", "我在这里", "陪你"];

function cleanSentence(text: string): string {
  return text
    .replace(/[!！]+/g, "。")
    .replace(/。{2,}/g, "。")
    .replace(/\s+/g, "")
    .trim();
}

function ensurePeriod(text: string): string {
  if (!text) return "不着急，我在这里。";
  return text.endsWith("。") ? text : `${text}。`;
}

function capLength(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return ensurePeriod(text.slice(0, Math.max(4, maxLen - 1)));
}

function splitSentences(text: string): string[] {
  return cleanSentence(text)
    .split(/[。！？!?]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickBySeed(values: string[], seed: string): string {
  if (!values.length) return "";
  const hash = seed.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return values[Math.abs(hash) % values.length] ?? values[0];
}

function hasStyleAnchor(text: string): boolean {
  return STYLE_ANCHORS.some((item) => text.includes(item));
}

function emotionLabel(emotion: SheepEmotion): string {
  if (emotion === "happy") return "轻轻开心";
  if (emotion === "sleepy") return "有点困";
  if (emotion === "shy") return "想靠近又有点害羞";
  if (emotion === "sad") return "有点低落";
  if (emotion === "calm") return "慢慢平静下来";
  return "变得柔软";
}

function enforceRoleConstitution(raw: string, seed: string, maxLen: number): { text: string; applied: boolean } {
  const role = getRoleConfig();
  const fallback = pickBySeed(role.signatureExpressions, seed) || "不着急，我在这里。";

  const containsBannedToken = ROLE_BANNED_TOKENS.some((item) => raw.includes(item));
  const safeSource = containsBannedToken ? fallback : raw;
  const sentenceParts = splitSentences(safeSource).slice(0, 2);
  let next = sentenceParts.join("。");
  if (!next) next = fallback;
  if (!hasStyleAnchor(next)) {
    const anchor = pickBySeed(role.signatureExpressions, `${seed}-anchor`) || "不着急，我在这里。";
    next = `${next} ${anchor}`;
  }

  next = capLength(ensurePeriod(cleanSentence(next)), maxLen);
  const applied = cleanSentence(raw) !== cleanSentence(next) || containsBannedToken;
  return { text: next, applied };
}

function toMemorySnippet(text: string, maxLen = 10): string {
  const cleaned = cleanSentence(text).replace(/[。！？!?]/g, "");
  if (!cleaned) return "那一刻";
  return cleaned.length <= maxLen ? cleaned : cleaned.slice(0, maxLen);
}

function pickMemoryRecall(
  state: AppRootState,
  userText: string,
  scene: InteractionScene
): { tag: MemoryRecallTag; snippet: string | null } {
  const latestPreference = state.memoryState.rememberedItems.find((item) => item.type === "preference") ?? null;
  const latestRitualMoment =
    state.memoryState.sharedMoments.find((item) =>
      item.milestoneType === "first_bedtime" ||
      item.milestoneType === "streak" ||
      item.milestoneType === "loop_complete"
    ) ?? null;
  const previousEmotion = state.sheepEmotionState.trend
    .slice()
    .reverse()
    .find((item) => item.emotion !== state.sheepEmotionState.emotion);

  const asksRitual = /今晚|晚安|陪我|抱抱|睡前/.test(userText);
  const asksRecall = /记得|上次|我们|一起|还记得/.test(userText);

  if ((asksRitual || scene === "bedtime") && (latestRitualMoment || state.memoryState.bedtimeMemories.length)) {
    const source = latestRitualMoment?.title ?? state.memoryState.bedtimeMemories[0]?.title ?? "晚安";
    return {
      tag: "ritual",
      snippet: `我记得我们的${toMemorySnippet(source, 8)}。`
    };
  }

  if ((asksRecall || latestPreference) && latestPreference) {
    return {
      tag: "relation",
      snippet: `我记得你说过${toMemorySnippet(latestPreference.text, 10)}。`
    };
  }

  if (previousEmotion) {
    return {
      tag: "emotion",
      snippet: `上次你${emotionLabel(previousEmotion.emotion)}时，我们也慢慢走过来了。`
    };
  }

  return { tag: "none", snippet: null };
}

function visualPatchByMemory(tag: MemoryRecallTag, scene: InteractionScene): VisualPatch {
  if (tag === "relation") {
    return {
      eyeState: "half_closed",
      expression: "smile",
      motionTemplate: "nuzzle",
      voiceStyle: "soft"
    };
  }
  if (tag === "ritual") {
    return {
      eyeState: scene === "bedtime" ? "closed" : "half_closed",
      expression: scene === "bedtime" ? "rest" : "blink",
      motionTemplate: scene === "bedtime" ? "rest_pose" : "idle_breathe",
      voiceStyle: "whisper"
    };
  }
  if (tag === "emotion") {
    return {
      eyeState: "half_closed",
      expression: "blink",
      motionTemplate: "idle_breathe",
      voiceStyle: "soft"
    };
  }
  return {};
}

export function composeCompanionReplyPipeline(params: {
  state: AppRootState;
  userText: string;
  nowIso: string;
  scene?: InteractionScene;
}): CompanionReplyPipelineResult {
  const scene = params.scene ?? params.state.interactionState.activeScene;
  const sceneProfile = sceneProfileOf(scene);
  const colorName = params.state.dailyColorState.colorId ? params.state.dailyColorState.colorName : null;
  const baseReply = buildSheepReply(params.userText, params.state.sheepEmotionState.emotion, colorName, scene);
  const memoryRecall = pickMemoryRecall(params.state, params.userText, scene);

  const withMemory = memoryRecall.snippet ? `${memoryRecall.snippet} ${baseReply}` : baseReply;
  const replyConstitution = enforceRoleConstitution(
    withMemory,
    `${params.nowIso}-${scene}-reply`,
    Math.max(sceneProfile.maxReplyLength + 10, 24)
  );
  const statusConstitution = enforceRoleConstitution(
    memoryRecall.snippet ?? params.state.sheepVisualState.statusText,
    `${params.nowIso}-${scene}-status`,
    Math.max(sceneProfile.maxReplyLength, 14)
  );

  return {
    replyText: replyConstitution.text,
    statusText: statusConstitution.text,
    memoryRecallTag: memoryRecall.tag,
    recalledSnippet: memoryRecall.snippet,
    constitutionApplied: replyConstitution.applied || statusConstitution.applied,
    visualPatch: {
      ...visualPatchByMemory(memoryRecall.tag, scene),
      statusText: statusConstitution.text
    }
  };
}

export function resolveEventBehaviorDecision(params: {
  eventType: CompanionEventType;
  scene: InteractionScene;
  colorName: string;
  emotion: SheepEmotion;
  fallbackStatusText: string;
}): VisualPatch {
  if (params.eventType === "touch_head") {
    return {
      statusText: `摸摸头后，${params.colorName}更柔了。`,
      expression: "smile",
      motionTemplate: "nuzzle",
      eyeState: "half_closed"
    };
  }
  if (params.eventType === "hug_pressure") {
    return {
      statusText: `抱抱收到啦，我把${params.colorName}留给你。`,
      expression: "smile",
      motionTemplate: "nuzzle",
      voiceStyle: "soft"
    };
  }
  if (params.eventType === "proximity_near") {
    return {
      statusText: "你靠近时，我会把目光放软一点。",
      eyeState: "half_closed",
      expression: "blink",
      voiceStyle: "whisper"
    };
  }
  if (params.eventType === "bedtime_mode_started" || params.scene === "bedtime") {
    return {
      statusText: "今晚慢一点也没关系，我会守着你。",
      eyeState: "closed",
      expression: "rest",
      motionTemplate: "rest_pose",
      voiceStyle: "whisper"
    };
  }
  if (params.eventType === "daily_color_drawn") {
    return {
      statusText: `今天是${params.colorName}，这份颜色会陪你。`,
      expression: params.emotion === "happy" ? "smile" : "blink",
      motionTemplate: params.emotion === "happy" ? "tiny_hop" : "idle_breathe"
    };
  }
  return {
    statusText: params.fallbackStatusText
  };
}

