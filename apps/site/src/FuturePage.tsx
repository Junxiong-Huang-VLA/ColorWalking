import { COMPANION_PLUSH_ITEMS, COMPANION_PLUSH_SERIES, FUTURE_LABS, FUTURE_ROADMAP } from "./config/brandWorld";

export function FuturePage() {
  return (
    <div className="brand-shell future-v2">
      <section className="section brand-panel page-head tone-mist page-head-split">
        <div>
          <p className="brand-kicker">Future / 未来陪伴</p>
          <h1>品牌成长预告</h1>
          <p className="brand-subtitle">这里承载玩偶、挂饰、盲盒与更多周边方向，当前阶段不做重商城。</p>
        </div>
        <aside className="page-head-brandplate">
          <img src="/brand-logo-seal.svg" alt="LambRoll Isle 字标与角色章品牌图" loading="lazy" decoding="async" />
        </aside>
      </section>

      <section className="section brand-panel tone-cloud">
        <h2>成长路线</h2>
        <div className="cw-roadmap">
          {FUTURE_ROADMAP.map((item) => (
            <article key={item.stage + item.title}>
              <span>{item.stage}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section brand-panel tone-cream">
        <h2>{COMPANION_PLUSH_SERIES.name}</h2>
        <p>{COMPANION_PLUSH_SERIES.oneLiner}</p>
        <div className="plush-mini-grid">
          {COMPANION_PLUSH_ITEMS.map((item) => (
            <article key={item.name} className="plush-mini-item">
              <b>{item.name}</b>
              <p>{item.scene}</p>
            </article>
          ))}
        </div>
        <div className="start-actions" style={{ marginTop: 12 }}>
          <a className="ghost-btn" href="/companion-plush">查看玩偶系列完整设定</a>
        </div>
      </section>

      <section className="section">
        <div className="cw-future-grid">
          {FUTURE_LABS.map((item) => (
            <article key={item.title} className="brand-panel tone-cloud">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section brand-panel tone-mist">
        <h2>当前状态</h2>
        <p>目前以官网内容预告为主，后续会按品牌节奏逐步开放轻预约与活动，不会突然转成重电商站点。</p>
        <div className="start-actions">
          <a className="ghost-btn" href="/about">查看品牌说明</a>
          <a className="ghost-btn" href="/download">查看下载页</a>
        </div>
      </section>
    </div>
  );
}
