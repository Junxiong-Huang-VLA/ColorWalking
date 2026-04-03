import type { EyeState } from "@colorwalking/shared";
import type { CompanionEventType, InteractionScene, SheepExpression, SheepMotion } from "../state/types";

export type SceneGrowthWeight = {
  bondBonus: number;
  lineXpBonus: Partial<Record<"color_sense" | "expression" | "companion" | "island_story", number>>;
};

export type InteractionSceneProfile = {
  scene: InteractionScene;
  guide: string;
  style: string;
  pace: string;
  maxReplyLength: number;
  biasEvent: CompanionEventType;
  statusText: string[];
  expressionCandidates: SheepExpression[];
  motionCandidates: SheepMotion[];
  eyeStateCandidates: EyeState[];
  eyeColorBlendHex: string;
  eyeColorBlendWeight: number;
  atmosphereClass: string;
  rewardFocus: string;
  growthWeight: SceneGrowthWeight;
};

export const INTERACTION_SCENE_PROFILES: Record<InteractionScene, InteractionSceneProfile> = {
  chat: {
    scene: "chat",
    guide: "轻轻说一句今天发生了什么，它会用短句回应你。",
    style: "轻对话、低打扰",
    pace: "中速",
    maxReplyLength: 18,
    biasEvent: "chat_started",
    statusText: ["我在听你说", "慢慢说，我都在", "今天也想陪你聊聊"],
    expressionCandidates: ["idle", "blink", "smile"],
    motionCandidates: ["idle_breathe", "nuzzle"],
    eyeStateCandidates: ["open", "half_closed"],
    eyeColorBlendHex: "#A6C3E8",
    eyeColorBlendWeight: 0.07,
    atmosphereClass: "scene-chat",
    rewardFocus: "聊天更容易推动表达线成长。",
    growthWeight: {
      bondBonus: 1,
      lineXpBonus: { expression: 2 }
    }
  },
  comfort: {
    scene: "comfort",
    guide: "告诉它你的疲惫或压力，它会更偏安抚语气。",
    style: "柔和安抚",
    pace: "慢速",
    maxReplyLength: 16,
    biasEvent: "touch_head",
    statusText: ["先靠近一点", "我会抱住你的情绪", "不用着急，我在这"],
    expressionCandidates: ["blink", "rest", "idle"],
    motionCandidates: ["nuzzle", "idle_breathe"],
    eyeStateCandidates: ["half_closed", "closed"],
    eyeColorBlendHex: "#CFC7EE",
    eyeColorBlendWeight: 0.11,
    atmosphereClass: "scene-comfort",
    rewardFocus: "安抚场景更容易积累陪伴线成长。",
    growthWeight: {
      bondBonus: 2,
      lineXpBonus: { companion: 2 }
    }
  },
  bedtime: {
    scene: "bedtime",
    guide: "进入睡前模式后，节奏会变慢，回应更轻。",
    style: "月夜与低亮度",
    pace: "慢速",
    maxReplyLength: 14,
    biasEvent: "bedtime_mode_started",
    statusText: ["夜里也有我陪着", "先把心放下来", "晚安，我们慢慢安静"],
    expressionCandidates: ["rest", "blink"],
    motionCandidates: ["rest_pose", "idle_breathe"],
    eyeStateCandidates: ["closed", "half_closed"],
    eyeColorBlendHex: "#B5B0D2",
    eyeColorBlendWeight: 0.14,
    atmosphereClass: "scene-bedtime",
    rewardFocus: "睡前场景更容易触发陪伴线与岛屿故事线。",
    growthWeight: {
      bondBonus: 3,
      lineXpBonus: { companion: 3, island_story: 1 }
    }
  },
  mood: {
    scene: "mood",
    guide: "如果你只是想被陪着，不必说很多，它会跟着你的情绪。",
    style: "情绪共振",
    pace: "中慢",
    maxReplyLength: 18,
    biasEvent: "proximity_near",
    statusText: ["我感受到你的心情了", "不用解释太多，我懂", "我们先一起待一会"],
    expressionCandidates: ["blink", "idle", "rest"],
    motionCandidates: ["idle_breathe", "nuzzle"],
    eyeStateCandidates: ["half_closed", "open"],
    eyeColorBlendHex: "#A7BADC",
    eyeColorBlendWeight: 0.09,
    atmosphereClass: "scene-mood",
    rewardFocus: "心情场景会同时推进表达线和陪伴线。",
    growthWeight: {
      bondBonus: 1,
      lineXpBonus: { expression: 1, companion: 1 }
    }
  },
  color: {
    scene: "color",
    guide: "围绕今天的幸运色聊聊感受，它会把颜色写进记忆里。",
    style: "幸运色仪式感",
    pace: "中速",
    maxReplyLength: 18,
    biasEvent: "daily_color_drawn",
    statusText: ["今天的颜色已经落在围巾上", "这份颜色现在属于我们", "我会记住你和这份幸运色"],
    expressionCandidates: ["smile", "idle", "blink"],
    motionCandidates: ["tiny_hop", "idle_breathe", "nuzzle"],
    eyeStateCandidates: ["open", "half_closed"],
    eyeColorBlendHex: "#FFD7B2",
    eyeColorBlendWeight: 0.1,
    atmosphereClass: "scene-color",
    rewardFocus: "幸运色场景优先推动色彩感知线成长。",
    growthWeight: {
      bondBonus: 1,
      lineXpBonus: { color_sense: 3 }
    }
  }
};

export function sceneProfileOf(scene: InteractionScene): InteractionSceneProfile {
  return INTERACTION_SCENE_PROFILES[scene];
}

