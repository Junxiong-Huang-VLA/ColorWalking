import { type DeviceInputEventType } from "@colorwalking/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { APP_THEME } from "./AppTheme";
import { BottomTabs } from "../navigation/BottomTabs";
import { PRIMARY_FLOW_TABS } from "../navigation/routes";
import { HomePage } from "../pages/home/HomePage";
import { InteractionPage } from "../pages/interaction/InteractionPage";
import { GrowthPage } from "../pages/growth/GrowthPage";
import { MemoryPage } from "../pages/memory/MemoryPage";
import { ValidationPage } from "../pages/validation/ValidationPage";
import { DemoModePanel } from "../features/demo/DemoModePanel";
import {
  INVESTOR_PRESENTATION_PATH,
  VIDEO_SCRIPT_CONFIG,
  type PresentationMode
} from "../content/releaseCopy";
import { MockDeviceBridge } from "../services/device/MockDeviceBridge";
import { composeDeviceOutput } from "../domain/device/outputMapper";
import { sceneProfileOf } from "../domain/interactionScenes";
import { getLuckyColors } from "../lib";
import { useAppSelector, useAppStore } from "../state/store";
import type {
  AppTabKey,
  DemoPresetOptions,
  DemoScenarioPreset,
  InteractionScene,
  MilestoneMockPayload,
  TelemetryEventName,
  TelemetrySource
} from "../state/types";
import { useDeviceStore, useGrowthStore, useMemoryStore, useSheepStore, useUIStore, useUserStore } from "../state/stores";

const LEGACY_TABS: AppTabKey[] = ["product", "device", "progress", "story", "assets"];
const SCRIPT_FLOW_STEPS: AppTabKey[] = ["home", "home", "interaction", "growth", "memory", "validation"];
const SCRIPT_MAX_STEP = SCRIPT_FLOW_STEPS.length - 1;

const SCRIPT_PRESET_OPTIONS: Record<DemoScenarioPreset, DemoPresetOptions> = {
  today_first_meet: {
    intensity: "light",
    timeWindow: "day",
    deviceState: "ok",
    bondStage: "intro",
    colorCategory: "soft"
  },
  tonight_tired: {
    intensity: "medium",
    timeWindow: "bedtime",
    deviceState: "degraded",
    bondStage: "familiar",
    colorCategory: "sleepy"
  },
  companionship_growth: {
    intensity: "medium",
    timeWindow: "night",
    deviceState: "ok",
    bondStage: "close",
    colorCategory: "hope"
  }
};

const SCRIPT_SCENE_BY_PRESET: Record<DemoScenarioPreset, InteractionScene> = {
  today_first_meet: "chat",
  tonight_tired: "bedtime",
  companionship_growth: "comfort"
};

const SCRIPT_EVENT_BY_PRESET: Record<DemoScenarioPreset, DeviceInputEventType> = {
  today_first_meet: "touch_head",
  tonight_tired: "hug_pressure",
  companionship_growth: "touch_body"
};

const SCRIPT_LINE_BY_PRESET: Record<DemoScenarioPreset, string> = {
  today_first_meet: "第一次见到你，今天也想和你慢慢走。",
  tonight_tired: "今晚有点累，想让你抱一下我。",
  companionship_growth: "谢谢你一直在，关系真的变近了。"
};

function nextCommandId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function syncQuery(patch: Record<string, string | null>) {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  for (const [key, value] of Object.entries(patch)) {
    if (!value) {
      params.delete(key);
      continue;
    }
    params.set(key, value);
  }
  const next = `${url.pathname}${params.toString() ? `?${params.toString()}` : ""}${url.hash}`;
  window.history.replaceState(null, "", next);
}

function isPrimaryTab(tab: AppTabKey): boolean {
  return PRIMARY_FLOW_TABS.includes(tab);
}

function isDemoScenarioPreset(value: string | null): value is DemoScenarioPreset {
  return value === "today_first_meet" || value === "tonight_tired" || value === "companionship_growth";
}

export function AppShell() {
  const { dispatch } = useAppStore();
  const [legacyModeEnabled, setLegacyModeEnabled] = useState(false);
  const bridge = useMemo(() => new MockDeviceBridge(), []);

  const { profile, actions: userActions } = useUserStore();
  const { uiState, actions: uiActions } = useUIStore();
  const {
    sheepProfile,
    sheepEmotionState,
    sheepVisualState,
    dailyColorState,
    messages,
    activeScene,
    lastFeedback,
    actions: sheepActions
  } = useSheepStore();
  const { bondState, growthState, actions: growthActions } = useGrowthStore();
  const { memoryState } = useMemoryStore();
  const { deviceState, actions: deviceActions } = useDeviceStore();
  const telemetryItems = useAppSelector((state) => state.telemetryState.events.slice(0, 24));

  const currentDeviceOutput = useMemo(
    () => composeDeviceOutput(sheepEmotionState, sheepVisualState),
    [sheepEmotionState, sheepVisualState]
  );
  const demoColors = useMemo(
    () => getLuckyColors().map((item) => ({ colorId: item.colorId, colorName: item.colorName })),
    []
  );

  const [scriptFlow, setScriptFlow] = useState<{
    preset: DemoScenarioPreset | null;
    mode: "manual" | "semi" | "auto";
    step: number;
    running: boolean;
  }>({
    preset: null,
    mode: "manual",
    step: 0,
    running: false
  });

  const executedScriptStepRef = useRef<string | null>(null);
  const parsedQueryRef = useRef(false);
  const [presentationMode, setPresentationMode] = useState<PresentationMode>("default");
  const [investorStep, setInvestorStep] = useState(0);

  const allowLegacyTabs = uiState.demoMode && legacyModeEnabled;
  const activeTab: AppTabKey = useMemo(() => {
    if (isPrimaryTab(uiState.activeTab)) return uiState.activeTab;
    if (allowLegacyTabs && LEGACY_TABS.includes(uiState.activeTab)) return uiState.activeTab;
    return "home";
  }, [allowLegacyTabs, uiState.activeTab]);

  useEffect(() => {
    if (activeTab !== uiState.activeTab) {
      uiActions.setActiveTab(activeTab);
    }
  }, [activeTab, uiActions, uiState.activeTab]);

  const trackProductEvent = (
    eventName: TelemetryEventName,
    source: TelemetrySource,
    payload?: Record<string, string | number | boolean | null>
  ) => {
    dispatch({
      type: "PRODUCT_EVENT_TRACKED",
      nowIso: new Date().toISOString(),
      eventName,
      source,
      payload
    });
  };

  const handleTabChange = useCallback(
    (tab: AppTabKey) => {
      const canOpen = isPrimaryTab(tab) || (allowLegacyTabs && LEGACY_TABS.includes(tab));
      if (!canOpen) {
        uiActions.setActiveTab("home");
        return;
      }
      if (tab === activeTab) return;
      trackProductEvent("tab_converted", "app_ui", {
        fromTab: activeTab,
        toTab: tab
      });
      uiActions.setActiveTab(tab);
      if (tab === "interaction") {
        sheepActions.captureInteractionContext(activeTab);
      }
    },
    [activeTab, allowLegacyTabs, sheepActions, uiActions]
  );

  const handleDrawDailyColor = useCallback(() => {
    trackProductEvent("daily_color_drawn", "app_ui", {
      fromTab: activeTab,
      scene: activeScene
    });
    sheepActions.drawDailyColor();
  }, [activeScene, activeTab, sheepActions]);

  const handleInteraction = useCallback(
    (interaction: DeviceInputEventType) => {
      sheepActions.triggerInteraction(interaction);
    },
    [sheepActions]
  );

  const handleChatSend = useCallback(
    (text: string) => {
      sheepActions.sendChat(text);
    },
    [sheepActions]
  );

  const handleVoiceMock = useCallback(() => {
    uiActions.setVoiceRecording(true);
    sheepActions.sendVoiceMock("今天想让你继续陪我走一会。");
    window.setTimeout(() => uiActions.setVoiceRecording(false), 260);
  }, [sheepActions, uiActions]);

  const handleStartBedtime = useCallback(() => {
    sheepActions.startBedtimeMode();
  }, [sheepActions]);

  const handleSceneChange = useCallback(
    (scene: InteractionScene) => {
      sheepActions.setInteractionScene(scene);
      const sceneMode = scene === "bedtime" ? "bedtime" : scene === "mood" ? "night" : "daytime";
      uiActions.setSceneMode(sceneMode);
    },
    [sheepActions, uiActions]
  );

  const handleCloseTaskReward = () => {
    growthActions.clearTaskRewards();
  };

  const handleGoDevice = useCallback(() => {
    if (allowLegacyTabs) {
      handleTabChange("device");
      return;
    }
    handleTabChange("interaction");
  }, [allowLegacyTabs, handleTabChange]);

  const prepareScriptMode = useCallback(
    (preset: DemoScenarioPreset, syncUrl = true) => {
      setPresentationMode("video");
      setInvestorStep(0);
      uiActions.setDemoMode(true);
      uiActions.setQuietUI(true);
      uiActions.setActiveTab("home");
      sheepActions.applyDemoPreset(preset, SCRIPT_PRESET_OPTIONS[preset]);
      executedScriptStepRef.current = null;
      if (syncUrl) {
        syncQuery({ mode: "video", script: preset, demo: "1", quiet: "1", legacy: null });
      }
    },
    [sheepActions, uiActions]
  );

  const runScriptStep = useCallback(
    (preset: DemoScenarioPreset, step: number) => {
      const normalizedStep = Math.max(0, Math.min(step, SCRIPT_MAX_STEP));
      const targetTab = SCRIPT_FLOW_STEPS[normalizedStep];
      uiActions.setActiveTab(targetTab);

      if (normalizedStep === 1) {
        handleDrawDailyColor();
        return;
      }

      if (normalizedStep === 2) {
        handleSceneChange(SCRIPT_SCENE_BY_PRESET[preset]);
        handleInteraction(SCRIPT_EVENT_BY_PRESET[preset]);
        handleChatSend(SCRIPT_LINE_BY_PRESET[preset]);
      }
    },
    [handleChatSend, handleDrawDailyColor, handleInteraction, handleSceneChange, uiActions]
  );

  const handleStartVideoScript = useCallback(
    (preset: DemoScenarioPreset, syncUrl = true) => {
      prepareScriptMode(preset, syncUrl);
      setScriptFlow({
        preset,
        mode: "auto",
        step: 0,
        running: true
      });
      trackProductEvent("demo_script_triggered", "demo_mode", { preset, mode: "auto" });
    },
    [prepareScriptMode]
  );

  const handleStartScriptFlow = useCallback(
    (preset: DemoScenarioPreset, mode: "semi" | "auto", syncUrl = true) => {
      prepareScriptMode(preset, syncUrl);
      setScriptFlow({
        preset,
        mode,
        step: 0,
        running: true
      });
      trackProductEvent("demo_script_triggered", "demo_mode", { preset, mode });
    },
    [prepareScriptMode]
  );

  const handleAdvanceScriptFlow = useCallback(() => {
    setScriptFlow((prev) => {
      if (prev.mode !== "semi" || !prev.running) return prev;
      const nextStep = Math.min(prev.step + 1, SCRIPT_MAX_STEP);
      if (nextStep >= SCRIPT_MAX_STEP) {
        return { ...prev, step: nextStep, running: false, mode: "manual" };
      }
      return { ...prev, step: nextStep };
    });
  }, []);

  const handleStopScriptFlow = useCallback(() => {
    setScriptFlow((prev) => ({
      preset: prev.preset,
      mode: "manual",
      step: prev.step,
      running: false
    }));
  }, []);

  const runInvestorStep = useCallback(
    (step: number) => {
      const maxStep = INVESTOR_PRESENTATION_PATH.length - 1;
      const normalizedStep = Math.max(0, Math.min(step, maxStep));
      setInvestorStep(normalizedStep);
      uiActions.setActiveTab(SCRIPT_FLOW_STEPS[normalizedStep]);
      if (normalizedStep === 1) {
        handleDrawDailyColor();
        return;
      }
      if (normalizedStep === 2) {
        handleSceneChange("chat");
        handleInteraction("touch_head");
        handleChatSend("今天第一次见面，我们慢慢来。");
      }
    },
    [handleChatSend, handleDrawDailyColor, handleInteraction, handleSceneChange, uiActions]
  );

  const handleStartInvestorMode = useCallback(
    (syncUrl = true) => {
      setPresentationMode("investor");
      setInvestorStep(0);
      setScriptFlow({
        preset: null,
        mode: "manual",
        step: 0,
        running: false
      });
      executedScriptStepRef.current = null;
      uiActions.setDemoMode(true);
      uiActions.setQuietUI(false);
      uiActions.setActiveTab("home");
      sheepActions.applyDemoPreset("today_first_meet", SCRIPT_PRESET_OPTIONS.today_first_meet);
      if (syncUrl) {
        syncQuery({ mode: "investor", script: null, demo: "1", quiet: "0", legacy: null });
      }
    },
    [sheepActions, uiActions]
  );

  const handleInvestorNext = useCallback(() => {
    const next = Math.min(investorStep + 1, INVESTOR_PRESENTATION_PATH.length - 1);
    runInvestorStep(next);
  }, [investorStep, runInvestorStep]);

  const handleExitPresentationMode = useCallback(
    (syncUrl = true) => {
      setPresentationMode("default");
      setInvestorStep(0);
      setScriptFlow({
        preset: null,
        mode: "manual",
        step: 0,
        running: false
      });
      executedScriptStepRef.current = null;
      uiActions.setDemoMode(false);
      uiActions.setQuietUI(false);
      if (syncUrl) {
        syncQuery({ mode: null, script: null, quiet: null, demo: null });
      }
    },
    [uiActions]
  );

  const handleEnterRecordingMode = useCallback(() => {
    setPresentationMode("video");
    setInvestorStep(0);
    uiActions.setDemoMode(true);
    uiActions.setQuietUI(true);
    uiActions.setActiveTab("home");
    syncQuery({ mode: "video", script: null, demo: "1", quiet: "1", legacy: null });
  }, [uiActions]);

  const handleExitRecordingMode = useCallback(() => {
    setPresentationMode("default");
    setInvestorStep(0);
    setScriptFlow((prev) => ({
      ...prev,
      mode: "manual",
      running: false
    }));
    uiActions.setDemoMode(true);
    uiActions.setQuietUI(false);
    syncQuery({ mode: null, script: null, quiet: "0", demo: "1" });
  }, [uiActions]);

  const handleDemoSetColor = (colorId: string) => {
    if (!colorId) return;
    sheepActions.setDailyColorForDemo(colorId);
  };

  const handleDemoBoostGrowth = () => {
    sheepActions.boostGrowthForDemo();
  };

  const handleDemoApplyPreset = (preset: DemoScenarioPreset, options: DemoPresetOptions) => {
    sheepActions.applyDemoPreset(preset, options);
    setScriptFlow((prev) => ({ ...prev, preset }));
  };

  const handleDemoTriggerMockMilestone = (
    type: "reservation_triggered" | "campaign_triggered",
    payload: Partial<MilestoneMockPayload>
  ) => {
    sheepActions.triggerMilestoneMock(type, payload);
  };

  const handleDemoReset = () => {
    sheepActions.resetDemoState();
    setPresentationMode("default");
    setInvestorStep(0);
    setScriptFlow({
      preset: null,
      mode: "manual",
      step: 0,
      running: false
    });
    uiActions.setActiveTab("home");
    syncQuery({ mode: null, script: null, quiet: null });
  };

  useEffect(() => {
    sheepActions.bootstrapToday();
    // bootstrap on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      sheepActions.tickEmotion();
    }, 30000);
    return () => window.clearInterval(timer);
    // keep one interval lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scriptFlow.running || !scriptFlow.preset) return;
    const key = `${scriptFlow.preset}-${scriptFlow.step}`;
    if (executedScriptStepRef.current === key) return;
    executedScriptStepRef.current = key;
    runScriptStep(scriptFlow.preset, scriptFlow.step);
  }, [runScriptStep, scriptFlow.preset, scriptFlow.running, scriptFlow.step]);

  useEffect(() => {
    if (!scriptFlow.running || scriptFlow.mode !== "auto") return;
    if (scriptFlow.step >= SCRIPT_MAX_STEP) {
      setScriptFlow((prev) => ({ ...prev, running: false, mode: "manual" }));
      return;
    }
    const timer = window.setTimeout(() => {
      setScriptFlow((prev) => {
        if (!prev.running || prev.mode !== "auto") return prev;
        const nextStep = Math.min(prev.step + 1, SCRIPT_MAX_STEP);
        if (nextStep >= SCRIPT_MAX_STEP) {
          return { ...prev, step: nextStep, running: false, mode: "manual" };
        }
        return { ...prev, step: nextStep };
      });
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [scriptFlow.mode, scriptFlow.running, scriptFlow.step]);

  useEffect(() => {
    if (presentationMode !== "video" || !uiState.demoMode) return;

    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        handleExitRecordingMode();
        return;
      }

      if (event.key === " " && scriptFlow.mode === "semi" && scriptFlow.running) {
        event.preventDefault();
        handleAdvanceScriptFlow();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [
    handleAdvanceScriptFlow,
    handleExitRecordingMode,
    presentationMode,
    scriptFlow.mode,
    scriptFlow.running,
    uiState.demoMode
  ]);

  useEffect(() => {
    if (parsedQueryRef.current) return;
    parsedQueryRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");

    if (mode === "demo") {
      uiActions.setDemoMode(true);
    } else if (mode === "external") {
      uiActions.setDemoMode(false);
    }

    if (params.get("demo") === "1") {
      uiActions.setDemoMode(true);
    }
    if (params.get("demo") === "0") {
      uiActions.setDemoMode(false);
    }
    if (params.get("quiet") === "1") {
      uiActions.setQuietUI(true);
    }
    setLegacyModeEnabled(params.get("legacy") === "1");

    const scriptParam = params.get("script");
    if (mode === "investor") {
      handleStartInvestorMode(false);
      return;
    }
    if (mode === "video") {
      const preset = isDemoScenarioPreset(scriptParam) ? scriptParam : "today_first_meet";
      handleStartScriptFlow(preset, "auto", false);
      return;
    }

    if (isDemoScenarioPreset(scriptParam)) {
      handleStartVideoScript(scriptParam, false);
    }
  }, [handleStartInvestorMode, handleStartScriptFlow, handleStartVideoScript, uiActions]);

  useEffect(() => {
    if (!deviceState.connected) return;
    if (deviceState.syncState !== "pending") return;

    const queuedCommand = deviceState.pendingCommands[0];
    const commandId = queuedCommand?.commandId ?? nextCommandId();
    const output = queuedCommand?.output ?? currentDeviceOutput;

    if (!queuedCommand) {
      deviceActions.enqueueCommand(commandId, output);
    }

    bridge
      .sendOutput(output)
      .then(() => {
        deviceActions.markOutputSynced(output);
        deviceActions.flushCommand(commandId);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "设备状态同步失败";
        deviceActions.markSyncFailed(message);
      });
  }, [
    bridge,
    currentDeviceOutput,
    deviceActions,
    deviceState.connected,
    deviceState.pendingCommands,
    deviceState.syncState
  ]);

  const theme = APP_THEME[dailyColorState.atmosphereTheme];
  const activeSceneProfile = sceneProfileOf(activeScene);
  const isHomeTab = activeTab === "home";
  const isInvestorMode = presentationMode === "investor";
  const isVideoMode = presentationMode === "video";
  const activeInvestorNode =
    INVESTOR_PRESENTATION_PATH[investorStep] ?? INVESTOR_PRESENTATION_PATH[INVESTOR_PRESENTATION_PATH.length - 1];
  const scriptStepLabel = SCRIPT_FLOW_STEPS[Math.max(0, Math.min(scriptFlow.step, SCRIPT_FLOW_STEPS.length - 1))];
  const scriptTitle = scriptFlow.preset ? VIDEO_SCRIPT_CONFIG[scriptFlow.preset].title : "未选择脚本";

  return (
    <div className={`app-shell ${theme.className} scene-shell ${activeSceneProfile.atmosphereClass}${isVideoMode ? " recording-shell" : ""}`}>
      {uiState.quietUI ? null : (
        <header className={isHomeTab ? "app-header app-header-compact" : "app-header"}>
          <div className="app-header-grid">
            <div>
              <p className="kicker">小羊卷数字生命体</p>
              <h1>先把陪伴做成真实体验，再走向实体版</h1>
              <p className="subtitle">今日幸运色 {theme.name} · 当前陪伴对象 {profile.nickname}</p>
            </div>
          </div>
        </header>
      )}

      {uiState.quietUI && uiState.demoMode ? (
        <div className="recording-mini-controls" data-testid="recording-mini-controls">
          <span>
            {scriptTitle} · 当前镜头 {scriptStepLabel}
          </span>
          {scriptFlow.mode === "semi" ? <span>Space 下一步</span> : null}
          {scriptFlow.mode === "semi" && scriptFlow.running ? (
            <button type="button" onClick={handleAdvanceScriptFlow}>下一步</button>
          ) : null}
          <span>Esc 退出录屏</span>
          <button type="button" onClick={handleExitRecordingMode}>返回演示控制台</button>
        </div>
      ) : null}

      {isInvestorMode && !uiState.quietUI ? (
        <section className="presentation-path-bar" data-testid="investor-path-bar">
          <div className="presentation-path-head">
            <p className="kicker">投资人展示模式</p>
            <p className="subtitle">
              当前节点：{activeInvestorNode.title} · {activeInvestorNode.focus} · {activeInvestorNode.durationHint}
            </p>
          </div>
          <div className="presentation-path-steps">
            {INVESTOR_PRESENTATION_PATH.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={index === investorStep ? "presentation-step active" : "presentation-step"}
                onClick={() => runInvestorStep(index)}
              >
                <b>
                  {index + 1}. {item.title}
                </b>
                <small>
                  {item.focus} · {item.durationHint}
                </small>
              </button>
            ))}
          </div>
          <div className="presentation-path-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={handleInvestorNext}
              disabled={investorStep >= INVESTOR_PRESENTATION_PATH.length - 1}
            >
              下一段
            </button>
            <button type="button" className="ghost-btn" onClick={() => runInvestorStep(0)}>
              回到开场
            </button>
            <button type="button" className="ghost-btn" onClick={() => handleExitPresentationMode(true)}>
              退出展示模式
            </button>
          </div>
        </section>
      ) : null}

      <main className="app-main tab-stage" data-active-tab={activeTab}>
        {activeTab === "home" ? (
          <HomePage
            sheepProfile={sheepProfile}
            sheepEmotionState={sheepEmotionState}
            sheepVisualState={sheepVisualState}
            dailyColorState={dailyColorState}
            bondState={bondState}
            growthState={growthState}
            memoryState={memoryState}
            activeScene={activeScene}
            surveySubmissionCount={profile.surveySubmissions.length}
            onDrawDailyColor={handleDrawDailyColor}
            onGoInteraction={() => handleTabChange("interaction")}
            onGoGrowth={() => handleTabChange("growth")}
            onGoMemory={() => handleTabChange("memory")}
            onGoValidation={() => handleTabChange("validation")}
            onTriggerQuickEvent={handleInteraction}
            onTonightCompanion={() => {
              sheepActions.startBedtimeMode();
              handleTabChange("interaction");
            }}
            onEnterInvestorMode={uiState.demoMode ? () => handleStartInvestorMode(true) : undefined}
            onEnterRecordingMode={uiState.demoMode ? handleEnterRecordingMode : undefined}
            onStartVideoScript={uiState.demoMode ? handleStartVideoScript : undefined}
            onExitPresentationMode={uiState.demoMode ? () => handleExitPresentationMode(true) : undefined}
            presentationMode={presentationMode}
            deviceState={uiState.demoMode ? deviceState : undefined}
            focusMode={isVideoMode}
            showWaitlistEntry={uiState.demoMode}
          />
        ) : null}

        {activeTab === "interaction" ? (
          <InteractionPage
            sheepEmotionState={sheepEmotionState}
            sheepVisualState={sheepVisualState}
            dailyColorName={dailyColorState.colorName}
            activeScene={activeScene}
            isVoiceRecording={uiState.isVoiceRecording}
            messages={messages}
            lastFeedback={lastFeedback}
            deviceState={deviceState}
            onSendText={handleChatSend}
            onSendVoiceMock={handleVoiceMock}
            onStartBedtime={handleStartBedtime}
            onSceneChange={handleSceneChange}
            onTriggerEvent={handleInteraction}
            onGoGrowth={() => handleTabChange("growth")}
            onGoMemory={() => handleTabChange("memory")}
            onGoValidation={() => handleTabChange("validation")}
            focusMode={isVideoMode}
            showDiagnostics={uiState.demoMode}
            showValidationEntry={uiState.demoMode}
          />
        ) : null}

        {activeTab === "growth" ? (
          <GrowthPage
            bondState={bondState}
            growthState={growthState}
            sheepEmotionState={sheepEmotionState}
            sheepVisualState={sheepVisualState}
            dailyColorState={dailyColorState}
            activeScene={activeScene}
            activeModal={uiState.activeModal}
            onCloseTaskReward={handleCloseTaskReward}
            onGoInteraction={() => handleTabChange("interaction")}
            onGoMemory={() => handleTabChange("memory")}
            onGoValidation={() => handleTabChange("validation")}
            focusMode={isVideoMode}
            showValidationEntry={uiState.demoMode}
          />
        ) : null}

        {activeTab === "memory" ? (
          <MemoryPage
            memoryState={memoryState}
            userProfile={profile}
            activeScene={activeScene}
            sheepEmotionState={sheepEmotionState}
            sheepVisualState={sheepVisualState}
            dailyColorName={dailyColorState.colorName}
            onGoDevice={handleGoDevice}
            onGoInteraction={() => handleTabChange("interaction")}
            onGoValidation={() => handleTabChange("validation")}
            onSubmitExperienceFeedback={userActions.updateExperienceFeedback}
            onRetrySurveyUpload={userActions.retrySurveyUpload}
            focusMode={isVideoMode}
            showBridgeActions={uiState.demoMode}
          />
        ) : null}

        {activeTab === "validation" ? (
          <ValidationPage
            userProfile={profile}
            activeScene={activeScene}
            dailyColorName={dailyColorState.colorName}
            sheepEmotionState={sheepEmotionState}
            sheepVisualState={sheepVisualState}
            onGoHome={() => handleTabChange("home")}
            onSubmitExperienceFeedback={userActions.updateExperienceFeedback}
            onRetrySurveyUpload={userActions.retrySurveyUpload}
            focusMode={isVideoMode}
            showOpsData={uiState.demoMode}
          />
        ) : null}

        {allowLegacyTabs &&
        (activeTab === "product" ||
          activeTab === "device" ||
          activeTab === "progress" ||
          activeTab === "story" ||
          activeTab === "assets") ? (
          <section className="page-grid">
            <article className="card">
              <h2>已切换到对外体验主链路</h2>
              <p className="muted">当前版本只保留首页、互动、成长、记忆、候补五段核心路径，便于演示与转化。</p>
              <div className="quick-actions home-quick-actions">
                <button type="button" className="primary-btn" onClick={() => handleTabChange("home")}>
                  返回首页
                </button>
                <button type="button" className="ghost-btn" onClick={() => handleTabChange("interaction")}>
                  进入互动页
                </button>
              </div>
            </article>
          </section>
        ) : null}

        {uiState.demoMode && !uiState.quietUI ? (
          <DemoModePanel
            activeScene={activeScene}
            currentColorId={dailyColorState.colorId}
            colors={demoColors}
            currentOutput={currentDeviceOutput}
            onSetColor={handleDemoSetColor}
            onSetScene={handleSceneChange}
            onTriggerEvent={handleInteraction}
            onBoostGrowth={handleDemoBoostGrowth}
            onApplyPreset={handleDemoApplyPreset}
            onStartScriptFlow={handleStartScriptFlow}
            onAdvanceScriptFlow={handleAdvanceScriptFlow}
            onStopScriptFlow={handleStopScriptFlow}
            scriptFlowPreset={scriptFlow.preset}
            scriptFlowMode={scriptFlow.mode}
            scriptFlowStep={scriptFlow.step}
            scriptFlowRunning={scriptFlow.running}
            onTriggerMockMilestone={handleDemoTriggerMockMilestone}
            telemetryItems={telemetryItems.slice(0, 8)}
            onReset={handleDemoReset}
            onOpenDevice={handleGoDevice}
            recordingMode={uiState.quietUI}
            onRecordingModeChange={(enabled) => {
              uiActions.setQuietUI(enabled);
              setPresentationMode(enabled ? "video" : "default");
            }}
            onClose={() => {
              handleStopScriptFlow();
              setPresentationMode("default");
              setInvestorStep(0);
              uiActions.setDemoMode(false);
              uiActions.setQuietUI(false);
              syncQuery({ mode: null, script: null, quiet: null, demo: null });
            }}
            initialLastAppliedPreset={scriptFlow.preset}
          />
        ) : null}
      </main>

      {uiState.quietUI || isInvestorMode ? null : <BottomTabs activeTab={activeTab} onChange={handleTabChange} />}
    </div>
  );
}
