export const BRAND_CORE_COPY = {
  sheepOneLiner: "小羊卷会把今天的幸运色变成眼神、围巾和一句回应，安静地陪着你。",
  luckyCompanionDefinition:
    "它不是工具型聊天助手，而是一条真实可感的陪伴路径：幸运色、互动、关系成长、共同记忆。",
  yangjuanIslandDefinition:
    "羊卷岛是小羊卷的主场。你现在体验的是它的数字生命版，先把陪伴感做真实，再走向实体版。",
  colorCloudIslandDefinition:
    "颜色云岛是每天幸运色诞生的地方，幸运色会直接影响当天互动氛围。",
  whyNotGenericAi:
    "小羊卷不追求回答一切问题，只专注把“今天被陪着”的感觉做扎实。",
  softwareFirstReason:
    "当前处于数字生命体验验证阶段；实体版在规划中，会继承同一只小羊卷的性格与状态。"
} as const;

export const BRAND_PRIMARY_CTAS = {
  try_lucky_color: "体验今日幸运色",
  enter_sheep_demo: "进入互动页",
  enter_light_companion_demo: "开始陪伴",
  join_waitlist: "提交候补意向",
  track_physical_progress: "了解实体版进展"
} as const;

export const BRAND_WORLD_PROFILE = {
  heroName: "小羊卷",
  heroTitle: "幸运色陪伴体",
  toneKeywords: ["温柔", "安静", "低打扰", "云朵感", "月夜感", "柔光感"]
} as const;

export const COMPANION_MODULES = [
  {
    id: "emotion",
    name: "情绪陪伴",
    summary: "依据互动与幸运色，维持平静、柔和、可持续的情绪反馈。"
  },
  {
    id: "memory",
    name: "记忆回路",
    summary: "记录日常互动与颜色轨迹，形成低压力的情感记忆。"
  },
  {
    id: "interaction",
    name: "互动中枢",
    summary: "承接文字、语音、场景切换，统一数字生命体交互入口。"
  },
  {
    id: "device",
    name: "设备联动",
    summary: "保留 App 与实体硬件的同步协议与调试位。"
  }
] as const;
