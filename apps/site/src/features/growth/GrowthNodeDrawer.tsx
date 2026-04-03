import { useMemo, useState } from "react";
import { getDailyTasksConfig, getGrowthTreeConfig } from "../../lib";
import type { BondState, GrowthState } from "../../state/types";

type GrowthNodeDrawerProps = {
  bondState: BondState;
  growthState: GrowthState;
};

const GROWTH_TREE = getGrowthTreeConfig();
const DAILY_TASKS = getDailyTasksConfig();
const TASK_TITLE = new Map(DAILY_TASKS.tasks.map((task) => [task.taskId, task.title]));

function lineXpOf(state: GrowthState, lineId: string): number {
  if (lineId === "color_sense") return state.colorSense.xp;
  if (lineId === "expression") return state.expression.xp;
  if (lineId === "companion") return state.companion.xp;
  return state.islandStory.xp;
}

function lineLabel(lineId: string): string {
  if (lineId === "color_sense") return "色彩感知线";
  if (lineId === "expression") return "表达线";
  if (lineId === "companion") return "陪伴线";
  return "岛屿故事线";
}

type SelectedNode = {
  lineId: string;
  lineName: string;
  node: (typeof GROWTH_TREE.growthLines)[number]["nodes"][number];
};

export function GrowthNodeDrawer({ bondState, growthState }: GrowthNodeDrawerProps) {
  const firstNode = GROWTH_TREE.growthLines[0]?.nodes[0];
  const [selectedNodeId, setSelectedNodeId] = useState<string>(firstNode?.nodeId ?? "");

  const selected = useMemo<SelectedNode | null>(() => {
    for (const line of GROWTH_TREE.growthLines) {
      const node = line.nodes.find((item) => item.nodeId === selectedNodeId);
      if (node) {
        return {
          lineId: line.lineId,
          lineName: line.lineName,
          node
        };
      }
    }
    return null;
  }, [selectedNodeId]);

  if (!selected) return null;

  const currentLineXp = lineXpOf(growthState, selected.lineId);
  const missingBondLevel = Math.max(0, selected.node.condition.requiredBondLevel - bondState.level);
  const missingLineXp = Math.max(0, selected.node.condition.requiredLineXp - currentLineXp);
  const requiredTaskIds = selected.node.condition.requiredTaskIds ?? [];
  const missingTaskIds = requiredTaskIds.filter((taskId) => !growthState.completedTaskIds.includes(taskId));
  const isUnlocked = growthState.unlockedNodeIds.includes(selected.node.nodeId);
  const meetsConditions = !missingBondLevel && !missingLineXp && !missingTaskIds.length;

  const suggestions: string[] = [];
  if (missingBondLevel > 0) {
    suggestions.push(`关系等级还差 ${missingBondLevel} 级，建议多做轻互动与每日抽色。`);
  }
  if (missingLineXp > 0) {
    suggestions.push(`${selected.lineName} 还差 ${missingLineXp} XP，建议优先完成对应日任务。`);
  }
  if (missingTaskIds.length) {
    suggestions.push(
      `还需完成任务：${missingTaskIds.map((taskId) => TASK_TITLE.get(taskId) ?? taskId).join("、")}。`
    );
  }
  if (isUnlocked) {
    suggestions.push("该节点已解锁，可以继续推进下一节点。");
  } else if (meetsConditions) {
    suggestions.push("条件已满足，触发一次互动即可刷新解锁状态。");
  }

  return (
    <article className="card growth-node-drawer-card">
      <h2>成长节点详情</h2>
      <p className="muted">查看每个节点还差多少，并给出下一步建议。</p>

      <div className="growth-node-grid">
        {GROWTH_TREE.growthLines.map((line) => (
          <section key={line.lineId} className="growth-node-line">
            <h3>{line.lineName}</h3>
            <small>{line.description}</small>
            <div className="growth-node-list">
              {line.nodes.map((node) => {
                const unlocked = growthState.unlockedNodeIds.includes(node.nodeId);
                const active = selectedNodeId === node.nodeId;
                return (
                  <button
                    key={node.nodeId}
                    type="button"
                    className={`growth-node-item${active ? " active" : ""}${unlocked ? " unlocked" : ""}`}
                    onClick={() => setSelectedNodeId(node.nodeId)}
                  >
                    <b>{node.title}</b>
                    <small>{unlocked ? "已解锁" : "未解锁"}</small>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="growth-node-detail">
        <h3>{selected.node.title}</h3>
        <p className="muted">{selected.node.description}</p>
        <div className="state-chip-row">
          <span>{lineLabel(selected.lineId)}</span>
          <span>关系要求 Lv.{selected.node.condition.requiredBondLevel}</span>
          <span>线 XP 要求 {selected.node.condition.requiredLineXp}</span>
          <span>{isUnlocked ? "状态：已解锁" : "状态：未解锁"}</span>
        </div>
        <ul className="event-list growth-gap-list">
          <li>
            <span>关系等级差值</span>
            <small>{missingBondLevel > 0 ? `还差 ${missingBondLevel}` : "已满足"}</small>
          </li>
          <li>
            <span>线 XP 差值</span>
            <small>{missingLineXp > 0 ? `还差 ${missingLineXp}` : "已满足"}</small>
          </li>
          <li>
            <span>任务条件</span>
            <small>
              {missingTaskIds.length
                ? `还差 ${missingTaskIds.map((taskId) => TASK_TITLE.get(taskId) ?? taskId).join("、")}`
                : "已满足"}
            </small>
          </li>
        </ul>
        <p className="muted">
          节点奖励：{selected.node.reward.unlock}
          {selected.node.reward.bonus?.bondPoints ? ` · 亲密 +${selected.node.reward.bonus.bondPoints}` : ""}
          {selected.node.reward.bonus?.lineXp ? ` · 线 XP +${selected.node.reward.bonus.lineXp}` : ""}
        </p>
        <ul className="event-list growth-suggestion-list">
          {suggestions.map((text) => (
            <li key={text}>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
