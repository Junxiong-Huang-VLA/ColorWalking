import {
  COMPANION_PLUSH_CLOSING,
  COMPANION_PLUSH_DOC_STRUCTURE,
  COMPANION_PLUSH_ITEMS,
  COMPANION_PLUSH_SERIES
} from "./config/brandWorld";

export function CompanionPlushPage() {
  return (
    <div className="brand-shell">
      <section className="section brand-panel page-head plush-hero">
        <p className="brand-kicker">官网预告承载</p>
        <h1>{COMPANION_PLUSH_SERIES.name}</h1>
        <p className="brand-subtitle plush-one-liner">{COMPANION_PLUSH_SERIES.oneLiner}</p>
        <p>{COMPANION_PLUSH_SERIES.intro}</p>
        <p>{COMPANION_PLUSH_SERIES.intro2}</p>
      </section>

      <section className="section brand-panel">
        <h2>首发 4 款设定</h2>
        <div className="plush-grid">
          {COMPANION_PLUSH_ITEMS.map((item) => (
            <article key={item.name} className="plush-card">
              <h3>{item.name}</h3>
              <div className="cw-chip-row">
                {item.keywords.map((tag) => (
                  <span key={`${item.name}-${tag}`} className="cw-chip-lite">{tag}</span>
                ))}
              </div>
              <p>{item.desc}</p>
              <p><b>包装短句：</b>{item.packLine}</p>
              <p><b>建议摆放：</b>{item.scene}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section brand-panel">
        <h2>包装 / 详情页文案结构</h2>
        <ul className="cw-list">
          {COMPANION_PLUSH_DOC_STRUCTURE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section brand-panel">
        <h2>官网收束文案</h2>
        <p>{COMPANION_PLUSH_CLOSING[0]}</p>
        <p>{COMPANION_PLUSH_CLOSING[1]}</p>
        <p>{COMPANION_PLUSH_CLOSING[2]}</p>
      </section>

      <section className="section brand-panel">
        <h2>下一步周边承载</h2>
        <p>当前阶段不做商城，但会继续在官网承载玩偶、挂饰、盲盒、色卡和更多日常周边预告。</p>
        <div className="start-actions">
          <a className="ghost-btn" href="/future">查看未来陪伴页</a>
          <a className="ghost-btn" href="/brand-manual">查看品牌手册页</a>
        </div>
      </section>
    </div>
  );
}
