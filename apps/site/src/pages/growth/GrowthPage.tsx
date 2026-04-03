import { BondOverview } from "../../features/growth/BondOverview";
import { DailyTaskChecklistCard } from "../../features/growth/DailyTaskChecklistCard";
import { EmotionTrendPanel } from "../../features/growth/EmotionTrendPanel";
import { GrowthLinesBoard } from "../../features/growth/GrowthLinesBoard";
import { GrowthNodeDrawer } from "../../features/growth/GrowthNodeDrawer";
import { LuckyColorHistoryPanel } from "../../features/growth/LuckyColorHistoryPanel";
import { TaskRewardModalCard } from "../../features/growth/TaskRewardModalCard";
import { SheepAvatarStage } from "../../features/sheep/SheepAvatarStage";
import { sceneLabel } from "../../content/glossary";
import type {
  BondState,
  DailyColorState,
  GrowthState,
  InteractionScene,
  SheepEmotionState,
  SheepVisualState,
  UIState
} from "../../state/types";

type GrowthPageProps = {
  bondState: BondState;
  growthState: GrowthState;
  sheepEmotionState: SheepEmotionState;
  sheepVisualState: SheepVisualState;
  dailyColorState: DailyColorState;
  activeScene: InteractionScene;
  activeModal: UIState["activeModal"];
  onCloseTaskReward: () => void;
  onGoInteraction: () => void;
  onGoMemory: () => void;
  onGoValidation: () => void;
  focusMode?: boolean;
  showValidationEntry?: boolean;
};

function stageText(level: number): string {
  if (level >= 6) return "深度陪伴";
  if (level >= 4) return "默契升温";
  if (level >= 2) return "熟悉建立";
  return "第一次靠近";
}

export function GrowthPage({
  bondState,
  growthState,
  sheepEmotionState,
  sheepVisualState,
  dailyColorState,
  activeScene,
  activeModal,
  onCloseTaskReward,
  onGoInteraction,
  onGoMemory,
  onGoValidation,
  focusMode = false,
  showValidationEntry = true
}: GrowthPageProps) {
  const reward = growthState.taskRewards[0] ?? null;
  const showTaskRewardModal = activeModal === "task_reward" && reward !== null;

  return (
    <section className="page-grid growth-page-grid" data-testid="growth-page">
      <article className="card growth-hero-card">
        <h2>关系成长</h2>
        <p className="muted">这里看到的不只是数据变化，而是你和小羊卷关系真的在推进。</p>
        <div className="state-chip-row">
          <span>当前阶段：{stageText(bondState.level)}</span>
          <span>关系 Lv.{bondState.level}</span>
          <span>今日互动 {bondState.todayInteractCount}</span>
          <span>连续陪伴 {bondState.streakDays} 天</span>
          <span>当前场景：{sceneLabel(activeScene)}</span>
          <span>今日幸运色：{dailyColorState.colorName}</span>
        </div>
        <div className="quick-actions home-quick-actions">
          <button type="button" className="ghost-btn" onClick={onGoInteraction} data-testid="growth-go-interaction">
            继续互动
          </button>
          <button type="button" className="ghost-btn" onClick={onGoMemory} data-testid="growth-go-memory">
            去看共同记忆
          </button>
          {showValidationEntry ? (
            <button type="button" className="primary-btn" onClick={onGoValidation} data-testid="growth-go-validation">
              提交候补意向
            </button>
          ) : null}
        </div>

        <SheepAvatarStage
          scarfColorHex={sheepVisualState.scarfColorHex}
          eyeColorHex={sheepVisualState.eyeColorHex}
          expression={sheepVisualState.expression}
          motion={sheepVisualState.motionTemplate}
          statusText={sheepVisualState.statusText}
          emotionLevel={sheepEmotionState.emotionLevel}
          emotion={sheepEmotionState.emotion}
          scene={activeScene}
          minimal={focusMode}
        />
      </article>

      {showTaskRewardModal ? <TaskRewardModalCard reward={reward} onClose={onCloseTaskReward} /> : null}
      <BondOverview bondState={bondState} />
      <DailyTaskChecklistCard growthState={growthState} />
      <GrowthLinesBoard growthState={growthState} />
      {focusMode ? null : <GrowthNodeDrawer bondState={bondState} growthState={growthState} />}
      {focusMode ? null : <EmotionTrendPanel sheepEmotionState={sheepEmotionState} />}
      <LuckyColorHistoryPanel history={dailyColorState.history} />
    </section>
  );
}
