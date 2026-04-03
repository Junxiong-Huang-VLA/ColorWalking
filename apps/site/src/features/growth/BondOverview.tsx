import type { BondState } from "../../state/types";

type BondOverviewProps = {
  bondState: BondState;
};

export function BondOverview({ bondState }: BondOverviewProps) {
  const progress = ((bondState.bondPoints % 100) / 100) * 100;

  return (
    <article className="card">
      <h2>关系状态</h2>
      <div className="growth-grid">
        <div>
          <small>关系等级</small>
          <b>Lv.{bondState.level}</b>
        </div>
        <div>
          <small>亲密度</small>
          <b>{bondState.bondPoints}</b>
        </div>
        <div>
          <small>连续陪伴</small>
          <b>{bondState.streakDays} 天</b>
        </div>
        <div>
          <small>今日互动</small>
          <b>{bondState.todayInteractCount} 次</b>
        </div>
      </div>
      <div className="meter-row" style={{ marginTop: 10 }}>
        <span>进度</span>
        <div><i style={{ width: `${progress}%` }} /></div>
        <b>{Math.round(progress)}%</b>
      </div>
    </article>
  );
}
