import { Suspense, lazy, useMemo, useState } from "react";
import { AboutPage } from "./AboutPage";
import { BrandManualPage } from "./BrandManualPage";
import { CompanionPlushPage } from "./CompanionPlushPage";
import { DownloadPage } from "./DownloadPage";
import { FloatingSheepPet } from "./FloatingSheepPet";
import { FuturePage } from "./FuturePage";
import { HomePage } from "./HomePage";
import { IpPage } from "./IpPage";
import { LuckyColorPage } from "./LuckyColorPage";
import { ROUTE_PATHS, TOP_NAV } from "./config/brandWorld";
import { BRAND_COPY, DOWNLOAD_PAGE_PATH } from "./config/experience";

const BUILD_TAG = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString().slice(0, 16).replace("T", " ");
const LazyWheel = lazy(() => import("./WebLuckyWheel").then((mod) => ({ default: mod.WebLuckyWheel })));

type RouteKey = "home" | "lucky" | "ip" | "future" | "about" | "download" | "brandManual" | "companionPlush";

function normalizePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

function routeByPath(pathname: string): RouteKey {
  const path = normalizePath(pathname);
  if (path === ROUTE_PATHS.lucky) return "lucky";
  if (path === ROUTE_PATHS.ip) return "ip";
  if (path === ROUTE_PATHS.future) return "future";
  if (path === ROUTE_PATHS.about) return "about";
  if (path === ROUTE_PATHS.download || path === DOWNLOAD_PAGE_PATH) return "download";
  if (path === ROUTE_PATHS.brandManual) return "brandManual";
  if (path === ROUTE_PATHS.companionPlush) return "companionPlush";
  return "home";
}

export function App() {
  const route = useMemo(() => routeByPath(window.location.pathname), []);
  const currentPath = normalizePath(window.location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  const renderPage = () => {
    if (route === "download") return <DownloadPage />;
    if (route === "lucky") return <LuckyColorPage />;
    if (route === "ip") return <IpPage />;
    if (route === "future") return <FuturePage />;
    if (route === "about") return <AboutPage />;
    if (route === "brandManual") return <BrandManualPage />;
    if (route === "companionPlush") return <CompanionPlushPage />;
    return (
      <HomePage
        WheelSection={
          <section id="play" className="section play-shell">
            <Suspense
              fallback={
                <div className="play-card loading-card">
                  <h2>网页幸运转盘</h2>
                  <p>正在准备今天的颜色，请稍等一下。</p>
                </div>
              }
            >
              <LazyWheel />
            </Suspense>
          </section>
        }
      />
    );
  };

  return (
    <div className="page">
      <nav className="top-nav cw-top-nav">
        <a className="nav-brand" href={ROUTE_PATHS.home}>
          <span>{BRAND_COPY.brandName}</span>
          <small>{BRAND_COPY.brandNameCn} · {BRAND_COPY.slogan}</small>
        </a>

        <button
          type="button"
          className="nav-menu-btn"
          aria-expanded={menuOpen}
          aria-label="打开导航"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          菜单
        </button>

        <div className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          {TOP_NAV.map((item) => (
            <a key={item.path} href={item.path} className={currentPath === item.path ? "nav-active" : ""}>
              {item.label}
            </a>
          ))}
        </div>

        <div className={`cw-nav-cta ${menuOpen ? "is-open" : ""}`}>
          <a className="cta" href={ROUTE_PATHS.lucky}>抽取今日幸运色</a>
          <a className="ghost-btn" href={ROUTE_PATHS.download}>下载 App</a>
        </div>
      </nav>

      {renderPage()}

      <footer className="footer cw-footer">
        <div className="cw-footer-grid">
          <div>
            <p><b>{BRAND_COPY.brandName}</b></p>
            <p>{BRAND_COPY.brandNameCn}</p>
            <p>{BRAND_COPY.oneLiner}</p>
            <p>{BRAND_COPY.slogan}</p>
          </div>
          <div>
            <p><b>站点导航</b></p>
            <p>
              <a href={ROUTE_PATHS.home}>首页</a> · <a href={ROUTE_PATHS.lucky}>今日幸运色</a> · <a href={ROUTE_PATHS.ip}>小羊卷</a>
            </p>
            <p>
              <a href={ROUTE_PATHS.download}>下载 App</a> · <a href={ROUTE_PATHS.about}>关于羊卷岛</a> · <a href={ROUTE_PATHS.future}>未来陪伴</a>
            </p>
            <p>
              <a href={ROUTE_PATHS.brandManual}>品牌手册首页</a>
            </p>
            <p>
              <a href={ROUTE_PATHS.companionPlush}>陪伴玩偶系列</a>
            </p>
          </div>
          <div>
            <p><b>支持与帮助</b></p>
            <p>下载与安装：<a href={ROUTE_PATHS.download}>查看下载页</a></p>
            <p>常见问题：<a href={`${ROUTE_PATHS.about}#faq`}>查看 FAQ</a></p>
            <p>联系我们：hello@yangjuandao.com（占位）</p>
          </div>
        </div>
        <p>© 2026 LambRoll Isle（羊卷岛） · {BRAND_COPY.slogan}</p>
        <p className="version-badge">版本更新：{BUILD_TAG}</p>
      </footer>

      <FloatingSheepPet />
    </div>
  );
}




