export const DOWNLOAD_PAGE_PATH = "/download";

export const ANDROID_APK_URL =
  import.meta.env.VITE_ANDROID_APK_URL ?? "/download/app.apk";

export const APK_MIRROR_URL = "/downloads/colorwalking-latest.apk";

export const BRAND_COPY = {
  heroTitle: "ColorWalking",
  heroTag: "每天 10 秒，给心情一点颜色",
  heroSlogan: "Walk in color, walk in mood.",
  heroDesc:
    "ColorWalking 是一个“每日幸运色 + 小羊卷陪伴”的轻治愈网站。每天抽一份颜色，收下一句温柔提醒，让忙碌生活里多一点期待。",
  heroNote: "今天也不用很用力，先让心情有个落点。",
  heroCta: "抽取今日幸运色",
  heroPetCta: "看看小羊卷"
} as const;
