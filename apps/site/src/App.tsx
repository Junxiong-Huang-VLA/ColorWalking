import { COLOR_PALETTE } from "@colorwalking/shared";
import { WebLuckyWheel } from "./WebLuckyWheel";

export function App() {
  return (
    <div className="page">
      <nav className="top-nav">
        <div className="nav-brand">ColorWalking</div>
        <div className="nav-links">
          <a href="#features">产品亮点</a>
          <a href="#play">幸运转盘</a>
          <a href="#growth">激励任务</a>
          <a href="#premium">会员中心</a>
          <a href="#apk-guide">下载</a>
        </div>
      </nav>

      <header className="hero">
        <div>
          <p className="tag">每日幸运色仪式感</p>
          <h1>ColorWalking</h1>
          <p className="slogan">Walk in color, walk in mood.</p>
          <p className="desc">
            一个面向大众的幸运色转盘 App。每天点击一次，抽取今天的情绪主色，带着更轻盈的心情出发。
          </p>
          <div className="actions">
            <a className="cta" href="#play">开始 ColorWalking</a>
            <a className="ghost-btn" href="#premium">查看会员权益</a>
          </div>
        </div>
        <div className="sheep-card">
          <img src="/brand-logo.svg" alt="五彩斑斓的小羊卷" />
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
            <h3>成长激励</h3>
            <p>签到、分享、连续打卡可获得心情币，形成长期好习惯。</p>
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
        <h2>好心情激励任务</h2>
        <div className="grid">
          <article>
            <h3>每日签到</h3>
            <p>每天完成签到可获得 5 心情币，连续签到可提升连击奖励。</p>
          </article>
          <article>
            <h3>分享奖励</h3>
            <p>分享今日幸运色给朋友，每次可获得 2 心情币，帮助增长与裂变。</p>
          </article>
          <article>
            <h3>试用解锁</h3>
            <p>可用心情币兑换高级功能试用，提升付费转化前的体验认知。</p>
          </article>
        </div>
      </section>

      <WebLuckyWheel />

      <section id="premium" className="section premium-card">
        <h2>会员中心（变现方案）</h2>
        <p>通过免费体验 + 轻订阅模式，提高留存和持续收入。</p>
        <div className="premium-grid">
          <article>
            <h3>免费版</h3>
            <p>基础色盘、每日抽取、最近记录。</p>
            <b>￥0</b>
          </article>
          <article>
            <h3>月度会员</h3>
            <p>高级主题色盘、深度鼓励语、成长报告。</p>
            <b>建议：￥12/月</b>
          </article>
          <article>
            <h3>年度会员</h3>
            <p>全部会员权益 + 专属节日限定主题。</p>
            <b>建议：￥99/年</b>
          </article>
        </div>
      </section>

      <section id="apk-guide" className="section start-card">
        <h2>Android 安装包（APK）</h2>
        <p>在项目根目录执行打包脚本，构建完成后会给出 APK 下载链接：</p>
        <pre>
          <code>powershell -ExecutionPolicy Bypass -File .\scripts\build-android-apk.ps1</code>
        </pre>
      </section>

      <footer className="footer">
        <p>IP 角色：五彩斑斓的小羊卷</p>
        <p>© 2026 ColorWalking. All rights reserved. 原创内容受版权保护。</p>
      </footer>
    </div>
  );
}
