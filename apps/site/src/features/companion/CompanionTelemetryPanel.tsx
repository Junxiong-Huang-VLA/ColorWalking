import { useMemo, useState } from "react";
import type { TelemetryEventItem } from "../../state/types";

type CompanionTelemetryPanelProps = {
  items: TelemetryEventItem[];
};

type TelemetryWindow = "today" | "seven_days";

function windowStartMs(windowMode: TelemetryWindow): number {
  const now = new Date();
  if (windowMode === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  return now.getTime() - 7 * 24 * 60 * 60 * 1000;
}

function funnelRate(numerator: number, denominator: number): string {
  if (denominator <= 0) return "--";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function toTabValue(payload: TelemetryEventItem["payload"]): string {
  const value = payload?.toTab;
  return typeof value === "string" ? value : "";
}

export function CompanionTelemetryPanel({ items }: CompanionTelemetryPanelProps) {
  const [windowMode, setWindowMode] = useState<TelemetryWindow>("today");

  const filteredItems = useMemo(() => {
    const startMs = windowStartMs(windowMode);
    return items.filter((item) => new Date(item.at).getTime() >= startMs);
  }, [items, windowMode]);

  const topItems = filteredItems.slice(0, 8);
  const entryCount = filteredItems.filter((item) => item.eventName === "entry_clicked").length;
  const interactionCount = filteredItems.filter(
    (item) => item.eventName === "tab_converted" && toTabValue(item.payload) === "interaction"
  ).length;
  const waitlistCount = filteredItems.filter((item) => item.eventName === "waitlist_cta_clicked").length;

  return (
    <article className="card telemetry-panel-card" data-testid="telemetry-panel">
      <h2>验证埋点面板</h2>
      <p className="muted">用于复盘入口点击、跨页转化与候补提交，先保证对外验证阶段可读可复盘。</p>

      <div className="telemetry-window-switch" role="tablist" aria-label="埋点时间窗">
        <button
          type="button"
          className={windowMode === "today" ? "telemetry-window-btn active" : "telemetry-window-btn"}
          onClick={() => setWindowMode("today")}
        >
          今日
        </button>
        <button
          type="button"
          className={windowMode === "seven_days" ? "telemetry-window-btn active" : "telemetry-window-btn"}
          onClick={() => setWindowMode("seven_days")}
        >
          7 日
        </button>
      </div>

      <div className="state-chip-row telemetry-chip-row">
        <span>入口点击 {entryCount}</span>
        <span>进入互动 {interactionCount}</span>
        <span>候补提交 {waitlistCount}</span>
      </div>

      <div className="telemetry-funnel" data-testid="telemetry-funnel">
        <div className="telemetry-funnel-row">
          <b>入口 → 互动</b>
          <span>{funnelRate(interactionCount, entryCount)}</span>
        </div>
        <div className="funnel-bar-track">
          <i style={{ width: `${Math.min(100, Math.max(0, entryCount ? (interactionCount / entryCount) * 100 : 0))}%` }} />
        </div>
        <div className="telemetry-funnel-row">
          <b>互动 → 候补</b>
          <span>{funnelRate(waitlistCount, interactionCount)}</span>
        </div>
        <div className="funnel-bar-track">
          <i style={{ width: `${Math.min(100, Math.max(0, interactionCount ? (waitlistCount / interactionCount) * 100 : 0))}%` }} />
        </div>
      </div>

      <ul className="event-list telemetry-event-list">
        {topItems.length ? (
          topItems.map((item) => (
            <li key={item.id}>
              <span>{item.eventName}</span>
              <small>
                {new Date(item.at).toLocaleString()} · {item.source} · {item.status}
              </small>
            </li>
          ))
        ) : (
          <li>
            <span>当前时间窗暂无埋点数据</span>
            <small>从首页入口进入 Demo 并完成候补提交后会出现数据</small>
          </li>
        )}
      </ul>
    </article>
  );
}
