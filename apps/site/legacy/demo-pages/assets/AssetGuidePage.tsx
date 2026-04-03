const ASSET_RULES = [
  "源目录：/product image（公司原始主素材）",
  "官网引用目录：/apps/site/public/images/products/official",
  "当前统一主图：sheep-roll-official.jpg",
  "同步原则：先替换源图，再同步到官网引用目录并回归检查"
] as const;

const PUBLISH_CHECKLIST = [
  "检查主图 hash 与 product image 一致",
  "检查首页 Hero、进展页主视觉、移动端入口均引用同一图",
  "检查 alt 文案与品牌命名一致（小羊卷/羊卷岛/颜色云岛）",
  "构建后检查 dist 产物是否包含最新主图"
] as const;

export function AssetGuidePage() {
  return (
    <section className="page-grid" data-testid="asset-guide-page">
      <article className="card">
        <h2>素材管理说明页</h2>
        <p className="muted">公开说明 product image 与官网资源同步机制，减少素材口径分裂。</p>
      </article>

      <article className="card">
        <h2>素材链路</h2>
        <ul className="companion-module-list">
          {ASSET_RULES.map((item) => (
            <li key={item}>
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <h2>发布前检修清单</h2>
        <ul className="companion-module-list">
          {PUBLISH_CHECKLIST.map((item) => (
            <li key={item}>
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <h2>当前公开路径</h2>
        <div className="state-chip-row">
          <span>product image/f0e5ddf6e44704df3c16c31ff8c2eec5.jpg</span>
          <span>apps/site/public/images/products/official/sheep-roll-official.jpg</span>
        </div>
      </article>
    </section>
  );
}
