export const ROUTE_PATHS = {
  home: "/",
  lucky: "/lucky-color",
  ip: "/xiaoyangjuan",
  future: "/future",
  about: "/about",
  download: "/download"
} as const;

export const TOP_NAV = [
  { path: ROUTE_PATHS.home, label: "首页" },
  { path: ROUTE_PATHS.lucky, label: "今日幸运色" },
  { path: ROUTE_PATHS.future, label: "关系成长" },
  { path: ROUTE_PATHS.about, label: "共同记忆" },
  { path: ROUTE_PATHS.download, label: "下载 App" },
] as const;

export const QUICK_ENTRIES = [
  { title: "今日幸运色", hint: "今天，也为自己抽一份幸运颜色。", path: ROUTE_PATHS.lucky },
  { title: "关系成长", hint: "查看你和小羊卷已走到哪一步", path: ROUTE_PATHS.future },
  { title: "共同记忆", hint: "回看你们一起经历过的颜色时刻", path: ROUTE_PATHS.about },
  { title: "下载 App", hint: "Android 下载与安装说明", path: ROUTE_PATHS.download },
  { title: "认识小羊卷", hint: "查看角色设定与世界观", path: ROUTE_PATHS.ip }
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





export const COMPANION_PLUSH_SERIES = {
  name: "羊卷岛·小羊卷陪伴玩偶系列",
  oneLiner: "把小羊卷，轻轻放进日常里。",
  intro:
    "和盲盒不同，陪伴玩偶系列更像一种可以被长久留在身边的小小陪伴。它不只是被摆放，也不只是被收藏，而是能出现在书桌、床边、沙发一角，陪你一起度过普通却重要的日常。",
  intro2:
    "在这一系列里，小羊卷会以不同的陪伴状态出现：有的适合安静地放空，有的适合晚安前抱一抱，有的适合放在桌边陪你工作，也有的只是提醒你今天也可以慢一点。"
} as const;

export const COMPANION_PLUSH_ITEMS = [
  {
    name: "抱抱小羊卷",
    keywords: ["柔软", "安慰", "被接住"],
    desc:
      "抱抱款的小羊卷，是最适合放在怀里的一只。它软乎乎的，圆滚滚的，围巾贴着胸前，像一团刚刚好的温柔。有些日子不需要很多话，只需要一个安安静静待在身边的小羊，就已经很够了。",
    packLine: "今天，也给自己一个轻轻的抱抱。",
    scene: "适合放在床边、沙发角或午休时抱一抱。"
  },
  {
    name: "发呆小羊卷",
    keywords: ["安静", "放空", "慢下来"],
    desc:
      "发呆款的小羊卷，像是刚刚坐在小岛边吹过一阵风。它不急着去做什么，也不急着往前走，只是安安静静地待着。这一款很适合放在书桌、窗边或工位一角，提醒你：偶尔发一会儿呆，也没关系。",
    packLine: "有时候，慢下来本身就是一种温柔。",
    scene: "适合放在书桌、窗边和工位。"
  },
  {
    name: "晚安小羊卷",
    keywords: ["安心", "睡前", "被温柔安放"],
    desc:
      "晚安款的小羊卷，像是一天结束前最柔和的一点光。它围着更安静一点的围巾，表情轻轻的，像会在你床边陪你说一句：晚安，今天辛苦啦。它适合待在床头、枕边或灯旁，陪你把一天慢慢放下。",
    packLine: "愿今晚的你，也能被温柔地安放。",
    scene: "适合床头、枕边、小夜灯旁。"
  },
  {
    name: "等你小羊卷",
    keywords: ["陪伴", "守候", "一直在这里"],
    desc:
      "等你款的小羊卷，像一个总会在原地等你回来的人。它不催促，也不喧闹，只是安安静静地站在那里，像在说：没关系呀，我在这儿。这一款适合放在桌边、玄关、显示器旁，像一个很小很轻，却真实存在的陪伴。",
    packLine: "不着急呀，我会一直在这里。",
    scene: "适合桌边、玄关、显示器旁。"
  }
] as const;

export const COMPANION_PLUSH_DOC_STRUCTURE = [
  "系列名 + 系列一句话",
  "款式名 + 关键词（3个）",
  "设定文案（角色状态 / 陪伴场景 / 情绪语气）",
  "包装短句（1句）",
  "摆放建议（书桌 / 床边 / 客厅 / 工位）",
  "材质与尺寸信息（后续补齐）",
  "收束文案（品牌语气统一）"
] as const;

export const COMPANION_PLUSH_CLOSING = [
  "有些陪伴不需要很大声。",
  "它可以是一只放在桌边的小羊，一个睡前会看见的身影，或是一份不说话也会让人安心的存在。",
  "羊卷岛·小羊卷陪伴玩偶系列想做的，就是把这样的温柔，轻轻放进日常里。"
] as const;


