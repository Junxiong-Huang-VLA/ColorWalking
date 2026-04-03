export type BrandCoreCopy = {
  sheepOneLiner: string;
  luckyCompanionDefinition: string;
  yangjuanIslandDefinition: string;
  colorCloudIslandDefinition: string;
  whyNotGenericAi: string;
  softwareFirstReason: string;
};

export type BrandPrimaryCtaId =
  | "try_lucky_color"
  | "enter_sheep_demo"
  | "enter_light_companion_demo"
  | "join_waitlist"
  | "track_physical_progress";

export type BrandPrimaryCta = {
  id: BrandPrimaryCtaId;
  label: string;
  hint: string;
};

export type BrandVisualAssetMapping = {
  id: string;
  source: {
    originFolder: string;
    filename: string;
  };
  publicAssetPath: string;
  websiteUsage: string[];
  demoUsage: string[];
  note: string;
};

const brandCoreCopy: BrandCoreCopy = {
  sheepOneLiner: "小羊卷会把今天的幸运色变成眼神、围巾和一句回应，安静地陪着你。",
  luckyCompanionDefinition:
    "这不是工具型聊天助手，而是一条真实可感的陪伴路径：幸运色、互动、关系成长、共同经历。",
  yangjuanIslandDefinition:
    "你现在体验的是小羊卷数字生命版：先把陪伴感做真实，再把它带到实体版里。",
  colorCloudIslandDefinition:
    "颜色云岛是小羊卷的起点，每天一份幸运色，就是你们今天关系的主线。",
  whyNotGenericAi:
    "小羊卷不追求回答一切问题，只专注把“今天被陪着”的感觉做扎实。",
  softwareFirstReason:
    "当前处于数字生命体验证阶段；实体版在规划中，会继承同一只小羊卷的性格与状态。"
};

const brandPrimaryCtas: BrandPrimaryCta[] = [
  {
    id: "try_lucky_color",
    label: "体验今日幸运色",
    hint: "领取今天的陪伴主色"
  },
  {
    id: "enter_sheep_demo",
    label: "进入互动页",
    hint: "直接和小羊卷开始对话"
  },
  {
    id: "enter_light_companion_demo",
    label: "开始陪伴",
    hint: "进入低打扰互动节奏"
  },
  {
    id: "join_waitlist",
    label: "提交候补意向",
    hint: "留下下一轮体验意向"
  },
  {
    id: "track_physical_progress",
    label: "了解实体版进展",
    hint: "查看数字版与实体版的衔接"
  }
];

const brandVisualAssetMappings: BrandVisualAssetMapping[] = [
  {
    id: "official-main-visual",
    source: {
      originFolder: "product image",
      filename: "f0e5ddf6e44704df3c16c31ff8c2eec5.jpg"
    },
    publicAssetPath: "/images/products/official/sheep-roll-official.jpg",
    websiteUsage: ["HomePage: 首屏主视觉", "ProductPage: 产品主图", "ValidationPage: 候补承接主图"],
    demoUsage: ["Demo Recording: 全链路统一形象"],
    note: "当前线上体验与演示录制统一使用同一主视觉，保证小羊卷形象一致。"
  }
];

export function getBrandCoreCopy(): BrandCoreCopy {
  return brandCoreCopy;
}

export function getBrandPrimaryCtas(): BrandPrimaryCta[] {
  return brandPrimaryCtas;
}

export function getBrandVisualAssetMappings(): BrandVisualAssetMapping[] {
  return brandVisualAssetMappings;
}
