import { ROUTE_PATHS } from "../config/brandWorld";
import { buildDemoHref } from "../demoMode";

export type DemoPathStep =
  | "stage"
  | "draw"
  | "sync"
  | "first-touch"
  | "interaction"
  | "growth"
  | "memory"
  | "waitlist";

type Props = {
  activeStep: DemoPathStep;
  autoplay?: boolean;
};

const STEP_ITEMS: Array<{ key: DemoPathStep; label: string; href: string }> = [
  { key: "stage", label: "1. 首屏亮相", href: `${buildDemoHref(ROUTE_PATHS.home, "home", { autoplay: false })}#hero-stage` },
  { key: "draw", label: "2. 抽今日色", href: `${buildDemoHref(ROUTE_PATHS.home, "home", { autoplay: false })}#hero-stage` },
  { key: "sync", label: "3. 状态同步", href: `${buildDemoHref(ROUTE_PATHS.home, "home", { autoplay: false })}#hero-stage` },
  { key: "first-touch", label: "4. 首屏互动", href: `${buildDemoHref(ROUTE_PATHS.home, "home", { autoplay: false })}#hero-stage` },
  { key: "interaction", label: "5. 完整互动", href: buildDemoHref(ROUTE_PATHS.lucky, "interaction", { autoplay: false }) },
  { key: "growth", label: "6. 关系成长", href: buildDemoHref(ROUTE_PATHS.future, "growth", { autoplay: false }) },
  { key: "memory", label: "7. 共同记忆", href: buildDemoHref(ROUTE_PATHS.about, "memory", { autoplay: false }) },
  { key: "waitlist", label: "8. 候补承接", href: `${buildDemoHref(ROUTE_PATHS.future, "waitlist", { autoplay: false })}#waitlist-conversion` }
];

function withAutoplay(href: string, autoplay: boolean): string {
  if (!autoplay) return href;
  const [base, hash = ""] = href.split("#");
  const [path, search = ""] = base.split("?");
  const params = new URLSearchParams(search);
  params.set("autoplay", "1");
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

export function DemoPathBar({ activeStep, autoplay = false }: Props) {
  return (
    <nav className="demo-path-bar" aria-label="投资人演示主路径">
      {STEP_ITEMS.map((item) => {
        const href = withAutoplay(item.href, autoplay);
        return (
          <a key={item.key} href={href} className={item.key === activeStep ? "is-active" : ""}>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
