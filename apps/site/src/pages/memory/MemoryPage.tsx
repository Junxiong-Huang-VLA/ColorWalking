import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { sceneProfileOf } from "../../domain/interactionScenes";
import { sceneLabel } from "../../content/glossary";
import { LuckyColorCalendar } from "../../features/memory/LuckyColorCalendar";
import { MemoryCards } from "../../features/memory/MemoryCards";
import { MemoryDaySummary } from "../../features/memory/MemoryDaySummary";
import { MemoryLoopChainCard } from "../../features/memory/MemoryLoopChainCard";
import { Timeline } from "../../features/memory/Timeline";
import { ExperienceFeedbackCard } from "../../features/memory/ExperienceFeedbackCard";
import { buildSurveyQueueSummary } from "../../features/memory/surveyQueueView";
import { SheepAvatarStage } from "../../features/sheep/SheepAvatarStage";
import type { InteractionScene, MemoryState, SheepEmotionState, SheepVisualState, UserProfileState } from "../../state/types";

type MemoryPageProps = {
  memoryState: MemoryState;
  userProfile: UserProfileState;
  activeScene: InteractionScene;
  sheepEmotionState: SheepEmotionState;
  sheepVisualState: SheepVisualState;
  dailyColorName: string;
  onGoDevice: () => void;
  onGoInteraction: () => void;
  onGoValidation: () => void;
  onSubmitExperienceFeedback: (patch: Partial<UserProfileState["experienceFeedback"]>) => void;
  onRetrySurveyUpload: (submissionId?: string) => void;
  focusMode?: boolean;
  showBridgeActions?: boolean;
};

export function MemoryPage({
  memoryState,
  userProfile,
  activeScene,
  sheepEmotionState,
  sheepVisualState,
  dailyColorName,
  onGoDevice,
  onGoInteraction,
  onGoValidation,
  onSubmitExperienceFeedback,
  onRetrySurveyUpload,
  focusMode = false,
  showBridgeActions = false
}: MemoryPageProps) {
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(memoryState.colorCalendar[0]?.dayKey ?? null);
  const showFeedbackCard = !focusMode && (memoryState.sharedMoments.length > 0 || memoryState.interactionSummaries.length >= 2);
  const selectedSummary = useMemo(
    () => memoryState.interactionSummaries.find((item) => item.dayKey === selectedDayKey) ?? null,
    [memoryState.interactionSummaries, selectedDayKey]
  );
  const selectedDayColor = useMemo(
    () => memoryState.colorCalendar.find((item) => item.dayKey === selectedDayKey) ?? null,
    [memoryState.colorCalendar, selectedDayKey]
  );
  const selectedDayScene = selectedSummary?.lastScene ?? activeScene;
  const sceneProfile = sceneProfileOf(selectedDayScene);
  const sceneStyle = {
    "--scene-color": selectedDayColor?.colorHex ?? "#9eb8df"
  } as CSSProperties;
  const latestSubmission = userProfile.surveySubmissions[0] ?? null;
  const queueSummary = useMemo(() => buildSurveyQueueSummary(userProfile.surveySubmissions), [userProfile.surveySubmissions]);
  const lastSurveyAt = latestSubmission?.createdAt ?? null;

  useEffect(() => {
    if (!memoryState.colorCalendar.length) {
      setSelectedDayKey(null);
      return;
    }
    setSelectedDayKey((current) => {
      if (current && memoryState.colorCalendar.some((item) => item.dayKey === current)) return current;
      return memoryState.colorCalendar[0]?.dayKey ?? null;
    });
  }, [memoryState.colorCalendar]);

  return (
    <section className={`page-grid memory-page-grid scene-atmosphere ${sceneProfile.atmosphereClass}`} style={sceneStyle}>
      <article className="card memory-hero-card">
        <h2>记忆沉淀</h2>
        <p className="muted">这里能回看你们一起经历过什么，关系不会在一次会话后清零。</p>
        <div className="state-chip-row">
          <span>今日幸运色：{dailyColorName}</span>
          <span>回看场景：{sceneLabel(selectedDayScene)}</span>
          <span>共同时刻：{memoryState.sharedMoments.length}</span>
          <span>纪念节点：{memoryState.memoryCards.filter((item) => item.category === "milestone").length}</span>
        </div>
        <div className="quick-actions home-quick-actions">
          <button type="button" className="ghost-btn" onClick={onGoInteraction} data-testid="memory-go-interaction">
            继续互动
          </button>
          {showBridgeActions ? (
            <button type="button" className="ghost-btn" onClick={onGoDevice} data-testid="memory-go-device">
              查看映射状态
            </button>
          ) : null}
          <button type="button" className="primary-btn" onClick={onGoValidation} data-testid="memory-go-validation">
            提交候补意向
          </button>
        </div>

        <SheepAvatarStage
          scarfColorHex={sheepVisualState.scarfColorHex}
          eyeColorHex={sheepVisualState.eyeColorHex}
          expression={sheepVisualState.expression}
          motion={sheepVisualState.motionTemplate}
          statusText={sheepVisualState.statusText}
          emotionLevel={sheepEmotionState.emotionLevel}
          emotion={sheepEmotionState.emotion}
          scene={selectedDayScene}
          minimal={focusMode}
        />
      </article>

      <article className="card memory-layer-card">
        <h3>关系记忆层</h3>
        <div className="state-chip-row">
          <span>今天发生了什么：当日摘要</span>
          <span>一起经历了什么：时间线与共同时刻</span>
          <span>什么最重要：纪念节点</span>
        </div>
      </article>

      {focusMode ? null : <Timeline items={memoryState.timeline} />}

      <LuckyColorCalendar
        items={memoryState.colorCalendar}
        activeDayKey={selectedDayKey}
        onSelectDay={setSelectedDayKey}
        interactionSummaries={memoryState.interactionSummaries}
        sharedMoments={memoryState.sharedMoments}
      />

      <MemoryDaySummary
        selectedDayKey={selectedDayKey}
        colorCalendar={memoryState.colorCalendar}
        timeline={memoryState.timeline}
        interactionSummaries={memoryState.interactionSummaries}
        bedtimeMemories={memoryState.bedtimeMemories}
        sharedMoments={memoryState.sharedMoments}
        memoryCards={memoryState.memoryCards}
        selectedScene={selectedDayScene}
      />

      {focusMode || !showBridgeActions ? null : (
        <MemoryLoopChainCard
          selectedDayKey={selectedDayKey}
          timeline={memoryState.timeline}
          colorCalendar={memoryState.colorCalendar}
          interactionSummaries={memoryState.interactionSummaries}
          onGoDevice={onGoDevice}
        />
      )}

      <MemoryCards
        rememberedItems={memoryState.rememberedItems}
        cards={memoryState.memoryCards}
        sharedMoments={memoryState.sharedMoments}
      />

      {showFeedbackCard ? (
        <ExperienceFeedbackCard
          feedback={userProfile.experienceFeedback}
          submissionCount={userProfile.surveySubmissions.length}
          lastSubmittedAt={lastSurveyAt}
          latestSubmission={latestSubmission}
          queueSummary={queueSummary}
          activeScene={activeScene}
          dailyColorName={dailyColorName}
          onSubmit={onSubmitExperienceFeedback}
          onRetryUpload={onRetrySurveyUpload}
        />
      ) : null}
    </section>
  );
}
