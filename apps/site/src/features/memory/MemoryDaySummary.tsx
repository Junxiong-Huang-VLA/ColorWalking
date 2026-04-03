import type { CSSProperties } from "react";
import type {
  ColorCalendarItem,
  InteractionScene,
  InteractionSummaryItem,
  MemoryCardItem,
  SharedMomentItem,
  TimelineItem
} from "../../state/types";
import { sceneProfileOf } from "../../domain/interactionScenes";
import { dayKeyOf, formatClock } from "../../utils/time";

type MemoryDaySummaryProps = {
  selectedDayKey: string | null;
  selectedScene?: InteractionScene;
  colorCalendar: ColorCalendarItem[];
  timeline: TimelineItem[];
  interactionSummaries: InteractionSummaryItem[];
  bedtimeMemories: MemoryCardItem[];
  sharedMoments: SharedMomentItem[];
  memoryCards: MemoryCardItem[];
};

function byDay(items: TimelineItem[], dayKey: string): TimelineItem[] {
  return items.filter((item) => dayKeyOf(item.at) === dayKey);
}

function sceneLabel(scene: InteractionScene): string {
  if (scene === "chat") return "聊天";
  if (scene === "comfort") return "安抚";
  if (scene === "bedtime") return "睡前";
  if (scene === "mood") return "心情";
  return "颜色";
}

function momentCategoryLabel(item: SharedMomentItem): string {
  if (item.category === "milestone") return "纪念节点";
  if (item.category === "loop") return "链路闭环";
  if (item.category === "streak") return "连续陪伴";
  if (item.category === "first_time") return "第一次";
  return "共同时刻";
}

export function MemoryDaySummary({
  selectedDayKey,
  selectedScene,
  colorCalendar,
  timeline,
  interactionSummaries,
  bedtimeMemories,
  sharedMoments,
  memoryCards
}: MemoryDaySummaryProps) {
  if (!selectedDayKey) {
    return (
      <article className="card" data-testid="memory-day-summary-empty">
        <h2>当日回看</h2>
        <p className="muted">先从幸运色日历里选一天。</p>
      </article>
    );
  }

  const color = colorCalendar.find((item) => item.dayKey === selectedDayKey) ?? null;
  const dayTimeline = byDay(timeline, selectedDayKey).slice(0, 12);
  const summary = interactionSummaries.find((item) => item.dayKey === selectedDayKey) ?? null;
  const dayBedtimeMemories = bedtimeMemories.filter((item) => dayKeyOf(item.at) === selectedDayKey);
  const daySharedMoments = sharedMoments.filter((item) => item.dayKey === selectedDayKey);
  const longTermMoments = sharedMoments.slice(0, 5);
  const milestoneCards = memoryCards.filter((item) => item.category === "milestone").slice(0, 4);
  const interactionCount = summary?.interactionCount ?? dayTimeline.filter((item) => item.event.includes("互动")).length;
  const bedtimeCount = summary?.bedtimeCount ?? dayBedtimeMemories.length;
  const taskCount = dayTimeline.filter((item) => item.event.includes("任务")).length;
  const dayScene =
    selectedScene ?? summary?.lastScene ?? daySharedMoments.find((item) => Boolean(item.scene))?.scene ?? "chat";
  const sceneProfile = sceneProfileOf(dayScene);
  const dayStory =
    summary?.summary ??
    dayTimeline[0]?.event ??
    "今天先从一份幸运色开始，关系继续往前走了一点。";
  const sharedStory = daySharedMoments[0]?.title ?? daySharedMoments[0]?.desc ?? "你们今天有了新的共同经历。";
  const milestoneStory = milestoneCards[0]?.title ?? "继续互动会沉淀更多纪念节点。";

  return (
    <article
      className={`card memory-day-summary scene-atmosphere ${sceneProfile.atmosphereClass}`}
      style={{ "--scene-color": color?.colorHex ?? "#9eb8df" } as CSSProperties}
      data-testid="memory-day-summary"
    >
      <h2>当日回看</h2>
      <p className="muted" data-testid="memory-day-scene">
        场景氛围：{sceneLabel(dayScene)} · {sceneProfile.style}
      </p>
      <div className="state-chip-row" style={{ marginBottom: 10 }}>
        <span>{selectedDayKey}</span>
        <span>互动 {interactionCount}</span>
        <span>睡前 {bedtimeCount}</span>
        <span>任务完成 {taskCount}</span>
        <span>共同时刻 {daySharedMoments.length}</span>
        {color ? <span>幸运色 {color.colorName}</span> : null}
      </div>
      <div className="memory-day-relationship-flow" data-testid="memory-day-relationship-flow">
        <div>
          <small className="muted">今天发生了什么</small>
          <p>{dayStory}</p>
        </div>
        <div>
          <small className="muted">你们一起经历了什么</small>
          <p>{sharedStory}</p>
        </div>
        <div>
          <small className="muted">纪念节点</small>
          <p>{milestoneStory}</p>
        </div>
      </div>
      {color ? (
        <div className="memory-day-color">
          <span style={{ backgroundColor: color.colorHex }} />
          <b>{color.colorName}</b>
          <small>{color.colorHex}</small>
        </div>
      ) : null}
      {dayBedtimeMemories.length ? (
        <p className="muted" style={{ marginTop: 10 }}>
          睡前记忆：{dayBedtimeMemories[0]?.desc}
        </p>
      ) : null}
      {daySharedMoments.length ? (
        <div style={{ marginTop: 10 }}>
          <small className="muted">当日关系记忆</small>
          <ul className="event-list">
            {daySharedMoments.slice(0, 4).map((item) => (
              <li key={item.id} data-testid="memory-day-shared-moment">
                <span>
                  {item.title}
                  <i className="memory-moment-tag">{momentCategoryLabel(item)}</i>
                </span>
                <small>{formatClock(item.at)}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {dayTimeline.length ? (
        <ul className="event-list">
          {dayTimeline.map((item) => (
            <li key={item.id}>
              <span>{item.event}</span>
              <small>{formatClock(item.at)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">这一天还没有可回看的记录。</p>
      )}
      {milestoneCards.length ? (
        <div style={{ marginTop: 10 }} data-testid="memory-milestone-list">
          <small className="muted">纪念节点</small>
          <ul className="memory-list">
            {milestoneCards.map((card) => (
              <li key={card.id}>
                <div>
                  <b>{card.title}</b>
                  <p>{card.desc}</p>
                </div>
                <small>{dayKeyOf(card.at)}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {longTermMoments.length ? (
        <div style={{ marginTop: 10 }}>
          <small className="muted">长期关系记忆</small>
          <ul className="event-list">
            {longTermMoments.map((item) => (
              <li key={`long-${item.id}`}>
                <span>{item.title}</span>
                <small>{item.dayKey}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
