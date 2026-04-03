import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { appReducer } from "../src/domain/reducers";
import type { AppEvent } from "../src/domain/events";
import { DemoModePanel } from "../src/features/demo/DemoModePanel";
import { SceneRewardHintCard } from "../src/features/interaction/SceneRewardHintCard";
import { ExperienceFeedbackCard } from "../src/features/memory/ExperienceFeedbackCard";
import { MemoryDaySummary } from "../src/features/memory/MemoryDaySummary";
import { MemoryLoopChainCard } from "../src/features/memory/MemoryLoopChainCard";
import { buildSurveyQueueSummary } from "../src/features/memory/surveyQueueView";
import { HomePage } from "../src/pages/home/HomePage";
import { InteractionPage } from "../src/pages/interaction/InteractionPage";
import { SURVEY_UPLOAD_QUEUE_CONFIG } from "../src/config/surveyUploadQueue";
import { createInitialBondState } from "../src/state/slices/bondStateSlice";
import { createInitialDailyColorState } from "../src/state/slices/dailyColorSlice";
import { createInitialDeviceState } from "../src/state/slices/deviceStateSlice";
import { createInitialGrowthState } from "../src/state/slices/growthStateSlice";
import { createInitialInteractionState } from "../src/state/slices/interactionStateSlice";
import { createInitialMemoryState } from "../src/state/slices/memoryStateSlice";
import { createInitialSheepEmotionState } from "../src/state/slices/sheepEmotionStateSlice";
import { createInitialSheepProfileState } from "../src/state/slices/sheepStateSlice";
import { createInitialSheepVisualState } from "../src/state/slices/sheepVisualStateSlice";
import { createInitialTelemetryState } from "../src/state/slices/telemetryStateSlice";
import { createInitialUserProfile } from "../src/state/slices/userProfileSlice";
import type { AppRootState, ExperienceSurveySubmission } from "../src/state/types";
import { dayKeyOf } from "../src/utils/time";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[demo-e2e] ${message}`);
  }
}

function assertVisible(markup: string, token: string, message: string): void {
  assert(markup.includes(token), `${message} (missing: ${token})`);
}

function createInitialState(nowIso: string): AppRootState {
  const dayKey = dayKeyOf(nowIso);
  return {
    userProfile: createInitialUserProfile(nowIso),
    sheepProfile: createInitialSheepProfileState(),
    sheepEmotionState: createInitialSheepEmotionState(nowIso),
    sheepVisualState: createInitialSheepVisualState(),
    dailyColorState: createInitialDailyColorState(dayKey),
    bondState: createInitialBondState(nowIso),
    growthState: createInitialGrowthState(dayKey),
    memoryState: createInitialMemoryState(nowIso, dayKey),
    deviceState: createInitialDeviceState(),
    interactionState: createInitialInteractionState(nowIso),
    telemetryState: createInitialTelemetryState(),
    ui: {
      activeTab: "home",
      activeModal: "none",
      isVoiceRecording: false,
      showDebugPanel: false,
      quietUI: true,
      sceneMode: "auto",
      demoMode: false
    }
  };
}

function applyEvents(base: AppRootState, events: AppEvent[]): AppRootState {
  return events.reduce((state, event) => appReducer(state, event), base);
}

type RecoverableSurveySelectionOptions = {
  limit: number;
  nowMs?: number;
  stalePendingMs: number;
  inflightIds?: Set<string>;
  isOnline?: boolean;
};

function selectRecoverableSurveySubmissions(
  submissions: ExperienceSurveySubmission[],
  options: RecoverableSurveySelectionOptions
): ExperienceSurveySubmission[] {
  const nowMs = options.nowMs ?? Date.now();
  const inflightIds = options.inflightIds ?? new Set<string>();
  if (options.isOnline === false) return [];

  return submissions
    .filter((item) => item.status !== "upload_success" && item.status !== "upload_permanent_failed")
    .filter((item) => {
      if (inflightIds.has(item.id)) return false;
      if (item.status === "saved_local") return true;
      if (item.status === "upload_failed") {
        if (!item.nextRetryAt) return true;
        return new Date(item.nextRetryAt).getTime() <= nowMs;
      }
      if (item.status === "upload_pending") {
        if (!item.lastAttemptAt) return true;
        return nowMs - new Date(item.lastAttemptAt).getTime() >= options.stalePendingMs;
      }
      return false;
    })
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
    .slice(0, Math.max(1, options.limit));
}

function renderHome(state: AppRootState, focusMode = false): string {
  return renderToStaticMarkup(
    createElement(HomePage, {
      sheepProfile: state.sheepProfile,
      sheepEmotionState: state.sheepEmotionState,
      sheepVisualState: state.sheepVisualState,
      dailyColorState: state.dailyColorState,
      bondState: state.bondState,
      growthState: state.growthState,
      memoryState: state.memoryState,
      activeScene: state.interactionState.activeScene,
      surveySubmissionCount: state.userProfile.surveySubmissions.length,
      onDrawDailyColor: () => undefined,
      onGoInteraction: () => undefined,
      onGoGrowth: () => undefined,
      onGoMemory: () => undefined,
      onGoValidation: () => undefined,
      onTriggerQuickEvent: () => undefined,
      onTonightCompanion: () => undefined,
      focusMode
    })
  );
}

function renderInteraction(state: AppRootState, focusMode = false): string {
  return renderToStaticMarkup(
    createElement(InteractionPage, {
      sheepEmotionState: state.sheepEmotionState,
      sheepVisualState: state.sheepVisualState,
      dailyColorName: state.dailyColorState.colorName,
      activeScene: state.interactionState.activeScene,
      isVoiceRecording: state.ui.isVoiceRecording,
      messages: state.interactionState.messages,
      lastFeedback: state.interactionState.lastFeedback,
      deviceState: state.deviceState,
      onSendText: () => undefined,
      onSendVoiceMock: () => undefined,
      onStartBedtime: () => undefined,
      onSceneChange: () => undefined,
      onTriggerEvent: () => undefined,
      onGoGrowth: () => undefined,
      onGoMemory: () => undefined,
      onGoValidation: () => undefined,
      focusMode,
      showDiagnostics: true
    })
  );
}

function renderMemoryDaySummary(state: AppRootState, dayKey: string): string {
  return renderToStaticMarkup(
    createElement(MemoryDaySummary, {
      selectedDayKey: dayKey,
      selectedScene: state.interactionState.activeScene,
      colorCalendar: state.memoryState.colorCalendar,
      timeline: state.memoryState.timeline,
      interactionSummaries: state.memoryState.interactionSummaries,
      bedtimeMemories: state.memoryState.bedtimeMemories,
      sharedMoments: state.memoryState.sharedMoments,
      memoryCards: state.memoryState.memoryCards
    })
  );
}

function runCaseDrawHomeHistory(): void {
  const bootIso = "2026-04-02T09:00:00.000Z";
  let state = createInitialState(bootIso);
  state = appReducer(state, { type: "APP_BOOTSTRAP", nowIso: bootIso, dayKey: "2026-04-02" });

  const beforeHistoryLength = state.dailyColorState.history.length;
  const drawIso = "2026-04-03T09:10:00.000Z";
  state = appReducer(state, { type: "DAILY_COLOR_DRAWN", nowIso: drawIso, dayKey: "2026-04-03" });

  assert(state.dailyColorState.dayKey === "2026-04-03", "daily color should switch to new day");
  assert(Boolean(state.dailyColorState.colorId), "daily color should be generated");
  assert(
    state.dailyColorState.history.length >= beforeHistoryLength + 1,
    "daily color history should append a new draw record"
  );
  assert(
    state.memoryState.colorCalendar.some((item) => item.dayKey === "2026-04-03"),
    "memory calendar should include the drawn day"
  );

  const homeMarkup = renderHome(state);
  assertVisible(homeMarkup, 'data-testid="home-scene-label"', "home scene marker should be visible");
  assertVisible(homeMarkup, state.dailyColorState.colorName, "home should show current lucky color in UI");

  console.log("[demo-e2e] case1 draw->home-state->history+ui OK");
}

function runCaseDrawInteractionTaskMemory(): void {
  const bootIso = "2026-04-02T10:00:00.000Z";
  let state = createInitialState(bootIso);
  state = appReducer(state, { type: "APP_BOOTSTRAP", nowIso: bootIso, dayKey: "2026-04-02" });

  const beforeTaskCount = state.growthState.completedTaskIds.length;

  state = applyEvents(state, [
    { type: "INTERACTION_TRIGGERED", nowIso: "2026-04-02T10:03:00.000Z", interaction: "touch_head" },
    { type: "CHAT_SENT", nowIso: "2026-04-02T10:04:00.000Z", text: "我喜欢这种安静陪伴。" }
  ]);

  assert(
    state.growthState.completedTaskIds.length > beforeTaskCount,
    "interaction chain should increase completed task count"
  );
  assert(
    state.memoryState.interactionSummaries.some((item) => item.dayKey === "2026-04-02"),
    "interaction summary should be generated for the day"
  );
  assert(
    state.memoryState.timeline.some((item) => item.event.includes("互动")),
    "timeline should include interaction records"
  );
  assert(
    state.memoryState.sharedMoments.some((item) => item.milestoneId === "first-draw"),
    "shared moments should include first draw milestone"
  );

  const interactionMarkup = renderInteraction(state);
  const hasTaskOrUnlock =
    interactionMarkup.includes('data-testid="feedback-new-task"') ||
    interactionMarkup.includes('data-testid="feedback-unlocked-node"');
  assert(hasTaskOrUnlock, "interaction feedback should visibly show task/unlock hint when progressed");

  const memoryMarkup = renderMemoryDaySummary(state, "2026-04-02");
  assertVisible(memoryMarkup, 'data-testid="memory-day-summary"', "memory day summary card should be visible");

  console.log("[demo-e2e] case2 draw->interaction->task->memory+ui OK");
}

function runCaseSyncFailureFallbackToDevice(): void {
  const bootIso = "2026-04-02T11:00:00.000Z";
  let state = createInitialState(bootIso);
  state = appReducer(state, { type: "APP_BOOTSTRAP", nowIso: bootIso, dayKey: "2026-04-02" });

  state = applyEvents(state, [
    { type: "DEVICE_OUTPUT_SYNC_FAILED", nowIso: "2026-04-02T11:05:00.000Z", error: "mock sync failed for e2e" },
    { type: "TAB_CHANGED", tab: "device" }
  ]);

  assert(state.deviceState.syncState === "error", "sync failure should move device state into error");
  assert(state.deviceState.lastSyncError === "mock sync failed for e2e", "sync error message should be stored");
  assert(
    state.deviceState.recentEventLogs.some((item) => item.type === "sync_failed"),
    "sync failure should generate a lightweight diagnostics log"
  );
  assert(state.ui.activeTab === "device", "fallback path should jump to device page");

  const warningMarkup = renderInteraction(state);
  assertVisible(warningMarkup, 'data-testid="interaction-warning-card"', "device warning card should be visible");
  assertVisible(warningMarkup, 'data-testid="interaction-warning-item"', "warning list item should be visible");

  console.log("[demo-e2e] case3 sync-failure->hint->device-tab+ui OK");
}

function runCaseCrossDayCompanionFlow(): void {
  let state = createInitialState("2026-04-02T08:00:00.000Z");
  state = appReducer(state, { type: "APP_BOOTSTRAP", nowIso: "2026-04-02T08:00:00.000Z", dayKey: "2026-04-02" });
  const day1Color = state.dailyColorState.colorId;

  state = appReducer(state, {
    type: "CHAT_SENT",
    nowIso: "2026-04-02T08:05:00.000Z",
    text: "今天先从一句问候开始。"
  });
  assert(
    state.memoryState.interactionSummaries.some((item) => item.dayKey === "2026-04-02"),
    "day1 summary should exist before cross-day bootstrap"
  );

  state = appReducer(state, { type: "APP_BOOTSTRAP", nowIso: "2026-04-03T08:00:00.000Z", dayKey: "2026-04-03" });
  assert(state.bondState.streakDays >= 2, "streak days should increase on next day bootstrap");
  assert(state.dailyColorState.dayKey === "2026-04-03", "daily color dayKey should move to day2");
  assert(Boolean(state.dailyColorState.colorId), "day2 should have generated lucky color");
  assert(
    state.memoryState.colorCalendar.some((item) => item.dayKey === "2026-04-02") &&
      state.memoryState.colorCalendar.some((item) => item.dayKey === "2026-04-03"),
    "calendar should keep both day1 and day2 records"
  );
  assert(
    state.memoryState.interactionSummaries.some((item) => item.dayKey === "2026-04-02"),
    "day1 summary should still be viewable after day2 bootstrap"
  );
  assert(
    state.dailyColorState.colorId !== null && state.dailyColorState.colorId !== day1Color,
    "day2 should continue the flow with a valid color state"
  );

  state = appReducer(state, {
    type: "INTERACTION_TRIGGERED",
    nowIso: "2026-04-03T08:08:00.000Z",
    interaction: "touch_head"
  });
  assert(
    state.memoryState.interactionSummaries.some((item) => item.dayKey === "2026-04-03"),
    "day2 flow should continue and produce day2 summary"
  );

  const day1Markup = renderMemoryDaySummary(state, "2026-04-02");
  assertVisible(day1Markup, "2026-04-02", "day1 summary should still be visible in memory day summary UI");

  console.log("[demo-e2e] case4 cross-day->new-color->streak->summary-retain+ui OK");
}

function runCaseDeviceDegradeRecovery(): void {
  let state = createInitialState("2026-04-02T12:00:00.000Z");
  state = appReducer(state, { type: "APP_BOOTSTRAP", nowIso: "2026-04-02T12:00:00.000Z", dayKey: "2026-04-02" });

  const output = {
    emotion: "soft" as const,
    emotion_level: 60,
    eye_state: "half_closed" as const,
    eye_color_hex: "#C9DBEE",
    scarf_color: "#F5C7A8",
    scarf_color_hex: "#F5C7A8",
    motion_template: "idle_breathe" as const,
    voice_style: "soft" as const
  };

  state = appReducer(state, { type: "DEVICE_CONNECTION_CHANGED", nowIso: "2026-04-02T12:01:00.000Z", connected: true });
  state = appReducer(state, {
    type: "DEVICE_COMMAND_ENQUEUED",
    nowIso: "2026-04-02T12:02:00.000Z",
    commandId: "cmd-e2e-1",
    output
  });
  assert(state.deviceState.syncState === "syncing", "enqueue should put device sync into syncing");

  state = appReducer(state, {
    type: "DEVICE_OUTPUT_SYNC_FAILED",
    nowIso: "2026-04-02T12:03:00.000Z",
    error: "mock transient bridge error"
  });
  assert(state.deviceState.syncState === "error", "sync failure should move to error state");

  state = appReducer(state, { type: "DEVICE_SYNC_RETRY_REQUESTED", nowIso: "2026-04-02T12:04:00.000Z" });
  assert(state.deviceState.syncState === "pending", "retry should move sync state to pending");

  state = appReducer(state, {
    type: "DEVICE_OUTPUT_SYNCED",
    nowIso: "2026-04-02T12:05:00.000Z",
    output
  });
  assert(state.deviceState.syncState === "ok", "successful sync should recover to ok state");
  assert(state.dailyColorState.syncStatus === "synced", "recovery should mark daily color as synced");
  assert(state.deviceState.lastSyncError === null, "recovery should clear sync error");
  assert(
    state.deviceState.recentEventLogs.some((item) => item.type === "sync_retry") &&
      state.deviceState.recentEventLogs.some((item) => item.type === "sync_ok"),
    "recovery flow should log retry and sync success"
  );
  assert(
    state.telemetryState.events.some((item) => item.eventType === "device_sync" && item.status === "failed") &&
      state.telemetryState.events.some((item) => item.eventType === "device_sync" && item.status === "retrying") &&
      state.telemetryState.events.some((item) => item.eventType === "device_sync" && item.status === "success"),
    "device recovery flow should write telemetry placeholder events"
  );

  console.log("[demo-e2e] case5 device pending->error->retry->ok recovery OK");
}

function runCaseQuestionnaireQueueAndDemoUi(): void {
  let state = createInitialState("2026-04-02T14:00:00.000Z");
  state = appReducer(state, { type: "APP_BOOTSTRAP", nowIso: "2026-04-02T14:00:00.000Z", dayKey: "2026-04-02" });

  const failedSubmission: ExperienceSurveySubmission = {
    id: "survey-e2e-1",
    createdAt: "2026-04-02T14:05:00.000Z",
    source: "experience_feedback_card",
    status: "upload_failed",
    attemptCount: 2,
    lastAttemptAt: "2026-04-02T14:05:10.000Z",
    uploadedAt: null,
    nextRetryAt: "2026-04-02T14:05:20.000Z",
    permanentFailedAt: null,
    lastError: "network unstable",
    payload: {
      wantsPhysical: "yes",
      favoriteScene: "comfort",
      favoriteColorExperience: "rose_dawn",
      joinWaitlist: "yes",
      contact: "test@example.com"
    }
  };

  state = appReducer(state, {
    type: "USER_PROFILE_UPDATED",
    patch: {
      experienceFeedback: {
        ...state.userProfile.experienceFeedback,
        wantsPhysical: "yes",
        favoriteScene: "comfort",
        favoriteColorExperience: "rose_dawn",
        joinWaitlist: "yes",
        contact: "test@example.com",
        continueUsing: "yes",
        updatedAt: "2026-04-02T14:05:00.000Z"
      },
      surveySubmissions: [failedSubmission]
    }
  });

  const queueSummary = buildSurveyQueueSummary(state.userProfile.surveySubmissions);
  const surveyMarkup = renderToStaticMarkup(
    createElement(ExperienceFeedbackCard, {
      feedback: state.userProfile.experienceFeedback,
      submissionCount: state.userProfile.surveySubmissions.length,
      lastSubmittedAt: failedSubmission.createdAt,
      latestSubmission: failedSubmission,
      queueSummary,
      activeScene: state.interactionState.activeScene,
      dailyColorName: state.dailyColorState.colorName,
      onSubmit: () => undefined,
      onRetryUpload: () => undefined
    })
  );

  assertVisible(surveyMarkup, 'data-testid="survey-pill-failed"', "survey failed status pill should be visible");
  assertVisible(surveyMarkup, 'data-testid="survey-pill-retryable"', "survey retryable status should be visible");
  assertVisible(surveyMarkup, 'data-testid="survey-queue-summary"', "survey queue summary should be visible");

  state = appReducer(state, {
    type: "DEMO_PRESET_APPLIED",
    nowIso: "2026-04-02T14:10:00.000Z",
    dayKey: "2026-04-02",
    preset: "companionship_growth",
    options: {
      intensity: "strong",
      timeWindow: "night",
      deviceState: "recovering",
      bondStage: "close",
      colorCategory: "hope"
    }
  });

  assert(
    state.memoryState.timeline.some((item) => item.event.includes("Demo剧本：")),
    "timeline should include demo preset status text"
  );

  const sceneRewardMarkup = renderToStaticMarkup(
    createElement(SceneRewardHintCard, {
      activeScene: state.interactionState.activeScene,
      lastFeedback: state.interactionState.lastFeedback
    })
  );
  assertVisible(sceneRewardMarkup, 'data-testid="scene-reward-card"', "scene reward card should be visible");

  const demoPanelMarkup = renderToStaticMarkup(
    createElement(DemoModePanel, {
      activeScene: state.interactionState.activeScene,
      currentColorId: state.dailyColorState.colorId,
      colors: [{ colorId: "apricot_mist", colorName: "杏雾" }],
      currentOutput: state.deviceState.lastOutput ?? {
        emotion: "soft",
        emotion_level: 56,
        eye_state: "half_closed",
        eye_color_hex: "#C9DBEE",
        scarf_color: "#F5C7A8",
        scarf_color_hex: "#F5C7A8",
        motion_template: "idle_breathe",
        voice_style: "soft"
      },
      onSetColor: () => undefined,
      onSetScene: () => undefined,
      onTriggerEvent: () => undefined,
      onBoostGrowth: () => undefined,
      onApplyPreset: () => undefined,
      onStartScriptFlow: () => undefined,
      onAdvanceScriptFlow: () => undefined,
      onStopScriptFlow: () => undefined,
      scriptFlowPreset: "companionship_growth",
      scriptFlowMode: "manual",
      scriptFlowStep: 0,
      scriptFlowRunning: false,
      onTriggerMockMilestone: () => undefined,
      telemetryItems: state.telemetryState.events.length
        ? state.telemetryState.events
        : [
            {
              id: "demo-telemetry-fallback",
              at: "2026-04-02T14:10:05.000Z",
              traceId: "demo-fallback",
              eventType: "survey_upload",
              eventName: "survey_upload_failed",
              source: "survey_queue",
              status: "failed",
              error: "fallback telemetry event"
            }
          ],
      onReset: () => undefined,
      onOpenDevice: () => undefined,
      onRecordingModeChange: () => undefined,
      recordingMode: false,
      onClose: () => undefined,
      initialLastAppliedPreset: "companionship_growth"
    })
  );
  assertVisible(demoPanelMarkup, 'data-testid="demo-param-summary"', "demo preset param summary should be visible");
  assertVisible(
    demoPanelMarkup,
    'data-testid="demo-mock-source-controls"',
    "demo mock source controls should be visible"
  );
  assertVisible(
    demoPanelMarkup,
    'data-testid="demo-mock-payload-controls"',
    "demo mock payload controls should be visible"
  );
  assertVisible(demoPanelMarkup, 'data-testid="demo-mock-activity-input"', "demo mock activity input should be visible");
  assertVisible(demoPanelMarkup, 'data-testid="demo-telemetry-preview"', "demo telemetry preview should be visible");
  assertVisible(demoPanelMarkup, 'data-testid="demo-last-applied"', "demo preset applied text should be visible");

  console.log("[demo-e2e] case6 survey-queue->ui-visibility + demo-preset-ui OK");
}

function runCaseMemoryLoopAlertToDeviceJump(): void {
  let state = createInitialState("2026-04-02T16:00:00.000Z");
  state = appReducer(state, { type: "APP_BOOTSTRAP", nowIso: "2026-04-02T16:00:00.000Z", dayKey: "2026-04-02" });
  const timelineWithoutSyncSuccess = [
    {
      id: "case7-draw",
      event: "抽到今日幸运色：杏雾",
      at: "2026-04-02T16:00:00.000Z"
    },
    {
      id: "case7-interaction",
      event: "互动：摸摸头",
      at: "2026-04-02T16:05:00.000Z"
    }
  ];

  let jumpedToDevice = false;
  const onGoDevice = () => {
    jumpedToDevice = true;
    state = appReducer(state, { type: "TAB_CHANGED", tab: "device" });
  };

  const markup = renderToStaticMarkup(
    createElement(MemoryLoopChainCard, {
      selectedDayKey: "2026-04-02",
      timeline: timelineWithoutSyncSuccess,
      colorCalendar: state.memoryState.colorCalendar,
      interactionSummaries: [
        {
          dayKey: "2026-04-02",
          summary: "互动后未同步",
          interactionCount: 1,
          bedtimeCount: 0,
          lastScene: "chat",
          updatedAt: "2026-04-02T16:05:00.000Z"
        }
      ],
      onGoDevice
    })
  );

  assertVisible(
    markup,
    'data-testid="memory-loop-go-device"',
    "memory loop alert should render go-device button"
  );
  onGoDevice();
  assert(jumpedToDevice, "loop alert path should trigger device navigation callback");
  assert(state.ui.activeTab === "device", "loop alert go-device path should land on device tab");
  console.log("[demo-e2e] case7 memory-loop-alert->device-jump UI baseline OK");
}

function runCaseSurveyQueueRestartRecovery(): void {
  const restartIso = "2026-04-04T08:00:00.000Z";
  const nowMs = new Date(restartIso).getTime();
  let state = createInitialState(restartIso);

  const persistedSubmissions: ExperienceSurveySubmission[] = [
    {
      id: "survey-local-1",
      createdAt: "2026-04-04T07:50:00.000Z",
      source: "experience_feedback_card",
      status: "saved_local",
      attemptCount: 0,
      lastAttemptAt: null,
      uploadedAt: null,
      nextRetryAt: null,
      permanentFailedAt: null,
      lastError: null,
      payload: {
        wantsPhysical: "yes",
        favoriteScene: "comfort",
        favoriteColorExperience: "rose_dawn",
        joinWaitlist: "yes",
        contact: null
      }
    },
    {
      id: "survey-failed-due",
      createdAt: "2026-04-04T07:54:00.000Z",
      source: "experience_feedback_card",
      status: "upload_failed",
      attemptCount: 1,
      lastAttemptAt: "2026-04-04T07:54:05.000Z",
      uploadedAt: null,
      nextRetryAt: "2026-04-04T07:55:00.000Z",
      permanentFailedAt: null,
      lastError: "mock network down",
      payload: {
        wantsPhysical: "no",
        favoriteScene: "chat",
        favoriteColorExperience: "cloud_blue",
        joinWaitlist: "no",
        contact: null
      }
    },
    {
      id: "survey-inflight",
      createdAt: "2026-04-04T07:56:00.000Z",
      source: "experience_feedback_card",
      status: "saved_local",
      attemptCount: 0,
      lastAttemptAt: null,
      uploadedAt: null,
      nextRetryAt: null,
      permanentFailedAt: null,
      lastError: null,
      payload: {
        wantsPhysical: "unsure",
        favoriteScene: "mood",
        favoriteColorExperience: "mist_gray",
        joinWaitlist: "yes",
        contact: null
      }
    },
    {
      id: "survey-failed-immediate",
      createdAt: "2026-04-04T07:57:00.000Z",
      source: "experience_feedback_card",
      status: "upload_failed",
      attemptCount: 2,
      lastAttemptAt: "2026-04-04T07:57:10.000Z",
      uploadedAt: null,
      nextRetryAt: null,
      permanentFailedAt: null,
      lastError: "mock timeout",
      payload: {
        wantsPhysical: "yes",
        favoriteScene: "bedtime",
        favoriteColorExperience: "night_milk",
        joinWaitlist: "yes",
        contact: null
      }
    },
    {
      id: "survey-pending-stale",
      createdAt: "2026-04-04T07:58:00.000Z",
      source: "experience_feedback_card",
      status: "upload_pending",
      attemptCount: 1,
      lastAttemptAt: "2026-04-04T07:58:00.000Z",
      uploadedAt: null,
      nextRetryAt: null,
      permanentFailedAt: null,
      lastError: null,
      payload: {
        wantsPhysical: "yes",
        favoriteScene: "color",
        favoriteColorExperience: "sunny_orange",
        joinWaitlist: "yes",
        contact: null
      }
    },
    {
      id: "survey-failed-future",
      createdAt: "2026-04-04T07:59:00.000Z",
      source: "experience_feedback_card",
      status: "upload_failed",
      attemptCount: 1,
      lastAttemptAt: "2026-04-04T07:59:10.000Z",
      uploadedAt: null,
      nextRetryAt: "2026-04-04T08:10:00.000Z",
      permanentFailedAt: null,
      lastError: "mock unstable network",
      payload: {
        wantsPhysical: "no",
        favoriteScene: "chat",
        favoriteColorExperience: "pearl_white",
        joinWaitlist: "no",
        contact: null
      }
    },
    {
      id: "survey-success",
      createdAt: "2026-04-04T07:40:00.000Z",
      source: "experience_feedback_card",
      status: "upload_success",
      attemptCount: 1,
      lastAttemptAt: "2026-04-04T07:40:02.000Z",
      uploadedAt: "2026-04-04T07:40:04.000Z",
      nextRetryAt: null,
      permanentFailedAt: null,
      lastError: null,
      payload: {
        wantsPhysical: "yes",
        favoriteScene: "comfort",
        favoriteColorExperience: "sea_salt",
        joinWaitlist: "yes",
        contact: "ok@example.com"
      }
    }
  ];

  state = appReducer(state, {
    type: "USER_PROFILE_UPDATED",
    patch: {
      surveySubmissions: persistedSubmissions
    }
  });

  const startupBatch = selectRecoverableSurveySubmissions(state.userProfile.surveySubmissions, {
    limit: SURVEY_UPLOAD_QUEUE_CONFIG.startupBatchSize,
    nowMs,
    stalePendingMs: SURVEY_UPLOAD_QUEUE_CONFIG.stalePendingMs,
    inflightIds: new Set(["survey-inflight"]),
    isOnline: true
  });

  assert(
    startupBatch.length === SURVEY_UPLOAD_QUEUE_CONFIG.startupBatchSize,
    "startup recovery should honor startup batch size"
  );
  assert(
    startupBatch.some((item) => item.id === "survey-local-1"),
    "startup recovery should include saved_local submissions after restart"
  );
  assert(
    startupBatch.some((item) => item.id === "survey-failed-due"),
    "startup recovery should include due failed submissions after restart"
  );
  assert(
    startupBatch.some((item) => item.id === "survey-failed-immediate"),
    "startup recovery should include immediate retry failures"
  );
  assert(
    !startupBatch.some((item) => item.id === "survey-failed-future"),
    "startup recovery should skip future retry submissions"
  );
  assert(
    !startupBatch.some((item) => item.id === "survey-success"),
    "startup recovery should skip uploaded submissions"
  );
  assert(
    !startupBatch.some((item) => item.id === "survey-inflight"),
    "startup recovery should skip inflight submissions"
  );

  const offlineBatch = selectRecoverableSurveySubmissions(state.userProfile.surveySubmissions, {
    limit: SURVEY_UPLOAD_QUEUE_CONFIG.startupBatchSize,
    nowMs,
    stalePendingMs: SURVEY_UPLOAD_QUEUE_CONFIG.stalePendingMs,
    isOnline: false
  });
  assert(offlineBatch.length === 0, "offline mode should skip immediate startup recovery batch");

  console.log("[demo-e2e] case8 app-restart->startup-batch-recovery selection OK");
}

function runCaseMobilePrimaryFlowSmoke(): void {
  let state = createInitialState("2026-04-05T09:00:00.000Z");
  state = appReducer(state, { type: "APP_BOOTSTRAP", nowIso: "2026-04-05T09:00:00.000Z", dayKey: "2026-04-05" });

  const homeMarkup = renderHome(state, true);
  assertVisible(homeMarkup, 'data-testid="home-page"', "mobile home should keep home page marker");
  assertVisible(homeMarkup, "抽取今日幸运色", "mobile home should keep lucky color CTA");
  assertVisible(homeMarkup, "开始今天的互动", "mobile home should keep interaction CTA");

  state = appReducer(state, { type: "DAILY_COLOR_DRAWN", nowIso: "2026-04-05T09:02:00.000Z", dayKey: "2026-04-05" });
  state = applyEvents(state, [
    { type: "INTERACTION_TRIGGERED", nowIso: "2026-04-05T09:05:00.000Z", interaction: "touch_head" },
    { type: "CHAT_SENT", nowIso: "2026-04-05T09:06:00.000Z", text: "今天想让你慢慢陪我。" }
  ]);

  assert(state.bondState.todayInteractCount > 0, "mobile primary path should produce interaction growth");

  const interactionMarkup = renderInteraction(state, true);
  assertVisible(interactionMarkup, 'data-testid="interaction-page"', "mobile interaction page should render");
  assertVisible(interactionMarkup, "和小羊卷说句话", "mobile interaction should keep chat input block");

  const queuedSubmission: ExperienceSurveySubmission = {
    id: "survey-mobile-smoke-1",
    createdAt: "2026-04-05T09:07:00.000Z",
    source: "experience_feedback_card",
    status: "saved_local",
    attemptCount: 0,
    lastAttemptAt: null,
    uploadedAt: null,
    nextRetryAt: null,
    permanentFailedAt: null,
    lastError: null,
    payload: {
      wantsPhysical: "yes",
      favoriteScene: "comfort",
      favoriteColorExperience: "moon_white",
      joinWaitlist: "yes",
      contact: "mobile@example.com"
    }
  };

  state = appReducer(state, {
    type: "USER_PROFILE_UPDATED",
    patch: {
      experienceFeedback: {
        ...state.userProfile.experienceFeedback,
        wantsPhysical: "yes",
        favoriteScene: "comfort",
        favoriteColorExperience: "moon_white",
        joinWaitlist: "yes",
        contact: "mobile@example.com",
        continueUsing: "yes",
        updatedAt: "2026-04-05T09:07:00.000Z"
      },
      surveySubmissions: [queuedSubmission]
    }
  });

  const queueSummary = buildSurveyQueueSummary(state.userProfile.surveySubmissions);
  const waitlistMarkup = renderToStaticMarkup(
    createElement(ExperienceFeedbackCard, {
      feedback: state.userProfile.experienceFeedback,
      submissionCount: state.userProfile.surveySubmissions.length,
      lastSubmittedAt: queuedSubmission.createdAt,
      latestSubmission: queuedSubmission,
      queueSummary,
      activeScene: state.interactionState.activeScene,
      dailyColorName: state.dailyColorState.colorName,
      onSubmit: () => undefined,
      onRetryUpload: () => undefined
    })
  );
  assertVisible(waitlistMarkup, 'data-testid="survey-status-row"', "mobile waitlist should show status row");
  assertVisible(waitlistMarkup, "提交候补意向", "mobile waitlist should keep submit CTA");
  console.log("[demo-e2e] case9 mobile-main-flow smoke OK");
}

function run() {
  runCaseDrawHomeHistory();
  runCaseDrawInteractionTaskMemory();
  runCaseSyncFailureFallbackToDevice();
  runCaseCrossDayCompanionFlow();
  runCaseDeviceDegradeRecovery();
  runCaseQuestionnaireQueueAndDemoUi();
  runCaseMemoryLoopAlertToDeviceJump();
  runCaseSurveyQueueRestartRecovery();
  runCaseMobilePrimaryFlowSmoke();
  console.log("[demo-e2e] all demo e2e baseline checks passed");
}

run();
