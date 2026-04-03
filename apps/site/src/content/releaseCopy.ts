import type { DemoPresetOptions, DemoScenarioPreset, InteractionScene } from "../state/types";

export type PresentationMode = "default" | "investor" | "video";

export const RELEASE_NARRATIVE = {
  sheepIdentity: "小羊卷是会回应你、会成长、会记住你的数字生命伙伴。",
  yangjuanIsland: "羊卷岛是小羊卷长期陪伴关系发生的主场。",
  colorCloudIsland: "颜色云岛是每天幸运色诞生的地方，决定当天的互动氛围。",
  notGenericAi: "它不是答题聊天工具，而是把“被陪伴”做成可见状态与长期记忆。",
  softwareFirst: "我们先验证数字生命体验成立，再把同一只小羊卷带进实体版。",
  experienceNow: "你现在可以抽幸运色、互动、看关系成长、回看记忆，并留下实体意向。",
  physicalRelation: "实体版会继承同一只小羊卷的颜色、情绪和关系脉络，不是新建账号。",
  waitlistPromise: "加入候补名单后，你会进入首批体验与实体版预约触达队列，提交失败也可重试。"
} as const;

export const INVESTOR_PRESENTATION_PATH: Array<{
  id: "home" | "color" | "interaction" | "growth" | "memory" | "validation";
  title: string;
  focus: string;
  durationHint: string;
}> = [
  { id: "home", title: "活着的小羊卷", focus: "它是谁", durationHint: "0-12s" },
  { id: "color", title: "抽今日幸运色", focus: "它为什么特别", durationHint: "12-22s" },
  { id: "interaction", title: "即时互动回应", focus: "它现在能做什么", durationHint: "22-40s" },
  { id: "growth", title: "关系成长", focus: "关系不是一次性对话", durationHint: "40-55s" },
  { id: "memory", title: "记忆沉淀", focus: "关系会留下痕迹", durationHint: "55-72s" },
  { id: "validation", title: "候补名单承接", focus: "为什么值得做实体版", durationHint: "72-90s" }
];

export type VideoScriptConfig = {
  preset: DemoScenarioPreset;
  title: string;
  oneLiner: string;
  durationHint: string;
  initialState: {
    colorCategory: DemoPresetOptions["colorCategory"];
    scene: InteractionScene;
    bondStage: DemoPresetOptions["bondStage"];
    deviceState: DemoPresetOptions["deviceState"];
    timeWindow: DemoPresetOptions["timeWindow"];
  };
  presetOptions: DemoPresetOptions;
  shotOrder: string[];
  interactionCue: string;
};

export const VIDEO_SCRIPT_CONFIG: Record<DemoScenarioPreset, VideoScriptConfig> = {
  today_first_meet: {
    preset: "today_first_meet",
    title: "今日第一次见面",
    oneLiner: "第一眼看到它活着，然后被温柔回应。",
    durationHint: "30-45秒",
    initialState: {
      colorCategory: "soft",
      scene: "chat",
      bondStage: "intro",
      deviceState: "ok",
      timeWindow: "day"
    },
    presetOptions: {
      intensity: "light",
      timeWindow: "day",
      deviceState: "ok",
      bondStage: "intro",
      colorCategory: "soft"
    },
    shotOrder: ["首屏", "抽色", "互动回应", "成长", "记忆", "候补名单"],
    interactionCue: "轻触头部 + 第一句问候"
  },
  tonight_tired: {
    preset: "tonight_tired",
    title: "今晚有点累",
    oneLiner: "从夜间氛围进入，被接住而不是被打断。",
    durationHint: "40-55秒",
    initialState: {
      colorCategory: "sleepy",
      scene: "bedtime",
      bondStage: "familiar",
      deviceState: "degraded",
      timeWindow: "bedtime"
    },
    presetOptions: {
      intensity: "medium",
      timeWindow: "bedtime",
      deviceState: "degraded",
      bondStage: "familiar",
      colorCategory: "sleepy"
    },
    shotOrder: ["首屏", "抽色", "睡前互动", "成长反馈", "记忆回看", "候补名单"],
    interactionCue: "拥抱触发 + 睡前一句话"
  },
  companionship_growth: {
    preset: "companionship_growth",
    title: "连续陪伴后的关系感",
    oneLiner: "关系会累积，不会在每次会话后归零。",
    durationHint: "50-65秒",
    initialState: {
      colorCategory: "hope",
      scene: "comfort",
      bondStage: "close",
      deviceState: "ok",
      timeWindow: "night"
    },
    presetOptions: {
      intensity: "medium",
      timeWindow: "night",
      deviceState: "ok",
      bondStage: "close",
      colorCategory: "hope"
    },
    shotOrder: ["首屏", "抽色", "互动回应", "关系成长", "记忆沉淀", "候补名单"],
    interactionCue: "触摸 + 已熟悉语气对话"
  }
};
