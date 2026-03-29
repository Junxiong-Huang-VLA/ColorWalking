import { type ReactNode } from "react";
import { SheepPetGarden } from "./SheepPetGarden";
import { COMPANION_PLUSH_ITEMS, FUTURE_LABS, IP_WORLD } from "./config/brandWorld";
import { BRAND_COPY, DOWNLOAD_PAGE_PATH } from "./config/experience";

type Props = {
  WheelSection: ReactNode;
};

const BRAND_PILLARS = [
  {
    title: "品牌站",
    desc: "让用户一眼理解 LambRoll Isle 是什么，并感受到“让陪伴有颜色”的品牌气质。"
  },
  {
    title: "产品入口",
    desc: "今日幸运色是核心体验：每天一抽，得到可执行、可感知的轻仪式感提醒。"
  },
  {
    title: "IP 承载",
    desc: "小羊卷是核心角色，不是装饰图。官网要持续承载它的设定、语气与成长线。"
  }
] as const;

const HOME_FLOW = [
  "先看见品牌与小羊卷",
  "再进入今日幸运色体验",
  "随后了解世界观与 App",
  "最后看到未来成长预告"
] as const;

export function HomePage({ WheelSection }: Props) {
  return (
    <div className="brand-shell">
      <header className="brand-hero">
        <div className="brand-hero-copy">
          <p className="brand-kicker">{BRAND_COPY.heroTag}</p>
          <h1>{BRAND_COPY.heroTitle}</h1>
          <p className="brand-subtitle">{BRAND_COPY.heroDesc}</p>
          <p className="brand-note">{BRAND_COPY.slogan}</p>
          <div className="actions">
            <a className="cta" href="/lucky-color">抽取今日幸运色</a>
            <a className="ghost-btn" href="/xiaoyangjuan">认识小羊卷</a>
          </div>
        </div>
        <div className="brand-hero-art sheep-card">
          <img src="/brand-logo.svg" alt="LambRoll Isle 羊卷岛品牌视觉" loading="eager" decoding="async" />
          <p className="hero-art-note">{BRAND_COPY.heroNote}</p>
        </div>
      </header>

      <section className="section brand-panel">
        <h2>这里是羊卷岛</h2>
        <p>{BRAND_COPY.oneLiner}</p>
        <div className="brand-pillars">
          {BRAND_PILLARS.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section brand-panel">
        <h2>首页体验节奏</h2>
        <div className="brand-flow">
          {HOME_FLOW.map((item, idx) => (
            <article key={item}>
              <b>0{idx + 1}</b>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section brand-panel" id="home-lucky-entry">
        <h2>今日幸运色主入口</h2>
        <p>每天一份幸运颜色。先抽色，再把这份轻提醒带进今天的节奏里。</p>
        <div className="start-actions">
          <a className="cta" href="/lucky-color">开始抽取</a>
          <a className="ghost-btn" href="#play">进入网页转盘</a>
        </div>
      </section>

      <section className="section brand-panel">
        <h2>小羊卷：核心 IP</h2>
        <p>{IP_WORLD.intro}</p>
        <div className="cw-chip-row" style={{ marginTop: 10 }}>
          {IP_WORLD.personality.map((item) => (
            <span key={item} className="cw-chip-lite">{item}</span>
          ))}
        </div>
        <div className="start-actions" style={{ marginTop: 14 }}>
          <a className="ghost-btn" href="/xiaoyangjuan">进入小羊卷页面</a>
        </div>
      </section>

      <section className="section brand-panel">
        <h2>颜色云岛</h2>
        <p>幸运色不是装饰，而是帮助你和当下情绪对齐的温柔信号。</p>
        <ul className="cw-list">
          {IP_WORLD.lore.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section brand-panel" id="home-download-entry">
        <h2>下载 App</h2>
        <p>Android 版本已可用。网页与 App 保持同一套语气与体验节奏。</p>
        <div className="start-actions">
          <a className="cta" href={DOWNLOAD_PAGE_PATH}>前往下载页</a>
          <a className="ghost-btn" href="/download/app.apk">直接下载 APK</a>
        </div>
      </section>

      <section className="section brand-panel">
        <h2>未来周边与成长预告</h2>
        <p>先做轻量承载，不做重商城。让用户看到羊卷岛正在稳定成长。</p>
        <div className="grid">
          {FUTURE_LABS.slice(0, 3).map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="start-actions" style={{ marginTop: 14 }}>
          <a className="ghost-btn" href="/future">查看更多未来计划</a>
        </div>
      </section>

      <section className="section brand-panel">
        <h2>小羊卷陪伴玩偶系列</h2>
        <p>把小羊卷，轻轻放进日常里。</p>
        <div className="plush-mini-grid">
          {COMPANION_PLUSH_ITEMS.map((item) => (
            <article key={item.name} className="plush-mini-item">
              <b>{item.name}</b>
              <p>{item.packLine}</p>
            </article>
          ))}
        </div>
        <div className="start-actions" style={{ marginTop: 14 }}>
          <a className="ghost-btn" href="/companion-plush">查看系列设定</a>
        </div>
      </section>

      <section className="section brand-panel brand-closing">
        <h2>{BRAND_COPY.slogan}</h2>
        <p>LambRoll Isle（羊卷岛）希望把颜色变成陪伴，把陪伴带进日常。</p>
      </section>

      <section className="section brand-panel">
        <h2>小羊卷桌宠体验</h2>
        <p>网页端已开放桌宠互动，和小羊卷打招呼、互动、散步，让陪伴更具体。</p>
      </section>

      <SheepPetGarden />
      {WheelSection}
    </div>
  );
}
