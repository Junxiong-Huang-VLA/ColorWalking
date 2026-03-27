import { useMemo, useState } from "react";
import { ANDROID_APK_URL, APK_MIRROR_URL } from "./config/experience";

export function DownloadPage() {
  const [opening, setOpening] = useState(false);
  const [copied, setCopied] = useState(false);
  const version = useMemo(() => import.meta.env.VITE_APP_VERSION ?? "v1.0.0", []);
  const updatedAt = useMemo(
    () => import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString().slice(0, 16).replace("T", " "),
    []
  );

  const onDownload = () => {
    if (opening) return;
    setOpening(true);
    window.open(ANDROID_APK_URL, "_blank", "noopener,noreferrer");
    window.setTimeout(() => setOpening(false), 1200);
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="download-page">
      <header className="download-hero">
        <div className="download-copy">
          <p className="tag">ColorWalking App</p>
          <h1>下载 ColorWalking App</h1>
          <p className="slogan">和小羊卷一起，把每日幸运色带在身边</p>
          <p className="desc">
            这是 ColorWalking 的品牌下载页。你可以直接下载 Android APK，后续我们会持续更新版本，让网页和 App
            体验保持同一套温柔节奏。
          </p>
          <div className="apk-actions">
            <button type="button" className="cta cta-button" onClick={onDownload} disabled={opening}>
              {opening ? "正在打开下载..." : "下载 Android 版"}
            </button>
            <a className="ghost-btn" href={APK_MIRROR_URL} target="_blank" rel="noreferrer">
              站内镜像下载
            </a>
            <button type="button" className="ghost-btn" onClick={onCopy}>
              {copied ? "已复制页面链接" : "复制下载页链接"}
            </button>
          </div>
        </div>
        <div className="sheep-card hero-art">
          <img src="/brand-logo.svg" alt="ColorWalking 小羊卷" loading="eager" decoding="async" />
          <p className="hero-art-note">小羊卷会在 App 里继续陪你抽色、记录、慢慢变好。</p>
        </div>
      </header>

      <section className="section apk-download-card">
        <h2>安装说明</h2>
        <div className="grid">
          <article>
            <h3>1. 下载 APK</h3>
            <p>点击上方“下载 Android 版”，在浏览器中完成 APK 下载。</p>
          </article>
          <article>
            <h3>2. 允许安装</h3>
            <p>如遇系统拦截，请在系统设置里允许“安装未知来源应用”。</p>
          </article>
          <article>
            <h3>3. 打开应用</h3>
            <p>安装完成后打开 ColorWalking，即可体验移动端幸运色与小羊卷陪伴。</p>
          </article>
        </div>
        <p className="apk-note">当前版本：{version} · 更新时间：{updatedAt}</p>
      </section>
    </div>
  );
}
