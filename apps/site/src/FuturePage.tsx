import { FUTURE_LABS, FUTURE_ROADMAP } from "./config/brandWorld";

export function FuturePage() {
  return (
    <div className="cw-page-stack">
      <section className="section cw-card">
        <h2>Future / 未来陪伴</h2>
        <p>这里是羊卷岛的未来预告页，用于承载玩偶、挂饰、盲盒与更多周边方向。当前阶段不做重商城。</p>
      </section>

      <section className="section cw-card">
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

      <section className="section">
        <div className="cw-future-grid">
          {FUTURE_LABS.map((item) => (
            <article key={item.title} className="cw-card">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section cw-card">
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




