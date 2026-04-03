import { COMPANION_EVENT_LABEL } from "../../domain/companionEvents";
import { getDailyTasksConfig } from "../../lib";
import type { GrowthState } from "../../state/types";

type DailyTaskChecklistCardProps = {
  growthState: GrowthState;
};

const DAILY_TASKS = getDailyTasksConfig();

const LINE_LABEL: Record<string, string> = {
  color_sense: "色彩感知",
  expression: "表达",
  companion: "陪伴",
  island_story: "岛屿故事"
};

function rewardText(task: (typeof DAILY_TASKS.tasks)[number]): string {
  const segments: string[] = [`亲密 +${task.reward.bondPoints}`];
  for (const [lineId, xp] of Object.entries(task.reward.lineXp)) {
    if (typeof xp === "number" && xp > 0) {
      segments.push(`${LINE_LABEL[lineId] ?? lineId} +${xp}`);
    }
  }
  if (task.reward.itemReward) {
    segments.push(`解锁 ${task.reward.itemReward}`);
  }
  return segments.join(" · ");
}

export function DailyTaskChecklistCard({ growthState }: DailyTaskChecklistCardProps) {
  return (
    <article className="card task-checklist-card">
      <h2>今日任务清单</h2>
      <p className="muted">实时勾选会随互动更新，奖励来源直接可见。</p>
      <ul className="task-checklist">
        {DAILY_TASKS.tasks.map((task) => {
          const currentCount = growthState.eventCounter[task.condition.eventType] ?? 0;
          const done = growthState.completedTaskIds.includes(task.taskId);
          const progress = Math.min(currentCount, task.condition.minCount);
          return (
            <li key={task.taskId} className={`task-row${done ? " done" : ""}`}>
              <div className="task-main">
                <label>
                  <input type="checkbox" checked={done} readOnly />
                  <b>{task.title}</b>
                </label>
                <small>
                  进度 {progress}/{task.condition.minCount} · 来源：{COMPANION_EVENT_LABEL[task.condition.eventType]} 事件
                </small>
                <p>{task.description}</p>
                <p className="task-reward-line">{rewardText(task)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
