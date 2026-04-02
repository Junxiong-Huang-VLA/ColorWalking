import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
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
  const [homeNavHidden, setHomeNavHidden] = useState(false);
  const isHomeRoute = route === "home";
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const isPremiereMode = query.get("premiere") === "1" || query.get("demo") === "1";
  const navItems = isHomeRoute ? TOP_NAV.filter((item) => item.path !== ROUTE_PATHS.about) : TOP_NAV;
  const lastScrollYRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isHomeRoute) {
      setHomeNavHidden(false);
      return;
    }

    lastScrollYRef.current = window.scrollY;
    setHomeNavHidden(false);

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastScrollYRef.current;
      lastScrollYRef.current = y;
      scrollRafRef.current = null;

      if (y < 36) {
        setHomeNavHidden(false);
        return;
      }

      if (delta > 8) setHomeNavHidden(true);
      if (delta < -6) setHomeNavHidden(false);
    };

    const onScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [isHomeRoute]);

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
              <LazyWheel minimal />
            </Suspense>
          </section>
        }
      />
    );
  };

  return (
    <div className={`page brand-v6${isPremiereMode ? " is-premiere-mode" : ""}`}>
      <nav className={`top-nav cw-top-nav${isHomeRoute ? " is-home-stage" : ""}${isPremiereMode ? " is-premiere" : ""}${isHomeRoute && homeNavHidden && !menuOpen ? " is-hidden" : ""}`}>
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
          {navItems.map((item) => (
            <a key={item.path} href={item.path} className={currentPath === item.path ? "nav-active" : ""}>
              {item.label}
            </a>
          ))}
        </div>

        <div className={`cw-nav-cta ${menuOpen ? "is-open" : ""}`}>
          <a className="cta" href={ROUTE_PATHS.lucky}>抽取今日幸运色</a>
          {!isHomeRoute && !isPremiereMode ? <a className="ghost-btn" href={ROUTE_PATHS.download}>下载 App</a> : null}
        </div>
      </nav>

      {renderPage()}

      {!isHomeRoute && !isPremiereMode ? (
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
                <a href={ROUTE_PATHS.future}>关系成长</a> · <a href={ROUTE_PATHS.about}>共同记忆</a> · <a href={ROUTE_PATHS.download}>下载 App</a>
              </p>
            </div>
            <div>
              <p className="footer-title"><b>支持与帮助</b></p>
              <p>常见问题：<a href={`${ROUTE_PATHS.about}#faq`}>查看 FAQ</a></p>
              <p>联系邮箱：hello@yangjuandao.com（占位）</p>
              <p className="version-badge">版本更新：{BUILD_TAG}</p>
            </div>
          </div>
        </footer>
      ) : null}

      {!isHomeRoute && !isPremiereMode ? <FloatingSheepPet /> : null}
    </div>
  );
}
