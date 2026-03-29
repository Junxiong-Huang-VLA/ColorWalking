import { COLOR_PALETTE } from "@colorwalking/shared";
import { type ReactNode, useState } from "react";
import { SheepPetGarden } from "./SheepPetGarden";
import { LuckyColorOracle } from "./LuckyColorOracle";
import { ANDROID_APK_URL, BRAND_COPY, DOWNLOAD_PAGE_PATH } from "./config/experience";
import { FUTURE_LABS, SEASONAL_PREVIEWS } from "./config/brandWorld";

type Props = {
  WheelSection: ReactNode;
};

export function HomePage({ WheelSection }: Props) {
  const [copiedId, setCopiedId] = useState("");

  const onCopyColor = async (hex: string, id: string) => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      // ignore
    }
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1400);
  };

  return (
    <>
      <header className="hero">
        <div className="hero-copy">
          <p className="tag">{BRAND_COPY.heroTag}</p>
          <h1>{BRAND_COPY.heroTitle}</h1>
          <p className="slogan">{BRAND_COPY.heroSlogan}</p>
          <p className="desc">{BRAND_COPY.heroDesc}</p>
          <p className="hero-note">{BRAND_COPY.heroNote}</p>
          <div className="actions">
            <a className="cta" href="/lucky-color">今天，也为自己抽一份幸运颜色</a>
            <a className="ghost-btn hero-ghost" href="/xiaoyangjuan">认识小羊卷</a>
            <a className="ghost-btn" href={DOWNLOAD_PAGE_PATH}>下载 App</a>
          </div>
        </div>
        <div className="sheep-card hero-art">
          <img src="/brand-logo.svg" alt="ColorWalking 品牌图标" loading="eager" decoding="async" />
          <p className="hero-art-note">ColorWalking 正在从幸运色网页，成长为一个长期陪伴 IP 官网。</p>
        </div>
      </header>

      <section id="features" className="section">
        <h2>品牌与产品入口</h2>
        <div className="grid">
          <article>
            <h3>品牌站</h3>
            <p>讲清楚 ColorWalking 的理念、气质和未来路线，而不是只放一个按钮。</p>
          </article>
          <article>
            <h3>产品站</h3>
            <p>幸运色主流程、时色签、小羊卷养成仓形成完整体验闭环。</p>
          </article>
          <article>
            <h3>下载与增长</h3>
            <p>统一品牌域名下载入口，承接移动端转化与后续回访。</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>幸运色内容系统</h2>
        <div className="palette">
          {COLOR_PALETTE.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip${copiedId === item.id ? " chip-copied" : ""}`}
              onClick={() => onCopyColor(item.hex, item.id)}
              title={`点击复制 ${item.hex}`}
              aria-label={`复制颜色 ${item.name} ${item.hex}`}
            >
              <span style={{ backgroundColor: item.hex }} />
              <b>{item.name}</b>
              <small>{copiedId === item.id ? "已复制" : item.hex}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="section cw-card">
        <h2>活动与节日主题预留</h2>
        <div className="cw-season-grid">
          {SEASONAL_PREVIEWS.map((item) => (
            <article key={item.name} className="cw-season-item">
              <b>{item.name}</b>
              <small>{item.period}</small>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section start-card">
        <h2>未来预告</h2>
        <div className="grid">
          {FUTURE_LABS.slice(0, 3).map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="start-actions" style={{ marginTop: 12 }}>
          <a className="ghost-btn" href="/future">查看陪伴未来路线</a>
          <a className="ghost-btn" href={ANDROID_APK_URL}>下载 Android APK</a>
        </div>
      </section>

      <SheepPetGarden />
      <LuckyColorOracle />
      {WheelSection}
    </>
  );
}
