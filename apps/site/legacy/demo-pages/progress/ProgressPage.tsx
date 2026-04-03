import { getFeaturedProduct } from "@colorwalking/shared";

type ProgressPageProps = {
  onGoInteraction: () => void;
  onGoValidation: () => void;
};

const STAGES = [
  {
    title: "阶段 1：纯软件数字生命体（当前）",
    detail:
      "聚焦验证角色表达、互动节奏、记忆回路、候补流程，确保小羊卷体验在无硬件条件下也能成立。",
    status: "进行中"
  },
  {
    title: "阶段 2：候补名单与小规模联调",
    detail:
      "用真实反馈验证体验价值与用户节奏，逐步对接实体版打样流程，明确最小可交付规格。",
    status: "准备中"
  },
  {
    title: "阶段 3：实体版联动与量产验证",
    detail:
      "把已经稳定的软件体验映射到硬件表达层，推进表情灯效、动作反馈与设备同步。",
    status: "规划中"
  }
] as const;

export function ProgressPage({ onGoInteraction, onGoValidation }: ProgressPageProps) {
  const featured = getFeaturedProduct();

  return (
    <section className="page-grid" data-testid="progress-page">
      <article className="card">
        <h2>实体版进展</h2>
        <p className="muted">
          这不是单纯硬件排期页，而是“小羊卷数字生命体能力”到“实体陪伴体验”之间的阶段映射。
        </p>
      </article>

      <article className="card product-spotlight-card">
        <h2>当前主视觉基线</h2>
        <p className="muted">实体版将沿用当前官网与 Demo 的统一主图语义。</p>
        <img src={featured.siteImagePath} alt={featured.name} className="product-spotlight-image" loading="lazy" />
        <div className="product-spotlight-meta">
          <b>{featured.name}</b>
          <small>{featured.tagline}</small>
        </div>
      </article>

      <article className="card">
        <h2>阶段路线图</h2>
        <ul className="companion-module-list">
          {STAGES.map((item) => (
            <li key={item.title}>
              <b>{item.title}</b>
              <p>{item.detail}</p>
              <small>{item.status}</small>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <h2>下一步触发条件</h2>
        <div className="state-chip-row">
          <span>互动留存稳定</span>
          <span>候补质量稳定</span>
          <span>关键体验链路稳定</span>
          <span>硬件映射成本可控</span>
        </div>
        <p style={{ marginTop: 10 }}>
          只有当软件阶段的角色一致性和用户节奏验证完成，实体版才会进入正式推进，避免“先做硬件再补体验”。
        </p>
      </article>

      <article className="card">
        <h2>行动入口</h2>
        <div className="quick-actions home-quick-actions">
          <button type="button" className="primary-btn" onClick={onGoInteraction}>
            体验小羊卷 Demo
          </button>
          <button type="button" className="ghost-btn" onClick={onGoValidation}>
            加入候补名单
          </button>
        </div>
      </article>
    </section>
  );
}
