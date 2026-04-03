const WORLD_TIMELINE = [
  {
    title: "起点：颜色云岛",
    detail: "颜色云岛是小羊卷世界观中的起源地，代表温柔、安静、低打扰的日常节奏。"
  },
  {
    title: "角色诞生：小羊卷",
    detail: "小羊卷作为幸运色陪伴体，把抽象颜色体验转成可感知的陪伴动作与回应。"
  },
  {
    title: "品牌承载：羊卷岛",
    detail: "羊卷岛负责把角色、产品、互动方式与后续实体路线放在同一个品牌叙事里。"
  },
  {
    title: "现实映射：数字生命体 Demo",
    detail: "通过软件先验证角色一致性，再推进硬件阶段，保证实体版是体验延伸而非割裂产品。"
  }
] as const;

const CHARACTER_DETAILS = [
  "角色身份：幸运色陪伴体",
  "交互原则：短句、温柔、低打扰",
  "能力边界：不是通用 AI 助手，不做高密度信息任务",
  "价值目标：在日常里形成可重复的轻陪伴感"
] as const;

export function StoryPage() {
  return (
    <section className="page-grid" data-testid="story-page">
      <article className="card">
        <h2>品牌故事长页</h2>
        <p className="muted">这里集中回答“颜色云岛 - 小羊卷 - 羊卷岛”三者关系与演进路径。</p>
      </article>

      <article className="card">
        <h2>世界观时间线</h2>
        <ul className="companion-module-list">
          {WORLD_TIMELINE.map((item) => (
            <li key={item.title}>
              <b>{item.title}</b>
              <p>{item.detail}</p>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <h2>角色设定细节</h2>
        <ul className="companion-module-list">
          {CHARACTER_DETAILS.map((item) => (
            <li key={item}>
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <h2>品牌表达准则</h2>
        <div className="state-chip-row">
          <span>统一主角：小羊卷</span>
          <span>统一世界观：颜色云岛</span>
          <span>统一品牌承载：羊卷岛</span>
          <span>统一产品节奏：先软件再实体</span>
        </div>
      </article>
    </section>
  );
}
