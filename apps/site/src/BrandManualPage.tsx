export function BrandManualPage() {
  return (
    <div className="brandbook-page brand-system-page">
      <section className="brandbook-hero">
        <p className="brandbook-kicker">Brand Identity System</p>
        <h1>羊卷岛</h1>
        <p className="brandbook-en">LambRoll Isle</p>
        <p className="brandbook-subtitle">主标 / 图标 / 牌面 三件套</p>
        <p className="brandbook-slogan">极简、圆润、温柔、高级。</p>
      </section>

      <section className="brandbook-section">
        <h2>正式三件套</h2>
        <p className="brand-selected-note">已选定稿：Icon A + Wordmark B</p>
        <div className="brand-system-grid">
          <article>
            <h3>品牌主标（Wordmark）</h3>
            <img src="/brand-wordmark.svg" alt="LambRoll Isle 羊卷岛主标" loading="lazy" decoding="async" />
            <p>用于官网页眉、品牌手册、包装正面主标题。</p>
          </article>
          <article>
            <h3>品牌图标（Icon）</h3>
            <img src="/brand-icon.svg" alt="LambRoll Isle 极简羊卷图标" loading="lazy" decoding="async" />
            <p>用于 favicon、App icon、头像、小尺寸角标。</p>
          </article>
          <article>
            <h3>品牌牌面（Lockup）</h3>
            <img src="/brand-lockup.svg" alt="LambRoll Isle 品牌牌面" loading="lazy" decoding="async" />
            <p>用于首页头图、下载页、包装头图和品牌入口区域。</p>
          </article>
        </div>
      </section>

      <section className="brandbook-section">
        <h2>定稿说明</h2>
        <div className="brandbook-naming-grid">
          <article>
            <h3>Icon A（已定稿）</h3>
            <p>卷毛识别强、脸部留白稳定，在 favicon、App icon、小尺寸角标中表现最均衡。</p>
          </article>
          <article>
            <h3>Wordmark B（已定稿）</h3>
            <p>字标主导、节奏克制，适合官网页眉、品牌手册与包装正面主标题场景。</p>
          </article>
        </div>
      </section>

      <section className="brandbook-section">
        <h2>应用规范（当前建议）</h2>
        <div className="brandbook-naming-grid">
          <article>
            <h3>最小尺寸</h3>
            <ul className="brandbook-structure">
              <li>Icon：16px（favicon）/ 32px（常规 UI）/ 64px（App 列表）</li>
              <li>Wordmark：宽度不低于 180px</li>
              <li>Lockup：宽度不低于 280px</li>
            </ul>
          </article>
          <article>
            <h3>禁用规则</h3>
            <ul className="brandbook-structure">
              <li>禁止叠加大段说明文案</li>
              <li>禁止替换为完整角色插画主导</li>
              <li>禁止复杂渐变与高饱和多色混用</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
