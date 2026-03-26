import { COLOR_PALETTE } from "@colorwalking/shared";
import { Suspense, lazy } from "react";
import { LuckyColorOracle } from "./LuckyColorOracle";
import { SheepPetGarden } from "./SheepPetGarden";

const LazyWheel = lazy(() => import("./WebLuckyWheel").then((mod) => ({ default: mod.WebLuckyWheel })));
const BUILD_TAG = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString().slice(0, 16).replace("T", " ");

export function App() {
  return (
    <div className="page">
      <nav className="top-nav">
        <div className="nav-brand">ColorWalking</div>
        <div className="nav-links">
          <a href="#features">{"\u4ea7\u54c1\u4eae\u70b9"}</a>
          <a href="#play">{"\u5e78\u8fd0\u8f6c\u76d8"}</a>
          <a href="#pet">{"\u5c0f\u7f8a\u5377"}</a>
          <a href="#oracle">{"\u9ec4\u5386\u751f\u8fb0"}</a>
          <a href="#growth">{"\u6bcf\u65e5\u4e60\u60ef"}</a>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <p className="tag">{"\u6bcf\u5929\u82b1 10 \u79d2\uff0c\u7ed9\u5fc3\u60c5\u4e00\u70b9\u989c\u8272"}</p>
          <h1>ColorWalking</h1>
          <p className="slogan">{"\u4eca\u65e5\u5e78\u8fd0\u8272 \u00b7 \u8f7b\u966a\u4f34 \u00b7 \u5c0f\u7f8a\u5377"}</p>
          <p className="desc">
            {"\u6253\u5f00\u9875\u9762\uff0c\u62bd\u4e00\u4e2a\u4eca\u65e5\u989c\u8272\uff0c\u518d\u548c\u5c0f\u7f8a\u5377\u8bf4\u4e24\u53e5\u8bdd\u3002\u5b83\u4f1a\u5728\u65e5\u5e38\u91cc\uff0c\u7ed9\u4f60\u4e00\u70b9\u4e0d\u6253\u6270\u7684\u6e29\u67d4\u56de\u5e94\u3002"}
          </p>
          <p className="hero-note">{"\u4e0d\u7528\u7acb\u523b\u53d8\u5f97\u66f4\u597d\uff0c\u5148\u8ba9\u81ea\u5df1\u6162\u4e00\u70b9\u4e5f\u53ef\u4ee5\u3002"}</p>
          <div className="actions">
            <a className="cta" href="#play">{"\u62bd\u53d6\u4eca\u65e5\u5e78\u8fd0\u8272"}</a>
            <a className="ghost-btn hero-ghost" href="#pet">{"\u5148\u548c\u5c0f\u7f8a\u5377\u6253\u4e2a\u62db\u547c"}</a>
          </div>
        </div>
        <div className="sheep-card hero-art">
          <img src="/brand-logo.svg" alt={"\u4e94\u5f69\u6591\u6593\u7684\u5c0f\u7f8a\u5377"} loading="eager" decoding="async" />
          <p className="hero-art-note">{"\u4eca\u65e5\u5c0f\u63d0\u793a\uff1a\u4e0d\u7528\u5f88\u591a\u529b\u6c14\uff0c\u4f60\u5df2\u7ecf\u5728\u8ba4\u771f\u751f\u6d3b\u4e86\u3002"}</p>
        </div>
      </header>

      <section id="features" className="section">
        <h2>{"\u4ea7\u54c1\u4eae\u70b9"}</h2>
        <div className="grid">
          <article>
            <h3>{"\u7a33\u5b9a\u62bd\u53d6"}</h3>
            <p>{"\u70b9\u51fb\u5706\u76d8\u6216\u4e2d\u5fc3\u6309\u94ae\u5373\u53ef\u62bd\u53d6\uff0c\u4f53\u9a8c\u7b80\u5355\u3001\u6d41\u7545\uff0c\u4e0d\u6253\u65ad\u4f60\u7684\u8282\u594f\u3002"}</p>
          </article>
          <article>
            <h3>{"\u6e29\u67d4\u7ed3\u679c"}</h3>
            <p>{"\u6bcf\u6b21\u7ed3\u679c\u90fd\u4e0d\u53ea\u662f\u4e00\u4e2a\u8272\u503c\uff0c\u8fd8\u4f1a\u9644\u5e26\u4e00\u53e5\u5c0f\u5c0f\u7684\u5fc3\u60c5\u63d0\u9192\u3002"}</p>
          </article>
          <article>
            <h3>{"\u8f7b\u91cf\u966a\u4f34"}</h3>
            <p>{"\u4fdd\u5b58\u8fd1\u671f\u8bb0\u5f55\uff0c\u8ba9\u4f60\u5728\u5fd9\u788c\u7684\u65e5\u5b50\u91cc\uff0c\u4e5f\u80fd\u770b\u89c1\u81ea\u5df1\u7684\u5c0f\u53d8\u5316\u3002"}</p>
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
            <h3>{"\u6bcf\u5929\u4e00\u6b21"}</h3>
            <p>{"\u7528\u4e00\u6b21\u62bd\u53d6\uff0c\u628a\u4eca\u5929\u8fc7\u6210\u4e00\u4e2a\u6709\u5c0f\u5c0f\u4eea\u5f0f\u611f\u7684\u65e5\u5b50\u3002"}</p>
          </article>
          <article>
            <h3>{"\u8f7b\u8f7b\u5206\u4eab"}</h3>
            <p>{"\u82e5\u4f60\u613f\u610f\uff0c\u53ef\u4ee5\u628a\u4eca\u65e5\u989c\u8272\u53d1\u7ed9\u670b\u53cb\uff0c\u4f20\u9012\u4e00\u70b9\u6e29\u548c\u7684\u5fc3\u60c5\u3002"}</p>
          </article>
          <article>
            <h3>{"\u6162\u6162\u770b\u89c1"}</h3>
            <p>{"\u5076\u5c14\u56de\u5934\u770b\u770b\u8bb0\u5f55\uff0c\u4f60\u4f1a\u53d1\u73b0\uff1a\u81ea\u5df1\u5176\u5b9e\u4e00\u76f4\u5728\u5f80\u524d\u8d70\u3002"}</p>
          </article>
        </div>
      </section>

      <SheepPetGarden />

      <LuckyColorOracle />

      <section id="play" className="section play-shell">
        <Suspense
          fallback={
            <div className="play-card loading-card">
              <h2>{"\u7f51\u9875\u7248\u8f6c\u76d8"}</h2>
              <p>{"\u6b63\u5728\u51c6\u5907\u4eca\u5929\u7684\u989c\u8272\uff0c\u7a0d\u7b49\u4e00\u4e0b\u4e0b..."}</p>
            </div>
          }
        >
          <LazyWheel />
        </Suspense>
      </section>

      <footer className="footer">
        <p>{"IP \u89d2\u8272\uff1a\u4e94\u5f69\u6591\u6593\u7684\u5c0f\u7f8a\u5377"}</p>
        <p>{"\u00a9 2026 ColorWalking. \u613f\u4f60\u6bcf\u5929\u90fd\u6709\u4e00\u70b9\u88ab\u8f7b\u8f7b\u5b89\u6170\u5230\u7684\u65f6\u523b\u3002"}</p>
        <p className="version-badge">{"\u7248\u672c\u66f4\u65b0\uff1a"}{BUILD_TAG}</p>
      </footer>
    </div>
  );
}
