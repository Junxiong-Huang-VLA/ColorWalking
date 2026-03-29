import { useMemo, useState } from "react";
import { FAQ_ITEMS, SUPPORT_CHANNELS } from "./config/brandWorld";

export function AboutPage() {
  const [query, setQuery] = useState("");

  const filteredFaq = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter((item) => (`${item.q} ${item.a}`).toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="cw-page-stack">
      <section className="section cw-card">
        <h2>About ColorWalking</h2>
        <p>ColorWalking 是以幸运色为入口、以小羊卷为核心角色、以轻陪伴为体验核心的原创 IP 项目。</p>
      </section>

      <section className="section cw-card">
        <h2>帮助与支持</h2>
        <div className="cw-support-grid">
          {SUPPORT_CHANNELS.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <code>{item.contact}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="section cw-card">
        <h2>服务说明</h2>
        <div className="cw-policy-grid">
          <article>
            <h3>内容层</h3>
            <p>每日幸运色、寄语与时色签将持续更新并按季度扩展主题。</p>
          </article>
          <article>
            <h3>下载层</h3>
            <p>Android 下载入口固定品牌路径，版本升级后自动重定向到新包。</p>
          </article>
          <article>
            <h3>IP层</h3>
            <p>小羊卷设定、世界观与周边路线会在官网持续公开迭代。</p>
          </article>
        </div>
      </section>

      <section className="section cw-card">
        <h2>FAQ</h2>
        <input
          className="cw-faq-search"
          placeholder="搜索问题：同步、下载、周边、活动..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div style={{ marginTop: 10 }}>
          {filteredFaq.length === 0 ? <p>没有找到匹配问题。</p> : null}
          {filteredFaq.map((item) => (
            <details key={item.q} className="cw-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
