import { IP_GALLERY, IP_WORLD, SHEEP_QUOTES } from "./config/brandWorld";

export function IpPage() {
  return (
    <div className="brand-shell">
      <section className="section brand-panel page-head">
        <p className="brand-kicker">LambRoll Isle · Core IP</p>
        <h1>认识小羊卷</h1>
        <p className="brand-subtitle">小羊卷不是装饰角色，而是羊卷岛品牌的核心 IP 与情绪陪伴入口。</p>
      </section>

      <section className="section brand-panel">
        <h2>角色简介</h2>
        <p>{IP_WORLD.intro}</p>
        <p>它会把云岛上的颜色整理成每天的幸运色，送到你今天的生活里。</p>
      </section>

      <section className="section brand-panel">
        <h2>性格与气质</h2>
        <div className="cw-chip-row">
          {IP_WORLD.personality.map((item) => (
            <span key={item} className="cw-chip-lite">{item}</span>
          ))}
        </div>
        <p style={{ marginTop: 12 }}>它不喧闹，不催促，更像一份安静但持续存在的陪伴。</p>
      </section>

      <section className="section brand-panel">
        <h2>世界观关系</h2>
        <ul className="cw-list">
          {IP_WORLD.lore.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section brand-panel">
        <h2>视觉资产展示</h2>
        <div className="cw-ip-gallery">
          {IP_GALLERY.map((item) => (
            <article key={item.title}>
              <b>{item.title}</b>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section brand-panel">
        <h2>小羊卷语气样本</h2>
        <div className="cw-quote-grid">
          {SHEEP_QUOTES.map((item) => (
            <blockquote key={item}>“{item}”</blockquote>
          ))}
        </div>
      </section>

      <section className="section brand-panel">
        <h2>未来陪伴预告</h2>
        <p>后续会逐步进入盲盒、玩偶、挂饰与更多周边。当前阶段先做内容预告，不做重商城。</p>
        <div className="start-actions" style={{ marginTop: 12 }}>
          <a className="ghost-btn" href="/companion-plush">查看陪伴玩偶系列</a>
          <a className="ghost-btn" href="/future">查看未来陪伴页</a>
        </div>
      </section>
    </div>
  );
}
