import { COLOR_PALETTE } from "@colorwalking/shared";
import { Suspense, lazy, useEffect, useState } from "react";
import { FloatingSheepPet } from "./FloatingSheepPet";
import { LuckyColorOracle } from "./LuckyColorOracle";
import { SheepPetGarden } from "./SheepPetGarden";

const LazyWheel = lazy(() => import("./WebLuckyWheel").then((mod) => ({ default: mod.WebLuckyWheel })));
const BUILD_TAG = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString().slice(0, 16).replace("T", " ");
const APK_DOWNLOAD_URL =
  import.meta.env.VITE_ANDROID_APK_URL ??
  "https://github.com/Junxiong-Huang-VLA/ColorWalking/releases/latest/download/colorwalking-latest.apk";

const NAV_ITEMS = [
  { href: "features", label: "产品亮点" },
  { href: "play",     label: "幸运转盘" },
  { href: "oracle",   label: "时色签"   },
  { href: "pet",      label: "小羊卷"   },
  { href: "growth",   label: "每日习惯" },
] as const;

export function App() {
  // UI-10: 导航栏当前区块高亮
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { threshold: [0.2, 0.5], rootMargin: "-60px 0px -40% 0px" }
    );
    NAV_ITEMS.forEach(({ href }) => {
      const el = document.getElementById(href);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // UI-11: 色板 hex 复制
  const [copiedId, setCopiedId] = useState<string>("");
  const onCopyColor = async (hex: string, id: string) => {
    try { await navigator.clipboard.writeText(hex); } catch { /* 静默失败 */ }
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1400);
  };

  return (
    <div className="page">
      <nav className="top-nav">
        <div className="nav-brand">ColorWalking</div>
        <div className="nav-links">
          {NAV_ITEMS.map(({ href, label }) => (
            <a
              key={href}
              href={`#${href}`}
              className={activeSection === href ? "nav-active" : ""}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <p className="tag">{"每天花 10 秒，给心情一点颜色"}</p>
          <h1>ColorWalking</h1>
          <p className="slogan">{"今日幸运色 · 轻陪伴 · 小羊卷"}</p>
          <p className="desc">
            {"打开页面，抽一个今日颜色，再和小羊卷说两句话。它会在日常里，给你一点不打扰的温柔回应。"}
          </p>
          <p className="hero-note">{"不用立刻变得更好，先让自己慢一点也可以。"}</p>
          <div className="actions">
            <a className="cta" href="#play">{"抽取今日幸运色"}</a>
            <a className="ghost-btn hero-ghost" href="#pet">{"先和小羊卷打个招呼"}</a>
          </div>
        </div>
        <div className="sheep-card hero-art">
          <img src="/brand-logo.svg" alt={"五彩斑斓的小羊卷"} loading="eager" decoding="async" />
          <p className="hero-art-note">{"今日小提示：不用很多力气，你已经在认真生活了。"}</p>
        </div>
      </header>

      <section id="features" className="section">
        <h2>{"产品亮点"}</h2>
        <div className="grid">
          <article>
            <h3>{"稳定抽取"}</h3>
            <p>{"点击圆盘或中心按钮即可抽取，体验简单、流畅，不打断你的节奏。"}</p>
          </article>
          <article>
            <h3>{"温柔结果"}</h3>
            <p>{"每次结果都不只是一个色值，还会附带一句小小的心情提醒。"}</p>
          </article>
          <article>
            <h3>{"轻量陪伴"}</h3>
            <p>{"保存近期记录，让你在忙碌的日子里，也能看见自己的小变化。"}</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>{"幸运色样本"}</h2>
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
              <small>{copiedId === item.id ? "已复制 ✓" : item.hex}</small>
            </button>
          ))}
        </div>
      </section>

      <section id="growth" className="section start-card">
        <h2>{"每日好心情习惯"}</h2>
        <div className="grid">
          <article>
            <h3>{"每天一次"}</h3>
            <p>{"用一次抽取，把今天过成一个有小小仪式感的日子。"}</p>
          </article>
          <article>
            <h3>{"轻轻分享"}</h3>
            <p>{"若你愿意，可以把今日颜色发给朋友，传递一点温和的心情。"}</p>
          </article>
          <article>
            <h3>{"慢慢看见"}</h3>
            <p>{"偶尔回头看看记录，你会发现：自己其实一直在往前走。"}</p>
          </article>
        </div>
      </section>

      <SheepPetGarden />

      <LuckyColorOracle />

      <section id="play" className="section play-shell">
        <Suspense
          fallback={
            <div className="play-card loading-card">
              <h2>{"网页版转盘"}</h2>
              <p>{"正在准备今天的颜色，稍等一下下..."}</p>
            </div>
          }
        >
          <LazyWheel />
        </Suspense>
      </section>

      <section id="mobile-download" className="section apk-download-card">
        <h2>下载手机 App</h2>
        <p>浏览器直接下载 Android 安装包（APK），下载后即可安装体验。</p>
        <div className="apk-actions">
          <a className="cta" href={APK_DOWNLOAD_URL} target="_blank" rel="noreferrer">
            下载 Android APK
          </a>
          <a className="ghost-btn" href="/downloads/colorwalking-latest.apk" target="_blank" rel="noreferrer">
            站点镜像下载
          </a>
        </div>
        <p className="apk-note">
          若主链接暂时不可用，可先使用“站点镜像下载”，或到 GitHub Releases 获取最新版。
        </p>
      </section>

      <footer className="footer">
        <p>{"IP 角色：五彩斑斓的小羊卷"}</p>
        <p>{"© 2026 ColorWalking. 愿你每天都有一点被轻轻安慰到的时刻。"}</p>
        <p className="version-badge">{"版本更新："}{BUILD_TAG}</p>
      </footer>
      <FloatingSheepPet />
    </div>
  );
}
