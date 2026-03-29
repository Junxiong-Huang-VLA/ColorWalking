export const DOWNLOAD_PAGE_PATH = "/download";

export const SITE_DOMAIN = "https://www.colorful-lamb-rolls.cloud";
const APK_CACHE_BUSTER = encodeURIComponent(import.meta.env.VITE_BUILD_TIME ?? String(Date.now()));
const APK_MAIN_PATH = "/download/app.apk";
const APK_MIRROR_PATH = "/downloads/lambroll-isle-latest.apk";

function withCacheBuster(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}v=${APK_CACHE_BUSTER}`;
}

export const ANDROID_APK_URL = withCacheBuster(APK_MAIN_PATH);
export const APK_MIRROR_URL = withCacheBuster(APK_MIRROR_PATH);

export const BRAND_COPY = {
  brandName: "LambRoll Isle",
  brandNameCn: "羊卷岛",
  slogan: "让陪伴有颜色。",
  productSlogan: "今天，也为自己抽一份幸运颜色。",
  oneLiner: "羊卷岛是一个围绕原创 IP 小羊卷展开的陪伴品牌。",
  heroTitle: "今天，也为自己抽一份幸运颜色。",
  heroTag: "LambRoll Isle · 颜色云岛入口",
  heroSlogan: "让陪伴有颜色。",
  heroDesc:
    "从今日幸运色到小羊卷桌宠，LambRoll Isle（羊卷岛）把每天的小仪式变成可被记住的陪伴体验。先抽一份幸运颜色，再带着它去过今天。",
  heroNote: "LambRoll Isle / 让陪伴有颜色。"
} as const;




