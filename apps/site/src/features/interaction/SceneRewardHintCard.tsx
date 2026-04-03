import { COMPANION_EVENT_LABEL } from "../../domain/companionEvents";
import { sceneProfileOf } from "../../domain/interactionScenes";
import type { CompanionEventType, GrowthLineId, InteractionScene, SheepEmotion } from "../../state/types";

type SceneRewardHintCardProps = {
  activeScene: InteractionScene;
  lastFeedback: {
    at: string;
    scene: InteractionScene;
    eventType: CompanionEventType;
    bondDelta: number;
    emotionBefore: SheepEmotion;
    emotionAfter: SheepEmotion;
    sceneGrowthBonus: {
      bondBonus: number;
      lineXpBonus: Partial<Record<GrowthLineId, number>>;
    };
    newTaskIds: string[];
    unlockedNodeIds: string[];
  } | null;
};

const LINE_LABEL: Record<GrowthLineId, string> = {
  color_sense: "色彩感知",
  expression: "表达",
  companion: "陪伴",
  island_story: "岛屿故事"
};

function sceneLabel(scene: InteractionScene): string {
  if (scene === "chat") return "聊天";
  if (scene === "comfort") return "安抚";
  if (scene === "bedtime") return "睡前";
  if (scene === "mood") return "心情";
  return "颜色";
}

function lineBonusText(lineXpBonus: Partial<Record<GrowthLineId, number>>): string[] {
  return (Object.keys(LINE_LABEL) as GrowthLineId[])
    .map((lineId) => ({ lineId, xp: lineXpBonus[lineId] ?? 0 }))
    .filter((item) => item.xp > 0)
    .map((item) => `${LINE_LABEL[item.lineId]} +${item.xp}`);
}

export function SceneRewardHintCard({ activeScene, lastFeedback }: SceneRewardHintCardProps) {
  const profile = sceneProfileOf(activeScene);
  const sceneBonusTexts = lineBonusText(profile.growthWeight.lineXpBonus);
  const lastSceneBonusTexts = lastFeedback ? lineBonusText(lastFeedback.sceneGrowthBonus?.lineXpBonus ?? {}) : [];

  return (
    <article className="card scene-reward-card" data-testid="scene-reward-card">
      <h3>场景奖励权重</h3>
      <p className="muted">当前是 {sceneLabel(activeScene)} 场景，互动会按这个权重发放成长值。</p>
      <p className="muted" style={{ marginTop: 6 }}>
        {profile.rewardFocus}
      </p>
      <div className="state-chip-row">
        <span>亲密额外 +{profile.growthWeight.bondBonus}</span>
        {sceneBonusTexts.length ? sceneBonusTexts.map((text) => <span key={text}>{text}</span>) : <span>无额外线加成</span>}
      </div>

      {lastFeedback ? (
        <div className="scene-reward-last" data-testid="scene-reward-last-feedback">
          <small>
            本次触发：{COMPANION_EVENT_LABEL[lastFeedback.eventType] ?? "互动"} · {sceneLabel(lastFeedback.scene)} 场景
          </small>
          <div className="state-chip-row">
            <span>本次亲密变化 +{lastFeedback.bondDelta}</span>
            {lastSceneBonusTexts.length
              ? lastSceneBonusTexts.map((text) => <span key={`last-${text}`}>场景加权 {text}</span>)
              : <span>本次无场景线加成</span>}
          </div>
        </div>
      ) : null}
    </article>
  );
}
