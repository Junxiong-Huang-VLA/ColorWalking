import { getTaskRewardTitle } from "../../domain/growth/taskRewardCopy";
import type { GrowthState } from "../../state/types";

type GrowthLinesBoardProps = {
  growthState: GrowthState;
};

function linePercent(xp: number): number {
  return Math.max(0, Math.min(100, xp % 100));
}

export function GrowthLinesBoard({ growthState }: GrowthLinesBoardProps) {
  const lines = [
    { key: "colorSense", label: "色彩感知线", state: growthState.colorSense },
    { key: "expression", label: "表达线", state: growthState.expression },
    { key: "companion", label: "陪伴线", state: growthState.companion },
    { key: "islandStory", label: "岛屿故事线", state: growthState.islandStory }
  ] as const;

  return (
    <article className="card">
      <h2>成长线</h2>
      <div className="line-board">
        {lines.map((line) => (
          <div key={line.key} className="line-item">
            <div className="line-head">
              <b>{line.label}</b>
              <small>Lv.{line.state.level}</small>
            </div>
            <div className="meter-row">
              <span>XP</span>
              <div><i style={{ width: `${linePercent(line.state.xp)}%` }} /></div>
              <b>{linePercent(line.state.xp)}%</b>
            </div>
            <p className="muted">解锁：{line.state.unlocked.length ? line.state.unlocked.join("、") : "尚未解锁"}</p>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        今日任务完成：{growthState.completedTaskIds.length} 项
      </p>
      {growthState.taskRewards[0] ? (
        <p className="muted">
          最近奖励：{getTaskRewardTitle(growthState.taskRewards[0].taskId)}（+{growthState.taskRewards[0].bondPoints} 亲密）
        </p>
      ) : null}
    </article>
  );
}
