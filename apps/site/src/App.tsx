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
          <a href="#features">{"\u4ea7\u54c1\u4eae\u70b9"}</a>
          <a href="#play">{"\u5e78\u8fd0\u8f6c\u76d8"}</a>
          <a href="#oracle">{"\u9ec4\u5386\u751f\u8fb0"}</a>
          <a href="#growth">{"\u6bcf\u65e5\u4e60\u60ef"}</a>
        </div>
      </nav>

      <header className="hero">
        <div>
          <p className="tag">{"\u6bcf\u65e5\u5e78\u8fd0\u8272\u4eea\u5f0f\u611f"}</p>
          <h1>ColorWalking</h1>
          <p className="slogan">Walk in color, walk in mood.</p>
          <p className="desc">
            {"\u4e00\u4e2a\u9762\u5411\u5927\u4f17\u7684\u5e78\u8fd0\u8272\u8f6c\u76d8\u7f51\u7ad9\u3002\u6bcf\u5929\u70b9\u51fb\u4e00\u6b21\uff0c\u62bd\u53d6\u4eca\u5929\u7684\u60c5\u7eea\u4e3b\u8272\uff0c\u5e26\u7740\u66f4\u8f7b\u76c8\u7684\u5fc3\u60c5\u51fa\u53d1\u3002"}
          </p>
          <div className="actions">
            <a className="cta" href="#play">{"\u5f00\u59cb ColorWalking"}</a>
          </div>
        </div>
        <div className="sheep-card">
          <img src="/brand-logo.svg" alt={"\u4e94\u5f69\u6591\u6593\u7684\u5c0f\u7f8a\u5377"} loading="eager" decoding="async" />
        </div>
      </header>

      <section id="features" className="section">
        <h2>{"\u4ea7\u54c1\u4eae\u70b9"}</h2>
        <div className="grid">
          <article>
            <h3>{"\u7a33\u5b9a\u65cb\u8f6c"}</h3>
            <p>{"\u5706\u76d8\u56f4\u7ed5\u56fa\u5b9a\u5706\u5fc3\u65cb\u8f6c\uff0c\u4e0d\u6643\u52a8\uff0c\u70b9\u51fb\u5706\u76d8\u6216\u4e2d\u5fc3\u90fd\u53ef\u89e6\u53d1\u3002"}</p>
          </article>
          <article>
            <h3>{"\u591a\u5f69\u62bd\u53d6"}</h3>
            <p>{"\u5185\u7f6e\u539f\u521b\u8272\u76d8\u4e0e\u9f13\u52b1\u6587\u6848\uff0c\u5feb\u901f\u5f97\u5230\u5c5e\u4e8e\u4f60\u7684\u4eca\u65e5\u5e78\u8fd0\u8272\u3002"}</p>
          </article>
          <article>
            <h3>{"\u672c\u5730\u8bb0\u5f55"}</h3>
            <p>{"\u4fdd\u7559\u6700\u8fd1\u62bd\u53d6\u5386\u53f2\uff0c\u5f62\u6210\u6bcf\u65e5\u597d\u5fc3\u60c5\u6253\u5361\u4e60\u60ef\u3002"}</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>{"\u5e78\u8fd0\u8272\u6837\u672c"}</h2>
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
        <h2>{"\u6bcf\u65e5\u597d\u5fc3\u60c5\u4e60\u60ef"}</h2>
        <div className="grid">
          <article>
            <h3>{"\u6bcf\u65e5\u62bd\u53d6"}</h3>
            <p>{"\u6bcf\u5929\u62bd\u4e00\u6b21\u5e78\u8fd0\u8272\uff0c\u5efa\u7acb\u7a33\u5b9a\u7684\u6b63\u5411\u5fc3\u7406\u63d0\u793a\u3002"}</p>
          </article>
          <article>
            <h3>{"\u5206\u4eab\u9f13\u52b1"}</h3>
            <p>{"\u5206\u4eab\u4eca\u65e5\u989c\u8272\u7ed9\u670b\u53cb\uff0c\u628a\u79ef\u6781\u5fc3\u60c5\u4f20\u9012\u51fa\u53bb\u3002"}</p>
          </article>
          <article>
            <h3>{"\u590d\u76d8\u8bb0\u5f55"}</h3>
            <p>{"\u67e5\u770b\u8fd1\u671f\u62bd\u53d6\u5386\u53f2\uff0c\u611f\u53d7\u81ea\u5df1\u72b6\u6001\u7684\u8fde\u7eed\u53d8\u5316\u3002"}</p>
          </article>
        </div>
      </section>

      <LuckyColorOracle />

      <section id="play" className="section play-shell">
        <Suspense
          fallback={
            <div className="play-card loading-card">
              <h2>{"\u7f51\u9875\u7248\u8f6c\u76d8"}</h2>
              <p>{"\u6a21\u5757\u52a0\u8f7d\u4e2d\uff0c\u9a6c\u4e0a\u5c31\u597d..."}</p>
            </div>
          }
        >
          <LazyWheel />
        </Suspense>
      </section>

      <footer className="footer">
        <p>{"IP \u89d2\u8272\uff1a\u4e94\u5f69\u6591\u6593\u7684\u5c0f\u7f8a\u5377"}</p>
        <p>{"\u00a9 2026 ColorWalking. All rights reserved. \u539f\u521b\u5185\u5bb9\u53d7\u7248\u6743\u4fdd\u62a4\u3002"}</p>
      </footer>
    </div>
  );
}
