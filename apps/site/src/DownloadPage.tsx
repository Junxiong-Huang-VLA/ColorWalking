import { useMemo, useState } from "react";
import { ANDROID_APK_URL, APK_MIRROR_URL } from "./config/experience";

export function DownloadPage() {
  const [copied, setCopied] = useState(false);
  const version = useMemo(() => import.meta.env.VITE_APP_VERSION ?? "v1.0.0", []);
  const updatedAt = useMemo(
    () => import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString().slice(0, 16).replace("T", " "),
    []
  );

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
    <div className="brand-shell download-page">
      <header className="section brand-panel download-hero-v2">
        <div className="download-copy">
          <p className="brand-kicker">LambRoll Isle · Download</p>
          <h1>下载 App</h1>
          <p className="brand-subtitle">今天，也为自己抽一份幸运颜色。</p>
          <p>
            这里是羊卷岛官方下载入口。主下载路径使用品牌域名站内路径，不把第三方长链接作为主入口。
          </p>
          <div className="apk-actions">
            <a className="cta cta-button" href={ANDROID_APK_URL}>下载 Android APK</a>
            <a className="ghost-btn" href={APK_MIRROR_URL}>站内镜像下载</a>
            <button type="button" className="ghost-btn" onClick={onCopy}>
              {copied ? "已复制页面链接" : "复制下载页链接"}
            </button>
          </div>
          <p className="apk-note">主路径：/download/app.apk · 镜像路径：/downloads/lambroll-isle-latest.apk</p>
        </div>
        <div className="sheep-card hero-art">
          <img src="/brand-logo.svg" alt="LambRoll Isle 小羊卷视觉" loading="eager" decoding="async" />
          <p className="hero-art-note">小羊卷会在 App 里继续陪你抽色、记录与互动。</p>
        </div>
      </header>

      <section className="section brand-panel">
        <h2>安装说明（基础版）</h2>
        <div className="grid">
          <article>
            <h3>1. 下载 APK</h3>
            <p>点击上方“下载 Android APK”，在浏览器中完成 APK 下载。</p>
          </article>
          <article>
            <h3>2. 允许安装</h3>
            <p>如遇系统拦截，请在系统设置里允许“安装未知来源应用”。</p>
          </article>
          <article>
            <h3>3. 打开应用</h3>
            <p>安装完成后打开羊卷岛 App，即可体验移动端幸运色与小羊卷陪伴。</p>
          </article>
        </div>
        <p className="apk-note">当前版本（占位）：{version} · 更新日期（占位）：{updatedAt}</p>
      </section>

      <section className="section brand-panel">
        <h2>常见问题（下载）</h2>
        <details className="cw-faq-item">
          <summary>下载后提示无法安装怎么办？</summary>
          <p>先检查系统是否允许未知来源安装，再确认 APK 已完整下载，必要时重新下载一次。</p>
        </details>
        <details className="cw-faq-item">
          <summary>网页端和 App 体验会一致吗？</summary>
          <p>会。今日幸运色主流程、角色语气和品牌节奏会保持一致。</p>
        </details>
        <details className="cw-faq-item">
          <summary>iOS 什么时候支持？</summary>
          <p>当前以 Android 为主，后续会按品牌节奏逐步补齐更多平台支持。</p>
        </details>
      </section>
    </div>
  );
}
