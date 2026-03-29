const CHARACTER_PROFILE = [
  { label: "名字", value: "小羊卷" },
  { label: "来自哪里", value: "颜色云岛" },
  { label: "角色身份", value: "幸运色陪伴体" },
  { label: "性格关键词", value: "温柔 / 安静 / 软乎乎 / 低打扰 / 有一点点元气 / 喜欢陪伴" },
  { label: "擅长的事情", value: "为你送来今天刚刚好的颜色" }
] as const;

const COMPANION_POINTS = [
  {
    title: "陪你抽色",
    desc: "每天陪你抽取一份属于今天的幸运颜色。"
  },
  {
    title: "陪你开始一天",
    desc: "在平凡日常里，给你一点颜色和一点期待。"
  },
  {
    title: "陪你慢一点",
    desc: "当你有点累的时候，提醒你：慢一点也没关系呀。"
  }
] as const;

export function IpPage() {
  return (
    <div className="brand-shell ip-focus-page">
      <section className="section brand-panel tone-mist ip-hero">
        <div className="ip-hero-copy">
          <p className="brand-kicker">LambRoll Isle · Core IP</p>
          <h1>认识小羊卷</h1>
          <p className="brand-subtitle">来自颜色云岛的小羊卷，会把属于今天的幸运颜色送到你身边。</p>
          <p className="ip-hero-note">小羊卷是羊卷岛的核心 IP。它温柔、安静、软乎乎，不是来打扰你的，只是想每天陪你一点点。</p>
          <div className="start-actions">
            <a className="cta" href="/lucky-color">查看今日幸运色</a>
            <a className="ghost-btn" href="/download">下载 App</a>
          </div>
        </div>
        <aside className="ip-hero-art sheep-card">
          <p className="ip-hero-badge">核心 IP · 小羊卷</p>
          <img src="/brand-logo.svg" alt="小羊卷角色主视觉" loading="eager" decoding="async" />
          <p className="hero-art-note">它不是背景元素，而是羊卷岛的角色中心。</p>
        </aside>
      </section>

      <section className="section brand-panel tone-cloud">
        <h2>小羊卷是谁</h2>
        <p>
          小羊卷是羊卷岛的核心 IP，也是一只会把幸运颜色送到你身边的小羊。
          它软乎乎、圆滚滚，喜欢安静地待在你身边，不吵闹，也不着急。
          小羊卷不是来改变你生活的，它只是想每天陪你一点点。
        </p>
      </section>

      <section className="section brand-panel tone-cream">
        <h2>角色设定</h2>
        <div className="ip-profile-grid">
          {CHARACTER_PROFILE.map((item) => (
            <article key={item.label}>
              <small>{item.label}</small>
              <p>{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section brand-panel tone-cloud">
        <h2>它为什么会来到这里</h2>
        <p>
          在羊卷岛的世界里，颜色不只是视觉上的变化，也是一种关于心情、节奏和陪伴的温柔信号。
          小羊卷会从颜色云岛出发，把适合今天的幸运颜色送到你身边，让普通的一天，也多一点小小的仪式感。
        </p>
      </section>

      <section className="section brand-panel tone-cream">
        <h2>它是怎样的小羊</h2>
        <p>
          小羊卷不会很吵，也不会一直打扰你。
          它更像一个默默在身边的小伙伴：当你打开网站或 App，它会在；当你抽取今日幸运色，它会在；
          当你只是想看看今天适合什么颜色，它也会在。
        </p>
      </section>

      <section className="section brand-panel tone-cloud">
        <h2>关于它的样子</h2>
        <p>
          小羊卷是一只奶白色的小羊，头顶有像云朵一样的卷毛，脸圆圆的，软乎乎的。
          它通常会围着一条幸运围巾，围巾的颜色也会随着每天的幸运色发生变化。
        </p>
      </section>

      <section className="section brand-panel tone-cream">
        <h2>它会怎么陪你</h2>
        <div className="ip-scenes">
          {COMPANION_POINTS.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section brand-panel tone-cloud">
        <h2>小羊卷正在慢慢走进你的生活</h2>
        <p>
          从网页和 App 开始，羊卷岛也会逐步带来更多围绕小羊卷的日常陪伴：
          玩偶、挂饰、盲盒、幸运色系列周边，以及更多可以被拥有、被放在身边的小小陪伴。
        </p>
      </section>

      <section className="section brand-panel tone-mist ip-closing">
        <h2>小羊卷不是来改变你的生活的，</h2>
        <p>它只是想把今天刚刚好的颜色，轻轻送到你身边。</p>
        <div className="start-actions" style={{ marginTop: 14 }}>
          <a className="cta" href="/lucky-color">抽取今日幸运色</a>
          <a className="ghost-btn" href="/download">下载 App</a>
        </div>
      </section>
    </div>
  );
}
