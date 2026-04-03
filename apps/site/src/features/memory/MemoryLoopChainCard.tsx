import type { ColorCalendarItem, TimelineItem } from "../../state/types";
import { dayKeyOf, formatClock } from "../../utils/time";

type MemoryLoopChainCardProps = {
  selectedDayKey: string | null;
  timeline: TimelineItem[];
  colorCalendar: ColorCalendarItem[];
  interactionSummaries: Array<{
    dayKey: string;
    summary: string;
    interactionCount: number;
    bedtimeCount: number;
    lastScene: "chat" | "comfort" | "bedtime" | "mood" | "color";
    updatedAt: string;
  }>;
  onGoDevice: () => void;
};

function itemsOfDay(timeline: TimelineItem[], dayKey: string): TimelineItem[] {
  return timeline
    .filter((item) => dayKeyOf(item.at) === dayKey)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

function findLastAt(items: TimelineItem[], predicate: (item: TimelineItem) => boolean): string | null {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index])) return items[index].at;
  }
  return null;
}

type LoopAlertLevel = "warn" | "tip";

type LoopAlertItem = {
  level: LoopAlertLevel;
  text: string;
  action?: "go_device";
};

export function MemoryLoopChainCard({
  selectedDayKey,
  timeline,
  colorCalendar,
  interactionSummaries,
  onGoDevice
}: MemoryLoopChainCardProps) {
  if (!selectedDayKey) {
    return (
      <article className="card memory-loop-card">
        <h2>当日闭环链路</h2>
        <p className="muted">从日历选一天，查看抽色到同步的完整链路。</p>
      </article>
    );
  }

  const dayItems = itemsOfDay(timeline, selectedDayKey);
  const drawAt = findLastAt(dayItems, (item) => item.event.includes("抽到今日幸运色"));
  const interactionCount = dayItems.filter((item) => item.event.includes("互动：")).length;
  const interactionAt = findLastAt(dayItems, (item) => item.event.includes("互动："));
  const taskCount = dayItems.filter((item) => item.event.includes("完成任务：")).length;
  const taskAt = findLastAt(dayItems, (item) => item.event.includes("完成任务："));
  const syncAt = findLastAt(dayItems, (item) => item.event.includes("设备同步成功"));

  const color = colorCalendar.find((item) => item.dayKey === selectedDayKey) ?? null;
  const summary = interactionSummaries.find((item) => item.dayKey === selectedDayKey) ?? null;
  const resolvedInteractionCount = summary?.interactionCount ?? interactionCount;
  const hasInteractionSignal = Boolean(interactionAt) || resolvedInteractionCount > 0;

  const alerts: LoopAlertItem[] = [];
  if (!drawAt) {
    alerts.push({ level: "warn", text: "起点缺失：当天还没抽取幸运色。" });
  }
  if (drawAt && !interactionAt) {
    alerts.push({ level: "tip", text: "已抽色但还没互动，可以去互动页轻轻聊一句。" });
  }
  if (hasInteractionSignal && taskCount === 0) {
    alerts.push({ level: "tip", text: "已有互动但未触发任务奖励，可尝试摸头/抱抱/睡前模式。" });
  }
  if (hasInteractionSignal && !syncAt) {
    alerts.push({
      level: "warn",
      text: "互动后尚未完成设备同步，设备页可重试同步。",
      action: "go_device"
    });
  }
  if (syncAt && !interactionAt) {
    alerts.push({ level: "tip", text: "已同步设备但互动较少，建议补一次陪伴互动形成完整闭环。" });
  }

  return (
    <article className="card memory-loop-card" data-testid="memory-loop-card">
      <h2>当日闭环链路</h2>
      <p className="muted">首页抽色 → 互动 → 任务 → 同步，确认小羊卷的一天是否完整闭环。</p>
      {alerts.length ? (
        <ul className="loop-alert-list" data-testid="memory-loop-alert-list">
          {alerts.map((item) => (
            <li key={item.text} className={`loop-alert-${item.level}`}>
              <span>{item.level === "warn" ? "异常提示" : "轻提示"}</span>
              <p>{item.text}</p>
              {item.action === "go_device" ? (
                <button type="button" onClick={onGoDevice} data-testid="memory-loop-go-device">
                  去设备页看看
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="loop-alert-ok">链路状态完整，今天的陪伴闭环已经跑通。</p>
      )}
      <div className="loop-chain">
        <div className={`loop-step${drawAt ? " done" : ""}`}>
          <b>1. 首页抽色</b>
          <small>{drawAt ? formatClock(drawAt) : "未发生"}</small>
          <p>{color ? `${color.colorName} ${color.colorHex}` : "当日无幸运色记录"}</p>
        </div>
        <div className={`loop-step${interactionAt ? " done" : ""}`}>
          <b>2. 场景互动</b>
          <small>{interactionAt ? formatClock(interactionAt) : "未发生"}</small>
          <p>互动 {resolvedInteractionCount} 次</p>
        </div>
        <div className={`loop-step${taskAt ? " done" : ""}`}>
          <b>3. 任务成长</b>
          <small>{taskAt ? formatClock(taskAt) : "未发生"}</small>
          <p>任务完成 {taskCount} 项</p>
        </div>
        <div className={`loop-step${syncAt ? " done" : ""}`}>
          <b>4. 设备同步</b>
          <small>{syncAt ? formatClock(syncAt) : "未发生"}</small>
          <p>{syncAt ? "围巾/眼睛状态已送达设备" : "仍待同步到设备"}</p>
        </div>
      </div>
    </article>
  );
}
