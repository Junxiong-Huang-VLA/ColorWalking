export const ROUTE_PATHS = {
  home: "/",
  lucky: "/lucky-color",
  ip: "/xiaoyangjuan",
  future: "/future",
  about: "/about",
  download: "/download"
} as const;

export const TOP_NAV = [
  { path: ROUTE_PATHS.home, label: "Home" },
  { path: ROUTE_PATHS.lucky, label: "Lucky Color" },
  { path: ROUTE_PATHS.ip, label: "Xiaoyangjuan" },
  { path: ROUTE_PATHS.download, label: "Download App" },
  { path: ROUTE_PATHS.future, label: "Future" },
  { path: ROUTE_PATHS.about, label: "About" }
] as const;

export const QUICK_ENTRIES = [
  { title: "今日幸运色", hint: "抽取你的今日颜色", path: ROUTE_PATHS.lucky },
  { title: "小羊卷世界观", hint: "查看IP设定", path: ROUTE_PATHS.ip },
  { title: "下载 App", hint: "安卓安装入口", path: ROUTE_PATHS.download },
  { title: "陪伴未来", hint: "周边与AI陪伴预告", path: ROUTE_PATHS.future },
  { title: "帮助与FAQ", hint: "安装、账号与使用问题", path: ROUTE_PATHS.about }
] as const;

export const IP_WORLD = {
  intro:
    "小羊卷来自‘颜色云岛’，是一只会收集情绪色彩的小陪伴体。它会把你每天抽到的幸运色，编成一句能被记住的温柔提醒。",
  personality: ["慢热但可靠", "会认真记住你的颜色偏好", "不吵闹，偏向轻陪伴", "擅长把复杂情绪翻译成简单行动"],
  lore: [
    "颜色云岛：漂浮在晨光和晚霞之间的群岛，每座小岛都保存一种情绪色。",
    "幸运色陪伴体：像小羊卷这样的角色，会在你抽色后给出行动提醒。",
    "回访仪式：每天只需十秒，完成一次抽色，就算和自己对齐一次。"
  ]
} as const;

export const FUTURE_LABS = [
  { title: "小羊卷玩偶", desc: "软绒材质 + 可替换围巾，绑定你的常用幸运色。" },
  { title: "幸运色围巾系列", desc: "按季度推出色卡与围巾联名套组，支持收藏编号。" },
  { title: "色卡贴纸与挂件", desc: "把每日颜色贴在电脑、手机壳和手账里。" },
  { title: "陪伴夜灯", desc: "根据当天幸运色亮起呼吸灯，做睡前仪式入口。" },
  { title: "桌面陪伴终端", desc: "把小羊卷放进桌面硬件，支持触摸互动和提示。" },
  { title: "AI陪伴路线", desc: "从颜色建议到情绪共创，逐步走向更自然的陪伴体验。" }
] as const;

export const FUTURE_ROADMAP = [
  {
    stage: "Now",
    title: "品牌站 + 产品站联动",
    detail: "统一 Lucky Color、小羊卷、下载入口，建立官网主阵地。"
  },
  {
    stage: "Next",
    title: "数字周边与预约机制",
    detail: "开放围巾系列、色卡贴纸和小羊卷玩偶的预约与活动页。"
  },
  {
    stage: "Later",
    title: "AI陪伴与轻具身终端",
    detail: "从内容陪伴延伸到桌面终端和更持续的情绪协同体验。"
  }
] as const;

export const SEASONAL_PREVIEWS = [
  { name: "春日轻醒计划", period: "3-5月", note: "薄荷色与低压舒缓主题" },
  { name: "夏夜微光企划", period: "6-8月", note: "晚风色与夜间陪伴提醒" },
  { name: "秋日回望周", period: "9-11月", note: "历史颜色回顾与记忆卡片" },
  { name: "冬日抱抱季", period: "12-2月", note: "小羊卷围巾故事与节日签" }
] as const;

export const SUPPORT_CHANNELS = [
  {
    title: "使用支持",
    contact: "support@colorwalking.local",
    desc: "安装、下载、账号与同步问题反馈。"
  },
  {
    title: "品牌合作",
    contact: "brand@colorwalking.local",
    desc: "联名、内容合作与渠道提案。"
  },
  {
    title: "产品建议",
    contact: "GitHub Issues",
    desc: "功能建议、体验反馈与缺陷报告。"
  }
] as const;

export const FAQ_ITEMS = [
  {
    q: "ColorWalking 是工具还是品牌？",
    a: "它从幸运色工具起步，但目标是围绕小羊卷构建长期陪伴 IP。"
  },
  {
    q: "App 和网页会不会不同步？",
    a: "核心体验统一：抽色、时色签、小羊卷养成仓会保持同语义更新。"
  },
  {
    q: "未来会有周边吗？",
    a: "会，当前先做概念与展示，后续逐步开放预约与发售节奏。"
  },
  {
    q: "ColorWalking 会做活动主题吗？",
    a: "会，站点已经预留节日与季节主题入口，后续会按季度上线。"
  }
] as const;
