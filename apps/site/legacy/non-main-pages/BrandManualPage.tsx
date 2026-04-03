export function BrandManualPage() {
  return (
    <div className="brandbook-page brand-system-page">
      <section className="brandbook-hero">
        <p className="brandbook-kicker">Brand Identity System</p>
        <h1>LambRoll Isle</h1>
        <p className="brandbook-subtitle">羊卷岛</p>
        <p className="brandbook-slogan">
          Cozy, slightly misty, and handwritten—our visual tone mirrors the warmth of a small island where wool feels like a welcome hug.
        </p>
      </section>

      <section className="brandbook-section">
        <h2>Primary marks</h2>
        <div className="brand-system-grid">
          <article>
            <h3>Icon A · Curly sheep head mark</h3>
            <img src="/brand-icon.svg" alt="LambRoll Isle primary icon" loading="lazy" decoding="async" />
            <p>Use this as the main favicon/app icon and anywhere the brand needs a compact, high-recognition mark.</p>
          </article>
          <article>
            <h3>Icon B · Curl isle seal</h3>
            <img src="/brand-icon-b.svg" alt="LambRoll Isle isle seal" loading="lazy" decoding="async" />
            <p>Apply when the story needs a softer, landscape-friendly badge—packaging backs, About pages, and monochrome reverse prints.</p>
          </article>
          <article>
            <h3>Icon C · Lucky scarf knot</h3>
            <img src="/brand-icon-c.svg" alt="LambRoll Isle scarf knot" loading="lazy" decoding="async" />
            <p>Reserve this as a supporting motif for series badges, charms, blind boxes, and tactile tags.</p>
          </article>
        </div>
      </section>

      <section className="brandbook-section">
        <h2>Wordmark &amp; lockup</h2>
        <div className="brand-system-flex">
          <article>
            <h3>Outlined wordmark</h3>
            <p>The English and Chinese glyphs are fully drawn as paths (no font fallback). This guarantees consistent spacing, thickness, and warm curvature across platforms.</p>
            <img src="/brand-wordmark.svg" alt="LambRoll Isle wordmark" loading="lazy" decoding="async" />
          </article>
          <article>
            <h3>Horizontal lockup</h3>
            <p>Pair the icon with the wordmark for hero lockups on hero banners or hero modals. Keep clear space equal to the icon height surrounding the lockup.</p>
            <img src="/brand-logo.svg" alt="LambRoll Isle horizontal lockup" loading="lazy" decoding="async" />
          </article>
          <article>
            <h3>Stacked lockup</h3>
            <p>Use the stacked lockup when vertical space is available and you want the icon to breathe above the lettering.</p>
            <img src="/brand-lockup.svg" alt="LambRoll Isle stacked lockup" loading="lazy" decoding="async" />
          </article>
        </div>
      </section>

      <section className="brandbook-section">
        <h2>Usage notes</h2>
        <div className="brandbook-naming-grid">
          <article>
            <h3>Color palette</h3>
            <ul className="brandbook-structure">
              <li>奶油白 / 雾蓝灰 / 深雾蓝 为主色。</li>
              <li>蜜桃粉用作点缀或强调。</li>
              <li>避免复杂渐变和高饱和度。</li>
            </ul>
          </article>
          <article>
            <h3>Clear space</h3>
            <ul className="brandbook-structure">
              <li>主图标需要至少等于图标高度的四分之一的留白。</li>
              <li>组合版周围预留空间等于字标高度。</li>
              <li>缩放到 32px 时优先使用 Icon A，确保描边可识别。</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
