export type BrandWorldProfile = {
  worldName: string;
  heroName: string;
  heroTitle: string;
  originStory: string;
  toneKeywords: string[];
};

export type ProductShowcaseItem = {
  id: string;
  name: string;
  category: "companion_plush" | "lucky_color" | "charms" | "packaging";
  siteImagePath: string;
  mobileImageUrl: string;
  note: string;
};

export type CompanionModule = {
  id: "emotion" | "memory" | "interaction" | "device";
  name: string;
  summary: string;
  upgradePath: string;
};

export type DownloadEntry = {
  id: "web_demo";
  label: string;
  href: string;
  hint: string;
};

const SITE_BASE_URL = "https://www.colorful-lamb-rolls.cloud";

const brandWorldProfile: BrandWorldProfile = {
  worldName: "颜色云岛",
  heroName: "小羊卷",
  heroTitle: "幸运色陪伴体",
  originStory:
    "小羊卷来自颜色云岛，会把每天的幸运色变成轻柔陪伴，维持温柔、安静、低打扰的日常节奏。",
  toneKeywords: ["温柔", "安静", "低打扰", "幸运色陪伴", "云朵感", "月夜感", "柔光感"]
};

const productShowcase: ProductShowcaseItem[] = [
  {
    id: "official-main",
    name: "小羊卷官方主图",
    category: "companion_plush",
    siteImagePath: "/images/products/official/sheep-roll-official.jpg",
    mobileImageUrl: `${SITE_BASE_URL}/images/products/official/sheep-roll-official.jpg`,
    note: "来自 product image 文件夹，作为当前展示主素材。"
  },
  {
    id: "plush-rainbow-lineup",
    name: "陪伴毛绒系列",
    category: "companion_plush",
    siteImagePath: "/images/products/companion-plush/plush-series-rainbow-lineup.jpg",
    mobileImageUrl: `${SITE_BASE_URL}/images/products/companion-plush/plush-series-rainbow-lineup.jpg`,
    note: "适合作为实体化版本陈列图。"
  },
  {
    id: "lucky-color-group",
    name: "幸运色摆件系列",
    category: "lucky_color",
    siteImagePath: "/images/products/lucky-color/lucky-color-series-group-standing.jpg",
    mobileImageUrl: `${SITE_BASE_URL}/images/products/lucky-color/lucky-color-series-group-standing.jpg`,
    note: "用于幸运色主题扩展。"
  },
  {
    id: "charm-lineup",
    name: "挂件与周边",
    category: "charms",
    siteImagePath: "/images/products/charms/charm-series-vinyl-6color-lineup.jpg",
    mobileImageUrl: `${SITE_BASE_URL}/images/products/charms/charm-series-vinyl-6color-lineup.jpg`,
    note: "作为候补名单转化期的轻量商品入口。"
  }
];

const companionModules: CompanionModule[] = [
  {
    id: "emotion",
    name: "情绪陪伴",
    summary: "依据互动与幸运色，维持平静、柔和、可持续的情绪反馈。",
    upgradePath: "后续可连接实体表情灯效与呼吸节奏。"
  },
  {
    id: "memory",
    name: "记忆回路",
    summary: "记录日常互动与颜色轨迹，形成低压力的情感记忆。",
    upgradePath: "后续可扩展本地长期记忆与回放。"
  },
  {
    id: "interaction",
    name: "互动中枢",
    summary: "承接文字、语音、场景切换，统一数字生命体交互入口。",
    upgradePath: "后续可接入更完整对话与角色任务系统。"
  },
  {
    id: "device",
    name: "设备联动",
    summary: "保留 App 与实体硬件的同步协议与调试位。",
    upgradePath: "后续可平滑升级为硬件版主控台。"
  }
];

const downloadEntries: DownloadEntry[] = [
  {
    id: "web_demo",
    label: "体验小羊卷 Demo",
    href: SITE_BASE_URL,
    hint: "当前阶段先做纯软件数字生命体验证，再推进实体版联动。"
  }
];

export function getBrandWorldProfile(): BrandWorldProfile {
  return brandWorldProfile;
}

export function getProductShowcase(): ProductShowcaseItem[] {
  return productShowcase;
}

export function getCompanionModules(): CompanionModule[] {
  return companionModules;
}

export function getDownloadEntries(): DownloadEntry[] {
  return downloadEntries;
}
