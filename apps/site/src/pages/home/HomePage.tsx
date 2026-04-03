import { type DeviceInputEventType } from "@colorwalking/shared";
import type { CSSProperties } from "react";
import { sceneProfileOf } from "../../domain/interactionScenes";
import { sceneLabel } from "../../content/glossary";
import { SheepAvatarStage } from "../../features/sheep/SheepAvatarStage";
import { emotionLabel } from "../../features/sheep/stateLabels";
import type { PresentationMode } from "../../content/releaseCopy";
import type {
  BondState,
  DailyColorState,
  DeviceState,
  DemoScenarioPreset,
  GrowthState,
  InteractionScene,
  MemoryState,
  SheepEmotionState,
  SheepProfileState,
  SheepVisualState
} from "../../state/types";

const QUICK_EVENTS: Array<{ key: DeviceInputEventType; label: string }> = [
  { key: "touch_head", label: "摸摸头" },
  { key: "hug_pressure", label: "抱一下" },
  { key: "proximity_near", label: "靠近它" }
];

type HomePageProps = {
  sheepProfile: SheepProfileState;
  sheepEmotionState: SheepEmotionState;
  sheepVisualState: SheepVisualState;
  dailyColorState: DailyColorState;
  bondState: BondState;
  growthState: GrowthState;
  memoryState: MemoryState;
  activeScene: InteractionScene;
  surveySubmissionCount: number;
  onDrawDailyColor: () => void;
  onGoInteraction: () => void;
  onGoGrowth: () => void;
  onGoMemory: () => void;
  onGoValidation: () => void;
  onTriggerQuickEvent: (eventType: DeviceInputEventType) => void;
  onTonightCompanion: () => void;
  onEnterInvestorMode?: () => void;
  onEnterRecordingMode?: () => void;
  onExitPresentationMode?: () => void;
  onStartVideoScript?: (preset: DemoScenarioPreset) => void;
  presentationMode?: PresentationMode;
  deviceState?: DeviceState;
  focusMode?: boolean;
  showWaitlistEntry?: boolean;
};

function syncHint(status: DailyColorState["syncStatus"]): string {
  if (status === "synced") return "幸运色映射已同步";
  if (status === "pending_device") return "映射待同步";
  return "等待抽取今日幸运色";
}

function relationStage(level: number): { title: string; desc: string; nextLevel: number | null } {
  if (level >= 6) {
    return {
      title: "深度陪伴",
      desc: "你们已经形成稳定默契，重点是每天都在彼此身边。",
      nextLevel: null
    };
  }
  if (level >= 4) {
    return {
      title: "默契升温",
      desc: "互动越来越像真实关系，小羊卷会记住你的节奏。",
      nextLevel: 6
    };
  }
  if (level >= 2) {
    return {
      title: "熟悉建立",
      desc: "幸运色和互动开始对齐，关系正在持续变近。",
      nextLevel: 4
    };
  }
  return {
    title: "第一次靠近",
    desc: "先抽取幸运色，再轻互动，小羊卷会开始认识你。",
    nextLevel: 2
  };
}

const SCRIPT_ITEMS: Array<{ key: DemoScenarioPreset; label: string }> = [
  { key: "today_first_meet", label: "今日第一次见面" },
  { key: "tonight_tired", label: "今晚有点累" },
  { key: "companionship_growth", label: "连续陪伴后的关系感" }
];

function waitlistHint(bondState: BondState, deviceState?: DeviceState): string {
  if (bondState.todayInteractCount <= 0) {
    return "建议先互动，再留资";
  }
  if (!deviceState) {
    return "提交后会收到数字生命邀测与实体版进展通知";
  }
  if (deviceState.syncState === "error") {
    return "状态同步有波动，但候补意向会先保存在本地队列";
  }
  if (deviceState.syncState === "pending" || deviceState.syncState === "syncing") {
    return "状态正在同步中，候补意向会并行进入发送队列";
  }
  return "提交后会收到数字生命邀测与实体版进展通知";
}

export function HomePage({
  sheepProfile,
  sheepEmotionState,
  sheepVisualState,
  dailyColorState,
  bondState,
  growthState,
  memoryState,
  activeScene,
  surveySubmissionCount,
  onDrawDailyColor,
  onGoInteraction,
  onGoGrowth,
  onGoMemory,
  onGoValidation,
  onTriggerQuickEvent,
  onTonightCompanion,
  onEnterInvestorMode,
  onEnterRecordingMode,
  onExitPresentationMode,
  onStartVideoScript,
  presentationMode = "default",
  deviceState,
  focusMode = false,
  showWaitlistEntry = true
}: HomePageProps) {
  const sceneProfile = sceneProfileOf(activeScene);
  const stage = relationStage(bondState.level);
  const milestoneCount = memoryState.memoryCards.filter((item) => item.category === "milestone").length;
  const canEnterInvestorMode = Boolean(onEnterInvestorMode) && presentationMode === "default";
  const canEnterVideoMode = Boolean(onEnterRecordingMode) && presentationMode === "default";
  const canExitPresentation = Boolean(onExitPresentationMode) && presentationMode !== "default";
  const showPresentationActions = !focusMode && (canEnterInvestorMode || canEnterVideoMode || canExitPresentation);
  const homeStyle = {
    "--scene-color": dailyColorState.softHex || dailyColorState.colorHex || "#9eb8df"
  } as CSSProperties;

  return (
    <section
      className={`page-grid home-page-grid scene-atmosphere ${sceneProfile.atmosphereClass}${focusMode ? " home-focus" : ""}`}
      style={homeStyle}
      data-testid="home-page"
    >
      <article className="card home-hero-card">
        <div className="home-hero-head">
          <p className="kicker">活着的小羊卷，已经在这里等你</p>
          <h2>抽一份今日幸运色，开始今天的陪伴</h2>
          <p className="muted">幸运色会立刻改变眼睛、围巾和状态，再继续互动就能推进关系。</p>
        </div>

        <div className="state-chip-row home-hero-status-row">
          <span data-testid="home-scene-label">场景：{sceneLabel(activeScene)}</span>
          <span>情绪：{emotionLabel(sheepEmotionState.emotion)}</span>
          <span>幸运色：{dailyColorState.colorName}</span>
          <span>{syncHint(dailyColorState.syncStatus)}</span>
          <span>关系 Lv.{bondState.level}</span>
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
          size="hero"
          minimal={focusMode}
        />

        <div className="home-hero-actions">
          <button type="button" className="primary-btn" onClick={onDrawDailyColor} data-testid="home-draw-color">
            抽取今日幸运色
          </button>
          <button type="button" className="primary-btn" onClick={onGoInteraction} data-testid="home-go-interaction">
            开始今天的互动
          </button>
          <button type="button" className="ghost-btn" onClick={onTonightCompanion} data-testid="home-tonight-companion">
            今晚陪我
          </button>
        </div>

        <div className="quick-actions home-touch-actions">
          {QUICK_EVENTS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onTriggerQuickEvent(item.key)}
              data-testid={`home-quick-event-${item.key}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {showPresentationActions ? (
          <div className="home-hero-sub-actions">
            {canEnterInvestorMode ? (
              <button type="button" className="text-btn" onClick={onEnterInvestorMode}>
                一键进入投资人展示模式
              </button>
            ) : null}
            {canEnterVideoMode ? (
              <button type="button" className="text-btn" onClick={onEnterRecordingMode}>
                一键进入演示视频模式
              </button>
            ) : null}
            {canExitPresentation ? (
              <button type="button" className="text-btn" onClick={onExitPresentationMode}>
                退出当前展示模式
              </button>
            ) : null}
          </div>
        ) : null}

        <p className="home-hero-footnote">
          {sheepProfile.name} 正在「{sceneProfile.style}」氛围里等你，抽色和互动会直接改变它的状态。
        </p>
      </article>

      {focusMode ? null : (
        <article className="card home-flow-card">
          <h3>主路径</h3>
          <div className="state-chip-row">
            <span>首页：看见活着的小羊卷</span>
            <span>互动：收到真实回应</span>
            <span>成长：关系持续推进</span>
            <span>记忆：共同经历沉淀</span>
            <span>候补：轻量提交意向</span>
          </div>
          <div className="home-flow-actions">
            <button type="button" className="ghost-btn" onClick={onGoInteraction} data-testid="home-flow-go-interaction">
              去互动页
            </button>
            <button type="button" className="ghost-btn" onClick={onGoGrowth} data-testid="home-flow-go-growth">
              看关系成长
            </button>
            <button type="button" className="ghost-btn" onClick={onGoMemory} data-testid="home-flow-go-memory">
              回看共同记忆
            </button>
          </div>
        </article>
      )}

      {focusMode ? null : (
        <article className="card home-growth-card">
          <h3>当前关系阶段：{stage.title}</h3>
          <p className="muted">{stage.desc}</p>
          <div className="state-chip-row">
            <span>今日互动 {bondState.todayInteractCount} 次</span>
            <span>连续陪伴 {bondState.streakDays} 天</span>
            <span>已解锁成长节点 {growthState.unlockedNodeIds.length}</span>
            <span>纪念节点 {milestoneCount}</span>
            {stage.nextLevel ? <span>下一阶段目标 Lv.{stage.nextLevel}</span> : <span>已进入稳定阶段</span>}
          </div>
          <button type="button" className="ghost-btn" onClick={onGoGrowth} data-testid="home-growth-go-growth">
            继续推进关系
          </button>
        </article>
      )}

      {focusMode || !onStartVideoScript || presentationMode !== "default" ? null : (
        <article className="card home-demo-entry-card">
          <h3>演示视频脚本</h3>
          <p className="muted">可直接用于录制：一键切到录制视图，再按脚本自动推进。</p>
          <div className="home-script-actions">
            {SCRIPT_ITEMS.map((item) => (
              <button key={item.key} type="button" className="ghost-btn" onClick={() => onStartVideoScript(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        </article>
      )}

      {focusMode || !showWaitlistEntry ? null : (
        <article className="card home-waitlist-card">
          <h3>候补承接</h3>
          <p className="muted">体验后顺手留意向即可，不会打断陪伴流程。</p>
          <div className="state-chip-row">
            <span>已提交意向 {surveySubmissionCount} 份</span>
            <span>{waitlistHint(bondState, deviceState)}</span>
            <span>提交后会进入候补队列，可在候补页看到状态并重试</span>
          </div>
          <button type="button" className="primary-btn" onClick={onGoValidation} data-testid="home-go-validation">
            提交候补意向
          </button>
        </article>
      )}
    </section>
  );
}
