import type { GrowthTaskRewardItem } from "../../state/types";
import { getTaskRewardTitle } from "../../domain/growth/taskRewardCopy";

type TaskRewardModalCardProps = {
  reward: GrowthTaskRewardItem;
  onClose: () => void;
};

const LINE_LABEL: Record<string, string> = {
  color_sense: "色彩感知",
  expression: "表达",
  companion: "陪伴",
  island_story: "岛屿故事"
};

function lineXpText(reward: GrowthTaskRewardItem): string {
  const parts = Object.entries(reward.lineXp)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .map(([lineId, value]) => `${LINE_LABEL[lineId] ?? lineId} +${value}`);
  return parts.length ? parts.join(" · ") : "成长值 +0";
}

export function TaskRewardModalCard({ reward, onClose }: TaskRewardModalCardProps) {
  const taskTitle = getTaskRewardTitle(reward.taskId);
  return (
    <article className="card task-reward-modal-card">
      <h2>成长轻提示</h2>
      <p className="muted">小羊卷悄悄记下了今天的靠近。</p>
      <div className="state-chip-row" style={{ marginTop: 8 }}>
        <span>任务：{taskTitle}</span>
        <span>亲密 +{reward.bondPoints}</span>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>{lineXpText(reward)}</p>
      {reward.itemReward ? <p className="muted">解锁：{reward.itemReward}</p> : null}
      <button type="button" className="primary-btn" onClick={onClose}>
        收下提醒
      </button>
    </article>
  );
}
