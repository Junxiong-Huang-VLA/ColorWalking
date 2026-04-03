import type { MemoryCardItem, MemoryItem, SharedMomentItem } from "../../state/types";
import { formatClock } from "../../utils/time";

type MemoryCardsProps = {
  rememberedItems: MemoryItem[];
  cards: MemoryCardItem[];
  sharedMoments: SharedMomentItem[];
};

export function MemoryCards({ rememberedItems, cards, sharedMoments }: MemoryCardsProps) {
  const milestoneCards = cards.filter((card) => card.category === "milestone");
  const dailyCards = cards.filter((card) => card.category !== "milestone");
  return (
    <article className="card">
      <h2>关系回忆卡片</h2>

      <h3>小羊卷记住了你的偏好</h3>
      {rememberedItems.length ? (
        <ul className="memory-list">
          {rememberedItems.slice(0, 8).map((item) => (
            <li key={item.id}>
              <div>
                <b>{item.type === "preference" ? "偏好" : "片段"}</b>
                <p>{item.text}</p>
              </div>
              <small>{formatClock(item.at)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">还没有新的记忆。</p>
      )}

      <h3>日常关系片段</h3>
      {dailyCards.length ? (
        <ul className="memory-list">
          {dailyCards.slice(0, 8).map((card) => (
            <li key={card.id}>
              <div>
                <b>{card.title}</b>
                <p>{card.desc}</p>
              </div>
              <small>{card.mood}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">先从今天的一次陪伴开始。</p>
      )}

      <h3>纪念卡片</h3>
      {milestoneCards.length ? (
        <ul className="memory-list">
          {milestoneCards.slice(0, 6).map((card) => (
            <li key={`milestone-${card.id}`}>
              <div>
                <b>{card.title}</b>
                <p>{card.desc}</p>
              </div>
              <small>{formatClock(card.at)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">继续陪伴，会慢慢出现纪念节点。</p>
      )}

      <h3>你们一起走过的时刻</h3>
      {sharedMoments.length ? (
        <ul className="memory-list">
          {sharedMoments.slice(0, 6).map((moment) => (
            <li key={moment.id}>
              <div>
                <b>{moment.title}</b>
                <p>{moment.desc}</p>
              </div>
              <small>{moment.dayKey}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">继续互动，会慢慢积累共同经历。</p>
      )}
    </article>
  );
}
