import type { DailyColorHistoryItem } from "../../state/types";

type LuckyColorHistoryPanelProps = {
  history: DailyColorHistoryItem[];
};

const CATEGORY_LABEL: Record<string, string> = {
  warm_cloud: "暖云",
  cloud_cool: "云雾",
  moonlight: "月夜",
  green_soft: "柔绿",
  sun_warm: "暖阳",
  breeze: "轻风",
  blush: "微粉",
  amber: "琥珀",
  mist: "雾感",
  hush: "静夜",
  dusk: "暮色",
  island: "岛屿",
  rain: "雨幕"
};

function topCategory(history: DailyColorHistoryItem[]): string {
  if (!history.length) return "暂无";
  const counter = new Map<string, number>();
  for (const item of history) {
    counter.set(item.category, (counter.get(item.category) ?? 0) + 1);
  }
  const sorted = [...counter.entries()].sort((a, b) => b[1] - a[1]);
  const key = sorted[0]?.[0];
  if (!key) return "暂无";
  return CATEGORY_LABEL[key] ?? key;
}

export function LuckyColorHistoryPanel({ history }: LuckyColorHistoryPanelProps) {
  const recent = history.slice(0, 21);
  const totalDays = history.length;
  const latestDay = recent[0]?.dayKey ?? "--";

  return (
    <article className="card color-history-card">
      <h2>幸运色历史</h2>
      <div className="state-chip-row">
        <span>累计 {totalDays} 天</span>
        <span>主类别：{topCategory(history)}</span>
        <span>最近记录：{latestDay}</span>
      </div>

      {recent.length ? (
        <div className="color-history-grid">
          {recent.map((item) => (
            <div key={`${item.dayKey}-${item.colorId}`} className="color-history-item">
              <span className="swatch" style={{ backgroundColor: item.hex }} />
              <b>{item.dayKey.slice(5)}</b>
              <small>{item.colorName}</small>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">先领取今天的幸运色，历史会在这里慢慢长出来。</p>
      )}
    </article>
  );
}
