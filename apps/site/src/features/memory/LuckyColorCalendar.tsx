import type { ColorCalendarItem, InteractionSummaryItem, SharedMomentItem } from "../../state/types";

type LuckyColorCalendarProps = {
  items: ColorCalendarItem[];
  activeDayKey: string | null;
  onSelectDay: (dayKey: string) => void;
  interactionSummaries: InteractionSummaryItem[];
  sharedMoments: SharedMomentItem[];
};

export function LuckyColorCalendar({
  items,
  activeDayKey,
  onSelectDay,
  interactionSummaries,
  sharedMoments
}: LuckyColorCalendarProps) {
  return (
    <article className="card">
      <h2>幸运色日历</h2>
      <div className="calendar-grid">
        {items.slice(0, 28).map((item) => {
          const summary = interactionSummaries.find((entry) => entry.dayKey === item.dayKey);
          const hasLoopMoment = sharedMoments.some(
            (entry) => entry.dayKey === item.dayKey && entry.category === "loop"
          );
          return (
            <button
              key={item.dayKey}
              type="button"
              className={`calendar-cell${activeDayKey === item.dayKey ? " active" : ""}`}
              onClick={() => onSelectDay(item.dayKey)}
            >
              <span style={{ backgroundColor: item.colorHex }} />
              <b>{item.dayKey.slice(5)}</b>
              <small>{item.colorName}</small>
              <div className="calendar-cell-meta">
                <i>{summary ? `互 ${summary.interactionCount}` : "互 0"}</i>
                {hasLoopMoment ? <em>闭环</em> : null}
              </div>
            </button>
          );
        })}
      </div>
    </article>
  );
}
