import { IP_GALLERY, IP_WORLD, SHEEP_QUOTES } from "./config/brandWorld";

export function IpPage() {
  return (
    <div className="cw-page-stack">
      <section className="section cw-card">
        <h2>认识小羊卷</h2>
        <p>{IP_WORLD.intro}</p>
      </section>

      <section className="section cw-card">
        <h2>角色简介</h2>
        <p>小羊卷是颜色云岛的信使。它不是背景装饰，而是羊卷岛最核心的原创 IP 角色。</p>
        <p>它会把云岛上的颜色整理成每天的幸运色，送到你今天的生活里。</p>
      </section>

      <section className="section cw-card">
        <h2>性格与气质</h2>
        <div className="cw-chip-row">
          {IP_WORLD.personality.map((item) => (
            <span key={item} className="cw-chip-lite">{item}</span>
          ))}
        </div>
        <p style={{ marginTop: 12 }}>它不是吵闹型角色，而是你需要时就在的轻陪伴者。</p>
      </section>

      <section className="section cw-card">
        <h2>它为什么会送来幸运色</h2>
        <ul className="cw-list">
          {IP_WORLD.lore.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section cw-card">
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

      <section className="section cw-card">
        <h2>小羊卷语气样本</h2>
        <div className="cw-quote-grid">
          {SHEEP_QUOTES.map((item) => (
            <blockquote key={item}>“{item}”</blockquote>
          ))}
        </div>
      </section>

      <section className="section cw-card">
        <h2>未来陪伴预告</h2>
        <p>未来小羊卷会逐步进入盲盒、玩偶、挂饰和更多日常周边，但当前阶段只做轻量预告，不做重商城。</p>
      </section>
    </div>
  );
}




