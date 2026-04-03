import { buildRelationshipNarrative, type DigitalLifeState, type LifeMood, type LifeScene } from "../digitalLifeState";

const MOOD_LABEL: Record<LifeMood, string> = {
  calm: "平静",
  soft: "柔和",
  happy: "开心",
  sleepy: "困困",
  shy: "害羞",
  sad: "低落"
};

const SCENE_LABEL: Record<LifeScene, string> = {
  chat: "聊天",
  comfort: "安慰",
  bedtime: "晚安",
  mood: "情绪",
  color: "幸运色"
};

const MEMORY_TONE: Record<LifeMood, string> = {
  calm: "稳稳的",
  soft: "很温柔",
  happy: "亮亮的",
  sleepy: "慢慢的",
  shy: "轻轻的",
  sad: "被接住的"
};

type Props = {
  life: DigitalLifeState;
  className?: string;
};

export function LifeContinuityStrip({ life, className = "" }: Props) {
  const latest = life.memoryState[0];
  const narrative = buildRelationshipNarrative(life);
  const mood = latest?.mood ?? life.sheepState.mood;
  const scene = latest?.scene ?? life.sheepState.scene;
  const tone = MEMORY_TONE[mood];

  return (
    <section className={`life-continuity-strip ${className}`.trim()} aria-label="小羊卷连续状态">
      <p className="life-continuity-main">
        <span className="life-continuity-dot" style={{ backgroundColor: life.sheepState.luckyColorHex }} />
        小羊卷现在是 <b>{MOOD_LABEL[mood]}</b>，在「{SCENE_LABEL[scene]}」场景里，关系来到「{life.growthState.bondTitle}」。
      </p>
      <p className="life-continuity-sub">
        今日幸运色：{life.sheepState.luckyColorName} {life.sheepState.luckyColorHex} · 记忆语气：{tone} · {narrative.nextLine}
      </p>
    </section>
  );
}
