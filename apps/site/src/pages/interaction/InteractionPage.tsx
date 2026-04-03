import { type DeviceInputEventType } from "@colorwalking/shared";
import { ChatPanel } from "../../features/interaction/ChatPanel";
import { InteractionEventPad } from "../../features/interaction/InteractionEventPad";
import { SceneModeSwitch } from "../../features/interaction/SceneModeSwitch";
import { SceneRewardHintCard } from "../../features/interaction/SceneRewardHintCard";
import { VoicePanel } from "../../features/interaction/VoicePanel";
import { SheepAvatarStage } from "../../features/sheep/SheepAvatarStage";
import { sceneProfileOf } from "../../domain/interactionScenes";
import { sceneLabel } from "../../content/glossary";
import type {
  ChatMessage,
  CompanionEventType,
  DeviceState,
  InteractionScene,
  SheepEmotion,
  SheepEmotionState,
  SheepVisualState
} from "../../state/types";

type InteractionPageProps = {
  sheepEmotionState: SheepEmotionState;
  sheepVisualState: SheepVisualState;
  dailyColorName: string;
  activeScene: InteractionScene;
  isVoiceRecording: boolean;
  messages: ChatMessage[];
  lastFeedback: {
    at: string;
    scene: InteractionScene;
    eventType: CompanionEventType;
    bondDelta: number;
    emotionBefore: SheepEmotion;
    emotionAfter: SheepEmotion;
    sceneGrowthBonus: {
      bondBonus: number;
      lineXpBonus: Partial<Record<"color_sense" | "expression" | "companion" | "island_story", number>>;
    };
    newTaskIds: string[];
    unlockedNodeIds: string[];
  } | null;
  deviceState: DeviceState;
  onSendText: (text: string) => void;
  onSendVoiceMock: () => void;
  onStartBedtime: () => void;
  onSceneChange: (scene: InteractionScene) => void;
  onTriggerEvent: (eventType: DeviceInputEventType) => void;
  onGoGrowth: () => void;
  onGoMemory: () => void;
  onGoValidation: () => void;
  focusMode?: boolean;
  showDiagnostics?: boolean;
  showValidationEntry?: boolean;
};

export function buildInteractionWarnings(deviceState: DeviceState): string[] {
  const warnings: string[] = [];
  if (deviceState.syncState === "error") {
    warnings.push("本次状态映射未完成，系统会自动重试。 ");
  }
  if (deviceState.pendingCommands.length > 0 && !deviceState.lastSuccessfulSync) {
    warnings.push("检测到待发送指令，正在后台排队同步。 ");
  }
  return warnings;
}

export function InteractionPage({
  sheepEmotionState,
  sheepVisualState,
  dailyColorName,
  activeScene,
  isVoiceRecording,
  messages,
  lastFeedback,
  deviceState,
  onSendText,
  onSendVoiceMock,
  onStartBedtime,
  onSceneChange,
  onTriggerEvent,
  onGoGrowth,
  onGoMemory,
  onGoValidation,
  focusMode = false,
  showDiagnostics = false,
  showValidationEntry = true
}: InteractionPageProps) {
  const sceneProfile = sceneProfileOf(activeScene);
  const warnings = buildInteractionWarnings(deviceState);

  return (
    <section className={`page-grid interaction-page scene-atmosphere ${sceneProfile.atmosphereClass}`} data-testid="interaction-page">
      <article className="card interaction-hero-card">
        <h2>和小羊卷相处</h2>
        <p className="muted">轻触、聊天、换场景都会马上影响它的回应语气与状态。</p>
        <div className="state-chip-row">
          <span>当前场景：{sceneLabel(activeScene)}</span>
          <span>今日幸运色：{dailyColorName}</span>
          <span>风格：{sceneProfile.style}</span>
          <span>节奏：{sceneProfile.pace}</span>
        </div>
        <div className="quick-actions home-quick-actions interaction-next-actions">
          <button type="button" className="ghost-btn" onClick={onGoGrowth} data-testid="interaction-go-growth">
            看关系成长
          </button>
          <button type="button" className="ghost-btn" onClick={onGoMemory} data-testid="interaction-go-memory">
            看共同记忆
          </button>
          {showValidationEntry ? (
            <button type="button" className="primary-btn" onClick={onGoValidation} data-testid="interaction-go-validation">
              提交候补意向
            </button>
          ) : null}
        </div>
      </article>

      <SheepAvatarStage
        scarfColorHex={sheepVisualState.scarfColorHex}
        eyeColorHex={sheepVisualState.eyeColorHex}
        expression={sheepVisualState.expression}
        motion={sheepVisualState.motionTemplate}
        statusText={sheepVisualState.statusText}
        emotionLevel={sheepEmotionState.emotionLevel}
        emotion={sheepEmotionState.emotion}
        scene={activeScene}
        size="hero"
        minimal={focusMode}
      />

      <SceneModeSwitch value={activeScene} onChange={onSceneChange} />
      <InteractionEventPad onTrigger={onTriggerEvent} />

      {focusMode ? null : (
        <VoicePanel isRecording={isVoiceRecording} onMockVoice={onSendVoiceMock} onStartBedtime={onStartBedtime} />
      )}

      <ChatPanel
        messages={messages}
        onSend={onSendText}
        scene={activeScene}
        sceneGuide={sceneProfile.guide}
        maxReplyLength={sceneProfile.maxReplyLength}
        compact={focusMode}
      />

      {!focusMode && showDiagnostics && warnings.length ? (
        <article className="card interaction-warning-card" data-testid="interaction-warning-card">
          <h3>轻提示</h3>
          <ul className="event-list">
            {warnings.map((text) => (
              <li key={text} data-testid="interaction-warning-item">
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {focusMode ? null : <SceneRewardHintCard activeScene={activeScene} lastFeedback={lastFeedback} />}

      {lastFeedback ? (
        <article className="card interaction-feedback-card" data-testid="interaction-feedback-card">
          <h3>刚刚发生了什么</h3>
          <div className="state-chip-row">
            <span>场景：{sceneLabel(lastFeedback.scene)}</span>
            <span>关系 +{lastFeedback.bondDelta}</span>
            <span>
              情绪：{lastFeedback.emotionBefore} → {lastFeedback.emotionAfter}
            </span>
            {lastFeedback.newTaskIds.length ? (
              <span data-testid="feedback-new-task">新任务 {lastFeedback.newTaskIds.length}</span>
            ) : null}
            {lastFeedback.unlockedNodeIds.length ? (
              <span data-testid="feedback-unlocked-node">新解锁 {lastFeedback.unlockedNodeIds.length}</span>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  );
}
