import { COLOR_PALETTE } from "@colorwalking/shared";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { DownloadPage } from "./DownloadPage";
import { FloatingSheepPet } from "./FloatingSheepPet";
import { LuckyColorOracle } from "./LuckyColorOracle";
import { SheepPetGarden } from "./SheepPetGarden";
import {
  ANDROID_APK_URL,
  APK_MIRROR_URL,
  BRAND_COPY,
  DOWNLOAD_PAGE_PATH
} from "./config/experience";

const LazyWheel = lazy(() => import("./WebLuckyWheel").then((mod) => ({ default: mod.WebLuckyWheel })));
const BUILD_TAG = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString().slice(0, 16).replace("T", " ");

const NAV_ITEMS = [
  { href: "features", label: "产品亮点" },
  { href: "play", label: "幸运转盘" },
  { href: "oracle", label: "黄历生辰" },
  { href: "pet", label: "小羊卷" },
  { href: "mobile-download", label: "下载 App" }
] as const;

export function App() {
  const [activeSection, setActiveSection] = useState("");
  const [copiedId, setCopiedId] = useState<string>("");
  const [downloadOpening, setDownloadOpening] = useState(false);

  const isDownloadRoute = useMemo(() => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    return path === DOWNLOAD_PAGE_PATH;
  }, []);

  useEffect(() => {
    if (isDownloadRoute) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { threshold: [0.2, 0.5], rootMargin: "-60px 0px -40% 0px" }
    );
    NAV_ITEMS.forEach(({ href }) => {
      const el = document.getElementById(href);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [isDownloadRoute]);

  if (isDownloadRoute) {
    return <DownloadPage />;
  }

  const onCopyColor = async (hex: string, id: string) => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      // ignore
    }
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1400);
  };

  const onDownloadApp = () => {
    if (downloadOpening) return;
    setDownloadOpening(true);
    window.open(ANDROID_APK_URL, "_blank", "noopener,noreferrer");
    window.setTimeout(() => setDownloadOpening(false), 1200);
  };

  return (
    <div className="page">
      <nav className="top-nav">
        <div className="nav-brand">ColorWalking</div>
        <div className="nav-links">
          {NAV_ITEMS.map(({ href, label }) => (
            <a key={href} href={`#${href}`} className={activeSection === href ? "nav-active" : ""}>
              {label}
            </a>
          ))}
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <p className="tag">{BRAND_COPY.heroTag}</p>
          <h1>{BRAND_COPY.heroTitle}</h1>
          <p className="slogan">{BRAND_COPY.heroSlogan}</p>
          <p className="desc">{BRAND_COPY.heroDesc}</p>
          <p className="hero-note">{BRAND_COPY.heroNote}</p>
          <div className="actions">
            <a className="cta" href="#play">{BRAND_COPY.heroCta}</a>
            <a className="ghost-btn hero-ghost" href="#pet">{BRAND_COPY.heroPetCta}</a>
            <a className="ghost-btn" href={DOWNLOAD_PAGE_PATH}>下载 App</a>
          </div>
        </div>
        <div className="sheep-card hero-art">
          <img src="/brand-logo.svg" alt="ColorWalking 品牌图标" loading="eager" decoding="async" />
          <p className="hero-art-note">今日小提示：不用很用力，你已经在认真生活了。</p>
        </div>
      </header>

      <section id="features" className="section">
        <h2>产品亮点</h2>
        <div className="grid">
          <article>
            <h3>仪式感抽取</h3>
            <p>每天来一次，点一下转盘，收下一份属于今天的颜色和提醒。</p>
          </article>
          <article>
            <h3>轻陪伴反馈</h3>
            <p>小羊卷会在抽色前后回应你，安静陪伴，不打扰也不缺席。</p>
          </article>
          <article>
            <h3>可回看记录</h3>
            <p>自动保存最近结果，帮你看见情绪变化与颜色轨迹。</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>幸运色样本</h2>
        <div className="palette">
          {COLOR_PALETTE.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip${copiedId === item.id ? " chip-copied" : ""}`}
              onClick={() => onCopyColor(item.hex, item.id)}
              title={`点击复制 ${item.hex}`}
              aria-label={`复制颜色 ${item.name} ${item.hex}`}
            >
              <span style={{ backgroundColor: item.hex }} />
              <b>{item.name}</b>
              <small>{copiedId === item.id ? "已复制" : item.hex}</small>
            </button>
          ))}
        </div>
      </section>

      <section id="growth" className="section start-card">
        <h2>每日小习惯</h2>
        <div className="grid">
          <article>
            <h3>先抽一色</h3>
            <p>用一个小动作开始今天，把节奏从忙乱拉回自己手里。</p>
          </article>
          <article>
            <h3>轻轻分享</h3>
            <p>可以把今天的颜色发给朋友，也可以只留给自己。</p>
          </article>
          <article>
            <h3>慢慢回看</h3>
            <p>回看最近结果，你会发现自己一直在向前走。</p>
          </article>
        </div>
      </section>

      <SheepPetGarden />
      <LuckyColorOracle />

      <section id="play" className="section play-shell">
        <Suspense
          fallback={
            <div className="play-card loading-card">
              <h2>网页幸运转盘</h2>
              <p>正在准备今天的颜色，请稍等一下。</p>
            </div>
          }
        >
          <LazyWheel />
        </Suspense>
      </section>

      <section id="mobile-download" className="section apk-download-card">
        <h2>下载 Android App</h2>
        <p>支持浏览器直接下载 APK。下载入口已统一为品牌化路径，后续可无缝更新版本。</p>
        <div className="apk-actions">
          <button type="button" className="cta cta-button" onClick={onDownloadApp} disabled={downloadOpening}>
            {downloadOpening ? "正在打开下载..." : "下载 Android 版"}
          </button>
          <a className="ghost-btn" href={APK_MIRROR_URL} target="_blank" rel="noreferrer">
            站内下载入口
          </a>
          <a className="ghost-btn" href={DOWNLOAD_PAGE_PATH}>
            打开品牌下载页
          </a>
        </div>
        <p className="apk-note">默认优先使用 `VITE_ANDROID_APK_URL`，未配置时回退到站内下载路径。</p>
      </section>

      <footer className="footer">
        <p>IP 角色：小羊卷</p>
        <p>© 2026 ColorWalking · 愿你每天都有一刻被轻轻安慰。</p>
        <p className="version-badge">版本更新：{BUILD_TAG}</p>
      </footer>

      <FloatingSheepPet />
    </div>
  );
}
