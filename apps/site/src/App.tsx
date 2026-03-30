import { Suspense, lazy, useMemo, useState } from "react";
import { FloatingSheepPet } from "./FloatingSheepPet";
import { ROUTE_PATHS, TOP_NAV } from "./config/brandWorld";
import { BRAND_COPY, DOWNLOAD_PAGE_PATH } from "./config/experience";

const BUILD_TAG = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString().slice(0, 16).replace("T", " ");
const LazyWheel = lazy(() => import("./WebLuckyWheel").then((mod) => ({ default: mod.WebLuckyWheel })));
const LazyHomePage = lazy(() => import("./HomePage").then((mod) => ({ default: mod.HomePage })));
const LazyLuckyColorPage = lazy(() => import("./LuckyColorPage").then((mod) => ({ default: mod.LuckyColorPage })));
const LazyIpPage = lazy(() => import("./IpPage").then((mod) => ({ default: mod.IpPage })));
const LazyFuturePage = lazy(() => import("./FuturePage").then((mod) => ({ default: mod.FuturePage })));
const LazyAboutPage = lazy(() => import("./AboutPage").then((mod) => ({ default: mod.AboutPage })));
const LazyDownloadPage = lazy(() => import("./DownloadPage").then((mod) => ({ default: mod.DownloadPage })));
const LazyBrandManualPage = lazy(() => import("./BrandManualPage").then((mod) => ({ default: mod.BrandManualPage })));
const LazyCompanionPlushPage = lazy(() => import("./CompanionPlushPage").then((mod) => ({ default: mod.CompanionPlushPage })));

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

function PageFallback() {
  return (
    <section className="section brand-panel loading-card">
      <h2>页面加载中</h2>
      <p>正在准备内容，请稍等一下。</p>
    </section>
  );
}

export function App() {
  const route = useMemo(() => routeByPath(window.location.pathname), []);
  const currentPath = normalizePath(window.location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  const renderPage = () => {
    if (route === "download") return <LazyDownloadPage />;
    if (route === "lucky") return <LazyLuckyColorPage />;
    if (route === "ip") return <LazyIpPage />;
    if (route === "future") return <LazyFuturePage />;
    if (route === "about") return <LazyAboutPage />;
    if (route === "brandManual") return <LazyBrandManualPage />;
    if (route === "companionPlush") return <LazyCompanionPlushPage />;
    return (
      <LazyHomePage
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
    <div className="page brand-v6">
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

      <Suspense fallback={<PageFallback />}>
        {renderPage()}
      </Suspense>

      <footer className="footer cw-footer">
        <div className="cw-footer-grid">
          <div>
            <p className="footer-title"><b>{BRAND_COPY.brandName}</b></p>
            <p className="footer-sub">{BRAND_COPY.brandNameCn}</p>
            <p>{BRAND_COPY.oneLiner}</p>
            <p>{BRAND_COPY.slogan}</p>
            <p>{BRAND_COPY.productSlogan}</p>
          </div>
          <div>
            <p className="footer-title"><b>站点导航</b></p>
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
            <p className="footer-title"><b>支持与帮助</b></p>
            <p>下载与安装：<a href={ROUTE_PATHS.download}>查看下载页</a></p>
            <p>常见问题：<a href={`${ROUTE_PATHS.about}#faq`}>查看 FAQ</a></p>
            <p>联系邮箱：hello@yangjuandao.com（占位）</p>
          </div>
        </div>
        <div className="footer-meta">
          <p>© 2026 LambRoll Isle（羊卷岛） · {BRAND_COPY.slogan}</p>
          <p className="version-badge">版本更新：{BUILD_TAG}</p>
        </div>
      </footer>

      <FloatingSheepPet />
    </div>
  );
}
