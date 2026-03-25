import { COLOR_PALETTE } from "@colorwalking/shared";
import { Suspense, lazy } from "react";
import { LuckyColorOracle } from "./LuckyColorOracle";

const LazyWheel = lazy(() => import("./WebLuckyWheel").then((mod) => ({ default: mod.WebLuckyWheel })));

export function App() {
  return (
    <div className="page">
      <nav className="top-nav">
        <div className="nav-brand">ColorWalking</div>
        <div className="nav-links">
          <a href="#features">产品亮点</a>
          <a href="#play">幸运转盘</a>
          <a href="#oracle">黄历生辰</a>
          <a href="#growth">每日习惯</a>
        </div>
      </nav>

      <header className="hero">
        <div>
          <p className="tag">每日幸运色仪式感</p>
          <h1>ColorWalking</h1>
          <p className="slogan">Walk in color, walk in mood.</p>
          <p className="desc">
            一个面向大众的幸运色转盘网站。每天点击一次，抽取今天的情绪主色，带着更轻盈的心情出发。
          </p>
          <div className="actions">
            <a className="cta" href="#play">开始 ColorWalking</a>
          </div>
        </div>
        <div className="sheep-card">
          <img src="/brand-logo.svg" alt="五彩斑斓的小羊卷" loading="eager" decoding="async" />
        </div>
      </header>

      <section id="features" className="section">
        <h2>产品亮点</h2>
        <div className="grid">
          <article>
            <h3>稳定旋转</h3>
            <p>圆盘围绕固定圆心旋转，不晃动，点击圆盘或中心都可触发。</p>
          </article>
          <article>
            <h3>多彩抽取</h3>
            <p>内置原创色盘与鼓励文案，快速得到属于你的今日幸运色。</p>
          </article>
          <article>
            <h3>本地记录</h3>
            <p>保留最近抽取历史，形成每日好心情打卡习惯。</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>幸运色样本</h2>
        <div className="palette">
          {COLOR_PALETTE.map((item) => (
            <div key={item.id} className="chip">
              <span style={{ backgroundColor: item.hex }} />
              <b>{item.name}</b>
              <small>{item.hex}</small>
            </div>
          ))}
        </div>
      </section>

      <section id="growth" className="section start-card">
        <h2>每日好心情习惯</h2>
        <div className="grid">
          <article>
            <h3>每日抽取</h3>
            <p>每天抽一次幸运色，建立稳定的正向心理提示。</p>
          </article>
          <article>
            <h3>分享鼓励</h3>
            <p>分享今日颜色给朋友，把积极心情传递出去。</p>
          </article>
          <article>
            <h3>复盘记录</h3>
            <p>查看近期抽取历史，感受自己状态的连续变化。</p>
          </article>
        </div>
      </section>

      <LuckyColorOracle />

      <section id="play" className="section play-shell">
        <Suspense
          fallback={
            <div className="play-card loading-card">
              <h2>网页版转盘</h2>
              <p>模块加载中，马上就好...</p>
            </div>
          }
        >
          <LazyWheel />
        </Suspense>
      </section>

      <footer className="footer">
        <p>IP 角色：五彩斑斓的小羊卷</p>
        <p>? 2026 ColorWalking. All rights reserved. 原创内容受版权保护。</p>
      </footer>
    </div>
  );
}
