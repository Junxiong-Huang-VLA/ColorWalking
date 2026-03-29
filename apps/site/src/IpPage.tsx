import { IP_GALLERY, IP_WORLD, SHEEP_QUOTES } from "./config/brandWorld";

export function IpPage() {
  return (
    <div className="cw-page-stack">
      <section className="section cw-card">
        <h2>小羊卷是谁</h2>
        <p>{IP_WORLD.intro}</p>
      </section>

      <section className="section cw-card">
        <h2>世界观</h2>
        <ul className="cw-list">
          {IP_WORLD.lore.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section cw-card">
        <h2>角色性格</h2>
        <div className="cw-chip-row">
          {IP_WORLD.personality.map((item) => (
            <span key={item} className="cw-chip-lite">{item}</span>
          ))}
        </div>
        <p style={{ marginTop: 12 }}>它不是“跳出来打扰你”的宠物，而是“你需要时就在”的陪伴者。</p>
      </section>

      <section className="section cw-card">
        <h2>形象设定展示</h2>
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
        <h2>小羊卷台词库</h2>
        <div className="cw-quote-grid">
          {SHEEP_QUOTES.map((item) => (
            <blockquote key={item}>“{item}”</blockquote>
          ))}
        </div>
      </section>

      <section className="section cw-card">
        <h2>IP 商业延展预留</h2>
        <p>后续将承接玩偶、围巾、桌面终端与 AI 陪伴内容。当前页面为世界观与设定承载层。</p>
      </section>
    </div>
  );
}
