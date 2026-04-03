import type { TimelineItem } from "../../state/types";
import { formatClock } from "../../utils/time";

type TimelineProps = {
  items: TimelineItem[];
};

export function Timeline({ items }: TimelineProps) {
  return (
    <article className="card">
      <h2>关系时间轴</h2>
      {items.length ? (
        <ul className="event-list">
          {items.slice(0, 20).map((item) => (
            <li key={item.id}>
              <span>{item.event}</span>
              <small>{formatClock(item.at)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">今天还没有新的共同经历。</p>
      )}
    </article>
  );
}
