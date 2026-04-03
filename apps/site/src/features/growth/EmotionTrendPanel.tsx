import { emotionLabel } from "../sheep/stateLabels";
import type { SheepEmotionState } from "../../state/types";
import { formatClock } from "../../utils/time";

type EmotionTrendPanelProps = {
  sheepEmotionState: SheepEmotionState;
};

const SOURCE_LABEL: Record<SheepEmotionState["emotionSource"], string> = {
  daily_color_drawn: "幸运色",
  touch_head: "摸头",
  touch_body: "轻触",
  hug_pressure: "抱抱",
  proximity_near: "靠近",
  picked_up: "抱起",
  laid_down: "放下",
  bedtime_mode_started: "睡前",
  chat_started: "聊天",
  rollback: "回落"
};

function makePath(levels: number[], width: number, height: number): string {
  if (!levels.length) return "";
  if (levels.length === 1) {
    const y = height - (levels[0] / 100) * height;
    return `M0 ${y.toFixed(2)} L${width.toFixed(2)} ${y.toFixed(2)}`;
  }
  const step = width / (levels.length - 1);
  return levels
    .map((level, index) => {
      const x = index * step;
      const y = height - (Math.max(0, Math.min(100, level)) / 100) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function EmotionTrendPanel({ sheepEmotionState }: EmotionTrendPanelProps) {
  const trend = sheepEmotionState.trend.slice(-24);
  const levels = trend.map((item) => item.level);
  const chartPath = makePath(levels, 300, 70);
  const latestLogs = [...trend].reverse().slice(0, 6);

  return (
    <article className="card emotion-trend-card">
      <h2>情绪趋势</h2>
      <div className="state-chip-row">
        <span>当前：{emotionLabel(sheepEmotionState.emotion)}</span>
        <span>强度：{Math.round(sheepEmotionState.emotionLevel)}</span>
        <span>稳定：{Math.round(sheepEmotionState.emotionStability * 100)}%</span>
        <span>基础：{emotionLabel(sheepEmotionState.baseEmotion)}</span>
      </div>

      <div className="trend-sparkline">
        <svg viewBox="0 0 300 70" role="img" aria-label="emotion-trend">
          <path d={chartPath} />
        </svg>
      </div>

      <ul className="event-list trend-log-list">
        {latestLogs.map((point) => (
          <li key={`${point.at}-${point.source}-${point.level}`}>
            <span>
              {SOURCE_LABEL[point.source]} · {emotionLabel(point.emotion)}
            </span>
            <small>{formatClock(point.at)}</small>
          </li>
        ))}
      </ul>
    </article>
  );
}
