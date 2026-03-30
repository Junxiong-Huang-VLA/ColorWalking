import { type ReactNode } from "react";
import { IP_WORLD } from "./config/brandWorld";
import { BRAND_COPY, DOWNLOAD_PAGE_PATH } from "./config/experience";

type Props = {
  WheelSection: ReactNode;
};

export function HomePage({ WheelSection }: Props) {
  return (
    <div className="brand-shell home-focus-page">
      <header className="home-focus-hero">
        <div className="home-focus-copy">
          <p className="home-focus-kicker">LambRoll Isle · 羊卷岛  让陪伴有颜色</p>
          <h1>今天，也为自己抽一份幸运颜色。</h1>
          <p className="home-focus-lead">Lucky Color · Daily Companion</p>
          <p className="home-hero-ip-reason">小羊卷是把“今天的幸运颜色”送到你身边的核心角色。</p>
          <p className="home-focus-subtitle">
            在黑白灰的日常里，让小羊卷为你送来一点颜色、一点期待，和一点温柔陪伴。
          </p>
          <p className="home-focus-note">一个围绕原创 IP小羊卷展开的陪伴品牌</p>
          <div className="home-hero-actions">
            <a className="cta home-hero-main-cta" href="/lucky-color">抽取今日幸运色</a>
            <a className="ghost-btn home-hero-sub-cta" href="/xiaoyangjuan">认识小羊卷</a>
          </div>
          <p className="home-hero-context">今天这一抽，由小羊卷为你送达。</p>
          <p className="home-hero-entry-hint">先抽取今日幸运色，再认识小羊卷是谁。</p>
        </div>

        <aside className="home-focus-art sheep-card">
          <p className="home-hero-ip-badge">核心 IP · 小羊卷</p>
          <img src="/brand-logo.svg" alt="羊卷岛与小羊卷品牌视觉" loading="eager" decoding="async" />
          <p className="hero-art-note">小羊卷会把属于今天的幸运颜色，轻轻送到你身边。</p>
          <div className="home-hero-role-card">
            <b>小羊卷在首屏</b>
            <p>不是装饰元素，而是品牌主角之一，负责把“幸运色”变成可感知的陪伴体验。</p>
          </div>
          <div className="home-hero-mini-actions">
            <a className="ghost-btn" href="/xiaoyangjuan">查看角色设定</a>
          </div>
        </aside>
      </header>

      <section className="section brand-panel tone-cloud home-section-intro">
        <h2>这里是羊卷岛。</h2>
        <p>
          羊卷岛是一个围绕原创 IP小羊卷展开的陪伴品牌。
          我们从幸运色出发，把颜色、角色和日常陪伴连接在一起，想让每个人的生活里，多一点柔软，也多一点颜色。
        </p>
        <p>从这一页开始，你会先遇见今天的颜色，再慢慢认识小羊卷和它所在的世界。</p>
      </section>

      <section className="section brand-panel tone-mist home-section-lucky" id="home-lucky-entry">
        <h2>领取今天的幸运颜色</h2>
        <p>
          每天来这里，抽取一份属于今天的幸运颜色。
          它可能是一点平静、一点勇气、一点元气，也可能只是提醒你：今天也可以柔软一点。
        </p>
        <div className="start-actions">
          <a className="cta" href="/lucky-color">开始抽取</a>
          <a className="ghost-btn" href="#play">进入网页转盘</a>
        </div>
        {WheelSection}
        <p className="home-lucky-note">抽完这一份颜色，再看看是谁把它送到你身边。</p>
      </section>

      <section className="section brand-panel tone-cream home-section-ip">
        <h2>认识小羊卷</h2>
        <p>
          小羊卷来自颜色云岛，是一只会把幸运颜色送到你身边的小羊。
          它软乎乎、安静、温柔，不会打扰你，只会在你需要的时候，轻轻陪你一下。
        </p>
        <div className="cw-chip-row" style={{ marginTop: 10 }}>
          {IP_WORLD.personality.map((item) => (
            <span key={item} className="cw-chip-lite">{item}</span>
          ))}
        </div>
        <div className="start-actions" style={{ marginTop: 14 }}>
          <a className="ghost-btn" href="/xiaoyangjuan">进入小羊卷页面</a>
        </div>
        <p className="home-ip-note">继续往下看，你会看到它来自怎样的颜色世界。</p>
      </section>

      <section className="section brand-panel tone-cloud home-section-world">
        <h2>颜色云岛，正在向你发来今天的颜色。</h2>
        <p>
          在羊卷岛的世界里，颜色不只是视觉元素，也是一种关于平静、柔软、希望和陪伴的温柔信号。
        </p>
        <ul className="cw-list">
          {IP_WORLD.lore.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="home-world-note">如果你想把这份陪伴带在身边，下一步可以进入 App。</p>
      </section>

      <section className="section brand-panel tone-mist home-section-download" id="home-download-entry">
        <h2>把今天的颜色，带在身边</h2>
        <p>
          在手机上，你也可以继续领取今天的幸运颜色，和小羊卷保持同一份温柔节奏。
          它不是一个额外任务，只是把这份轻陪伴，从网页自然延续到你的日常里。
        </p>
        <div className="start-actions home-download-actions">
          <a className="cta home-download-main-cta" href={DOWNLOAD_PAGE_PATH}>下载 App</a>
          <a className="ghost-btn" href="/download/app.apk">直接下载 APK</a>
        </div>
        <p className="home-download-note">官方路径：/download · Android 版本当前可用</p>
        <p className="home-download-tail">最后看一眼：羊卷岛会如何继续长大。</p>
      </section>

      <section className="section brand-panel tone-cream home-section-future">
        <div className="home-future-growth-card">
          <figure className="home-future-main-visual">
            <img
              src="/images/products/lucky-color/lucky-color-series-group-standing.jpg"
              alt="Lucky Color series preview"
              loading="lazy"
              decoding="async"
            />
          </figure>

          <div className="home-future-growth-content">
            <p className="home-future-kicker">Brand Growth Preview</p>
            <h2>Little Lamb Roll is slowly stepping into your life.</h2>
            <p className="home-future-intro">
              From this site and the app, Colorful Lamb Roll keeps adding loving
              moments: blind boxes, plush companions, charms, and small, collectible
              pieces of joy that can sit beside you every day.
            </p>
            <p className="home-future-note">Let Lamb Roll become your gentle companion.</p>

            <div className="home-future-support-grid" aria-label="Lamb Roll product preview">
              <figure className="home-future-support-item">
                <img
                  src="/images/products/companion-plush/plush-series-rainbow-lineup.jpg"
                  alt="Companion plush preview"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <figure className="home-future-support-item">
                <img
                  src="/images/products/charms/charm-series-vinyl-6color-lineup.jpg"
                  alt="Charm series preview"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </div>

            <div className="start-actions" style={{ marginTop: 14 }}>
              <a className="ghost-btn" href="/future">Learn more</a>
              <a className="ghost-btn" href="/xiaoyangjuan">Meet Lamb Roll</a>
            </div>
            <p className="home-future-tail">This page is the start of Colorful Lamb Roll growing up.</p>
          </div>
        </div>
      </section>

      <section className="section brand-panel tone-mist brand-closing home-section-closing">
        <h2>{BRAND_COPY.slogan}</h2>
        <p>
          羊卷岛想做的，不只是一个抽幸运色的页面，而是一个围绕小羊卷展开的、关于颜色与陪伴的品牌世界。
        </p>
      </section>
    </div>
  );
}
