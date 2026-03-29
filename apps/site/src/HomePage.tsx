import { type ReactNode } from "react";
import { SheepPetGarden } from "./SheepPetGarden";
import { FUTURE_LABS, IP_WORLD } from "./config/brandWorld";
import { BRAND_COPY, DOWNLOAD_PAGE_PATH } from "./config/experience";

type Props = {
  WheelSection: ReactNode;
};

export function HomePage({ WheelSection }: Props) {
  return (
    <>
      <header className="hero">
        <div className="hero-copy">
          <p className="tag">{BRAND_COPY.heroTag}</p>
          <h1>{BRAND_COPY.heroTitle}</h1>
          <p className="slogan">{BRAND_COPY.heroSlogan}</p>
          <p className="desc">{BRAND_COPY.heroDesc}</p>
          <p className="hero-note">{BRAND_COPY.productSlogan}</p>
          <div className="actions">
            <a className="cta" href="/lucky-color">抽取今日幸运色</a>
            <a className="ghost-btn hero-ghost" href="/xiaoyangjuan">认识小羊卷</a>
            <a className="ghost-btn" href={DOWNLOAD_PAGE_PATH}>下载 App</a>
          </div>
        </div>
        <div className="sheep-card hero-art">
          <img src="/brand-logo.svg" alt="羊卷岛品牌视觉" loading="eager" decoding="async" />
          <p className="hero-art-note">{BRAND_COPY.heroNote}</p>
        </div>
      </header>

      <section className="section cw-card">
        <h2>这里是羊卷岛</h2>
        <p>{BRAND_COPY.oneLiner}</p>
      </section>

      <section className="section cw-card" id="home-lucky-entry">
        <h2>今日幸运色主入口</h2>
        <p>每天一份幸运颜色。先抽色，再把这份轻提醒带进今天的节奏里。</p>
        <div className="start-actions">
          <a className="cta" href="/lucky-color">开始抽取</a>
          <a className="ghost-btn" href="#play">进入网页转盘</a>
        </div>
      </section>

      <section className="section cw-card">
        <h2>小羊卷</h2>
        <p>{IP_WORLD.intro}</p>
        <div className="cw-chip-row" style={{ marginTop: 10 }}>
          {IP_WORLD.personality.map((item) => (
            <span key={item} className="cw-chip-lite">{item}</span>
          ))}
        </div>
        <div className="start-actions" style={{ marginTop: 12 }}>
          <a className="ghost-btn" href="/xiaoyangjuan">进入小羊卷页面</a>
        </div>
      </section>

      <section className="section cw-card">
        <h2>颜色云岛</h2>
        <p>在颜色云岛里，幸运色不是装饰，而是帮助你和当下情绪对齐的温柔信号。</p>
        <ul className="cw-list">
          {IP_WORLD.lore.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section cw-card" id="home-download-entry">
        <h2>下载 App</h2>
        <p>Android 版本已可用。把今日幸运色和小羊卷带在身边，网页与 App 体验保持同一套语气和节奏。</p>
        <div className="start-actions">
          <a className="cta" href={DOWNLOAD_PAGE_PATH}>前往下载页</a>
          <a className="ghost-btn" href="/download/app.apk">直接下载 APK</a>
        </div>
      </section>

      <section className="section start-card">
        <h2>未来陪伴预告</h2>
        <p>玩偶、挂饰、盲盒与更多日常周边会逐步公开。现在先做轻量预告，不做重商城。</p>
        <div className="grid">
          {FUTURE_LABS.slice(0, 3).map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="start-actions" style={{ marginTop: 12 }}>
          <a className="ghost-btn" href="/future">查看更多未来计划</a>
        </div>
      </section>

      <section className="section cw-card cw-brand-closing">
        <h2>{BRAND_COPY.slogan}</h2>
        <p>羊卷岛会长期围绕小羊卷，持续建设一个温柔、清晰、可成长的原创 IP 品牌站。</p>
      </section>

      <section className="section cw-card">
        <h2>小羊卷桌宠体验</h2>
        <p>网页端已经开放桌宠互动。你可以和小羊卷打招呼、互动、完成散步，让陪伴更具体。</p>
      </section>
      <SheepPetGarden />

      {WheelSection}
    </>
  );
}




