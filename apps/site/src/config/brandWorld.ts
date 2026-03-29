export const ROUTE_PATHS = {
  home: "/",
  lucky: "/lucky-color",
  ip: "/xiaoyangjuan",
  future: "/future",
  about: "/about",
  download: "/download",
  brandManual: "/brand-manual"
} as const;

export const TOP_NAV = [
  { path: ROUTE_PATHS.home, label: "首页" },
  { path: ROUTE_PATHS.lucky, label: "今日幸运色" },
  { path: ROUTE_PATHS.ip, label: "小羊卷" },
  { path: ROUTE_PATHS.download, label: "下载 App" },
  { path: ROUTE_PATHS.about, label: "关于羊卷岛" }
] as const;

export const QUICK_ENTRIES = [
  { title: "今日幸运色", hint: "今天，也为自己抽一份幸运颜色。", path: ROUTE_PATHS.lucky },
  { title: "认识小羊卷", hint: "查看小羊卷设定与角色气质", path: ROUTE_PATHS.ip },
  { title: "下载 App", hint: "Android 下载与安装说明", path: ROUTE_PATHS.download },
  { title: "关于羊卷岛", hint: "品牌故事、理念与世界观", path: ROUTE_PATHS.about },
  { title: "未来陪伴", hint: "玩偶、挂饰、盲盒等轻量预告", path: ROUTE_PATHS.future }
] as const;

export const IP_WORLD = {
  intro:
    "小羊卷来自颜色云岛，是羊卷岛最核心的陪伴角色。它会把每天的幸运色带到你身边，提醒你在忙碌里也给自己一小段温柔时间。",
  personality: ["温柔", "安静", "软乎乎", "不吵闹", "会送来幸运颜色"],
  lore: [
    "颜色云岛是一组漂浮在晨光与晚风之间的小岛，每座岛都保留一种情绪色彩。",
    "小羊卷在岛上收集颜色，把它们整理成你每天抽到的幸运色。",
    "幸运色不是装饰，而是日常里可执行的温柔信号。"
  ]
} as const;

export const IP_GALLERY = [
  { title: "云岛日常形象", detail: "主视觉形象，承担官网与 App 的核心识别。" },
  { title: "表情与动作预览", detail: "点头、抱抱、轻晃等轻陪伴动作，适配桌宠场景。" },
  { title: "桌宠 / 图标形态", detail: "桌宠状态与 App 图标状态统一，保持识别连续性。" }
] as const;

export const SHEEP_QUOTES = [
  "慢慢来也没关系，我会在这里。",
  "今天就做一件小事，也算向前。",
  "先让心情落地，再继续赶路。",
  "你不用很完美，也值得被温柔对待。",
  "抽到的颜色是提醒，不是压力。"
] as const;

export const WEEKLY_THEME = {
  weekTitle: "本周主题：轻呼吸计划",
  subtitle: "每天保留 10 秒，为自己留一格温柔节奏。",
  tasks: ["抽取今日幸运色", "记录一句时色签", "和小羊卷完成一次互动"]
} as const;

export const FUTURE_LABS = [
  { title: "小羊卷玩偶", desc: "软绒材质与可替换配件，保留幸运色设定。" },
  { title: "幸运色挂饰", desc: "以日常通勤为场景，让颜色陪伴可被携带。" },
  { title: "色卡贴纸与手账周边", desc: "把每日颜色带进桌面、手账和生活角落。" },
  { title: "盲盒企划", desc: "围绕小羊卷表情与季节主题，逐步开放预告与预约。" },
  { title: "夜间陪伴小夜灯", desc: "用当天幸运色做呼吸光，承接睡前仪式感。" },
  { title: "更多陪伴内容", desc: "官网持续公开新设定与新企划，不急于重电商化。" }
] as const;

export const FUTURE_ROADMAP = [
  {
    stage: "Now",
    title: "品牌站 + 产品入口",
    detail: "把官网、今日幸运色、小羊卷与下载入口统一为清晰主链路。"
  },
  {
    stage: "Next",
    title: "周边预告与轻预约",
    detail: "先提供预告与意向收集，再逐步上线少量预约能力。"
  },
  {
    stage: "Later",
    title: "长期陪伴生态",
    detail: "围绕小羊卷持续扩展内容、周边和更多日常陪伴场景。"
  }
] as const;

export const SEASONAL_PREVIEWS = [
  { name: "春日轻醒", period: "3-5 月", note: "薄荷与云白，适合重新启动日常节奏。" },
  { name: "夏夜微光", period: "6-8 月", note: "晚风色和夜间陪伴提醒。" },
  { name: "秋日回望", period: "9-11 月", note: "整理阶段性情绪与颜色记忆。" },
  { name: "冬日抱抱", period: "12-2 月", note: "围巾、桌宠与节日签主题。" }
] as const;

export const SUPPORT_CHANNELS = [
  {
    title: "使用支持",
    contact: "support@yangjuandao.com（占位）",
    desc: "下载、安装、同步与常见使用问题。"
  },
  {
    title: "品牌合作",
    contact: "brand@yangjuandao.com（占位）",
    desc: "联名、活动和内容合作沟通。"
  },
  {
    title: "反馈入口",
    contact: "hello@yangjuandao.com（占位）",
    desc: "产品建议、缺陷反馈与体验优化建议。"
  }
] as const;

export const INSTALL_TROUBLESHOOT = [
  "确认下载路径为 /download/app.apk 或 /downloads/lambroll-isle-latest.apk。",
  "若手机提示安装受限，请在系统设置中允许未知来源安装。",
  "若提示包异常，先清理浏览器下载缓存后重新下载。",
  "若版本未更新，请卸载旧版后安装最新 APK。"
] as const;

export const FAQ_ITEMS = [
  {
    q: "羊卷岛是什么？",
    a: "羊卷岛是一个围绕原创 IP 小羊卷展开的陪伴品牌。"
  },
  {
    q: "今日幸运色是做什么的？",
    a: "它是官网与 App 的核心体验：每天抽一份幸运色，获得一句轻提醒。"
  },
  {
    q: "官网和 App 会保持一致吗？",
    a: "会。核心抽色流程、角色语气与体验节奏会保持同一套语义。"
  },
  {
    q: "会直接做商城吗？",
    a: "当前阶段不做重商城，先用轻量预告承载玩偶、挂饰、盲盒与周边方向。"
  }
] as const;




