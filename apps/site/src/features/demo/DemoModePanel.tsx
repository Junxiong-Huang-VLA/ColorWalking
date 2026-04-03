import { useMemo, useState } from "react";
import type { DeviceInputEventType, DeviceOutputState } from "@colorwalking/shared";
import type {
  DemoPresetOptions,
  DemoScenarioPreset,
  InteractionScene,
  MilestoneMockPayload,
  TelemetryEventItem
} from "../../state/types";
import { VIDEO_SCRIPT_CONFIG } from "../../content/releaseCopy";

type DemoModePanelProps = {
  activeScene: InteractionScene;
  currentColorId: string | null;
  colors: Array<{ colorId: string; colorName: string }>;
  currentOutput: DeviceOutputState;
  onSetColor: (colorId: string) => void;
  onSetScene: (scene: InteractionScene) => void;
  onTriggerEvent: (eventType: DeviceInputEventType) => void;
  onBoostGrowth: () => void;
  onApplyPreset: (preset: DemoScenarioPreset, options: DemoPresetOptions) => void;
  onStartScriptFlow: (preset: DemoScenarioPreset, mode: "semi" | "auto") => void;
  onAdvanceScriptFlow: () => void;
  onStopScriptFlow: () => void;
  scriptFlowPreset: DemoScenarioPreset | null;
  scriptFlowMode: "manual" | "semi" | "auto";
  scriptFlowStep: number;
  scriptFlowRunning: boolean;
  onTriggerMockMilestone: (
    type: "reservation_triggered" | "campaign_triggered",
    payload: Partial<MilestoneMockPayload>
  ) => void;
  telemetryItems: TelemetryEventItem[];
  onReset: () => void;
  onOpenDevice: () => void;
  onClose: () => void;
  onRecordingModeChange: (enabled: boolean) => void;
  recordingMode: boolean;
  initialLastAppliedPreset?: DemoScenarioPreset | null;
};

const SCENE_ITEMS: Array<{ key: InteractionScene; label: string }> = [
  { key: "chat", label: "聊天" },
  { key: "comfort", label: "安抚" },
  { key: "bedtime", label: "睡前" },
  { key: "mood", label: "情绪" },
  { key: "color", label: "幸运色" }
];

const EVENT_ITEMS: Array<{ key: DeviceInputEventType; label: string }> = [
  { key: "touch_head", label: "摸头" },
  { key: "touch_body", label: "轻触" },
  { key: "hug_pressure", label: "拥抱" },
  { key: "proximity_near", label: "靠近" },
  { key: "picked_up", label: "抱起" },
  { key: "laid_down", label: "放下" }
];

const SCRIPT_ORDER: DemoScenarioPreset[] = ["today_first_meet", "tonight_tired", "companionship_growth"];
const FLOW_STEP_LABELS = ["首页", "抽色", "互动", "成长", "记忆", "候补"];

const INTENSITY_OPTIONS: Array<{ key: DemoPresetOptions["intensity"]; label: string }> = [
  { key: "light", label: "light" },
  { key: "medium", label: "medium" },
  { key: "strong", label: "strong" }
];

const TIME_OPTIONS: Array<{ key: DemoPresetOptions["timeWindow"]; label: string }> = [
  { key: "day", label: "day" },
  { key: "night", label: "night" },
  { key: "bedtime", label: "bedtime" }
];

const DEVICE_OPTIONS: Array<{ key: DemoPresetOptions["deviceState"]; label: string }> = [
  { key: "ok", label: "ok" },
  { key: "degraded", label: "degraded" },
  { key: "offline", label: "offline" },
  { key: "recovering", label: "recovering" }
];

const BOND_OPTIONS: Array<{ key: DemoPresetOptions["bondStage"]; label: string }> = [
  { key: "intro", label: "intro" },
  { key: "familiar", label: "familiar" },
  { key: "close", label: "close" }
];

const COLOR_OPTIONS: Array<{ key: DemoPresetOptions["colorCategory"]; label: string }> = [
  { key: "calm", label: "calm" },
  { key: "soft", label: "soft" },
  { key: "energy", label: "energy" },
  { key: "hope", label: "hope" },
  { key: "sleepy", label: "sleepy" }
];

function presetLabel(preset: DemoScenarioPreset): string {
  return VIDEO_SCRIPT_CONFIG[preset].title;
}

export function DemoModePanel(props: DemoModePanelProps) {
  const [options, setOptions] = useState<DemoPresetOptions>({
    intensity: "light",
    timeWindow: "day",
    deviceState: "ok",
    bondStage: "intro",
    colorCategory: "soft"
  });
  const [lastAppliedPreset, setLastAppliedPreset] = useState<DemoScenarioPreset | null>(
    props.initialLastAppliedPreset ?? null
  );
  const [mockSources, setMockSources] = useState({
    reservation: true,
    campaign: true
  });
  const [mockPayload, setMockPayload] = useState<MilestoneMockPayload>({
    activityId: "demo_activity_001",
    channel: "internal",
    batchId: "batch_a1"
  });

  const activePreset = props.scriptFlowPreset ?? lastAppliedPreset ?? SCRIPT_ORDER[0];
  const optionSummary = useMemo(
    () =>
      `${options.intensity} / ${options.timeWindow} / ${options.deviceState} / ${options.bondStage} / ${options.colorCategory}`,
    [options]
  );
  const telemetryPreview = props.telemetryItems.slice(0, 6);

  return (
    <article className="card demo-panel-card" data-testid="demo-mode-panel">
      <div className="demo-panel-head">
        <h2>Demo Mode（演示控制台）</h2>
        <button type="button" onClick={props.onClose}>
          退出 Demo
        </button>
      </div>
      <p className="muted">用于演示“幸运色 → 互动 → 成长 → 记忆 → 候补意向”的完整主链路。</p>

      <div className="state-chip-row" style={{ marginTop: 8 }}>
        <button
          type="button"
          className={props.recordingMode ? "demo-chip active" : "demo-chip"}
          onClick={() => props.onRecordingModeChange(!props.recordingMode)}
        >
          录屏模式 {props.recordingMode ? "on" : "off"}
        </button>
        <span className="demo-chip active">当前脚本：{presetLabel(activePreset)}</span>
        <span className="demo-chip">推进：{FLOW_STEP_LABELS[Math.max(0, Math.min(props.scriptFlowStep, FLOW_STEP_LABELS.length - 1))]}</span>
      </div>

      <div className="demo-row">
        <span>固定演示脚本</span>
        <div className="demo-preset-grid">
          {SCRIPT_ORDER.map((preset) => {
            const script = VIDEO_SCRIPT_CONFIG[preset];
            return (
              <button
                key={preset}
                type="button"
                className="demo-preset-item"
                onClick={() => {
                  props.onApplyPreset(preset, options);
                  setLastAppliedPreset(preset);
                }}
                data-testid={`demo-preset-${preset}`}
              >
                <b>{script.title}</b>
                <small>{script.oneLiner}</small>
              </button>
            );
          })}
        </div>
        {lastAppliedPreset ? (
          <p className="muted" data-testid="demo-last-applied">
            最近应用：{presetLabel(lastAppliedPreset)} · {optionSummary}
          </p>
        ) : null}
      </div>

      <div className="demo-row">
        <span>演示推进</span>
        <div className="state-chip-row">
          <button type="button" className="demo-chip" onClick={() => props.onStartScriptFlow(activePreset, "semi")}>半自动推进</button>
          <button type="button" className="demo-chip" onClick={() => props.onStartScriptFlow(activePreset, "auto")}>自动推进</button>
          {props.scriptFlowMode === "semi" ? (
            <button type="button" className="demo-chip" onClick={props.onAdvanceScriptFlow} disabled={!props.scriptFlowRunning}>
              推进下一步
            </button>
          ) : null}
          {(props.scriptFlowRunning || props.scriptFlowMode !== "manual") ? (
            <button type="button" className="demo-chip" onClick={props.onStopScriptFlow}>
              停止推进
            </button>
          ) : null}
        </div>
        <p className="muted">{props.scriptFlowRunning ? `正在${props.scriptFlowMode === "auto" ? "自动" : "半自动"}推进` : "手动模式"}</p>
      </div>

      <div className="demo-row demo-script-guide">
        <span>录制脚本说明</span>
        <div className="demo-script-grid">
          {SCRIPT_ORDER.map((preset) => {
            const script = VIDEO_SCRIPT_CONFIG[preset];
            return (
              <article key={`guide-${preset}`} className="demo-script-item">
                <h4>{script.title}</h4>
                <p><b>建议时长：</b>{script.durationHint}</p>
                <p><b>固定初始：</b>{script.initialState.scene} / {script.initialState.colorCategory} / {script.initialState.bondStage}</p>
                <p><b>镜头顺序：</b>{script.shotOrder.join(" → ")}</p>
                <p><b>互动提示：</b>{script.interactionCue}</p>
              </article>
            );
          })}
        </div>
      </div>

      {props.recordingMode ? null : (
        <>
          <div className="demo-row" data-testid="demo-param-controls">
            <span>脚本参数</span>
            <div className="demo-param-grid">
              <label>
                <small>强度</small>
                <select
                  value={options.intensity}
                  onChange={(event) =>
                    setOptions((prev) => ({ ...prev, intensity: event.target.value as DemoPresetOptions["intensity"] }))
                  }
                >
                  {INTENSITY_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <small>时段</small>
                <select
                  value={options.timeWindow}
                  onChange={(event) =>
                    setOptions((prev) => ({ ...prev, timeWindow: event.target.value as DemoPresetOptions["timeWindow"] }))
                  }
                >
                  {TIME_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <small>设备</small>
                <select
                  value={options.deviceState}
                  onChange={(event) =>
                    setOptions((prev) => ({ ...prev, deviceState: event.target.value as DemoPresetOptions["deviceState"] }))
                  }
                >
                  {DEVICE_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <small>关系</small>
                <select
                  value={options.bondStage}
                  onChange={(event) =>
                    setOptions((prev) => ({ ...prev, bondStage: event.target.value as DemoPresetOptions["bondStage"] }))
                  }
                >
                  {BOND_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <small>幸运色</small>
                <select
                  value={options.colorCategory}
                  onChange={(event) =>
                    setOptions((prev) => ({ ...prev, colorCategory: event.target.value as DemoPresetOptions["colorCategory"] }))
                  }
                >
                  {COLOR_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="muted" data-testid="demo-param-summary">当前参数：{optionSummary}</p>
          </div>

          <div className="demo-row" data-testid="demo-mock-source-controls">
            <span>候补事件 mock</span>
            <div className="demo-mock-meta-grid" data-testid="demo-mock-payload-controls">
              <label>
                <small>活动 ID</small>
                <input
                  data-testid="demo-mock-activity-input"
                  value={mockPayload.activityId ?? ""}
                  onChange={(event) => setMockPayload((prev) => ({ ...prev, activityId: event.target.value || null }))}
                />
              </label>
              <label>
                <small>渠道</small>
                <input
                  value={mockPayload.channel ?? ""}
                  onChange={(event) => setMockPayload((prev) => ({ ...prev, channel: event.target.value || null }))}
                />
              </label>
              <label>
                <small>批次</small>
                <input
                  value={mockPayload.batchId ?? ""}
                  onChange={(event) => setMockPayload((prev) => ({ ...prev, batchId: event.target.value || null }))}
                />
              </label>
            </div>
            <div className="state-chip-row">
              <button
                type="button"
                className={mockSources.reservation ? "demo-chip active" : "demo-chip"}
                onClick={() => setMockSources((prev) => ({ ...prev, reservation: !prev.reservation }))}
              >
                reservation {mockSources.reservation ? "on" : "off"}
              </button>
              <button
                type="button"
                className={mockSources.campaign ? "demo-chip active" : "demo-chip"}
                onClick={() => setMockSources((prev) => ({ ...prev, campaign: !prev.campaign }))}
              >
                campaign {mockSources.campaign ? "on" : "off"}
              </button>
            </div>
            <div className="state-chip-row">
              <button
                type="button"
                className="demo-chip"
                disabled={!mockSources.reservation}
                onClick={() => props.onTriggerMockMilestone("reservation_triggered", mockPayload)}
              >
                触发预约占位
              </button>
              <button
                type="button"
                className="demo-chip"
                disabled={!mockSources.campaign}
                onClick={() => props.onTriggerMockMilestone("campaign_triggered", mockPayload)}
              >
                触发活动占位
              </button>
            </div>
          </div>

          <div className="demo-row">
            <label>
              <span>切换今日幸运色</span>
              <select value={props.currentColorId ?? ""} onChange={(event) => props.onSetColor(event.target.value)}>
                <option value="" disabled>选择幸运色</option>
                {props.colors.map((item) => (
                  <option key={item.colorId} value={item.colorId}>{item.colorName}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="demo-row">
            <span>切换场景</span>
            <div className="state-chip-row">
              {SCENE_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={props.activeScene === item.key ? "demo-chip active" : "demo-chip"}
                  onClick={() => props.onSetScene(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="demo-row">
            <span>触发互动事件</span>
            <div className="state-chip-row">
              {EVENT_ITEMS.map((item) => (
                <button key={item.key} type="button" className="demo-chip" onClick={() => props.onTriggerEvent(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="demo-row demo-actions">
        <button type="button" className="primary-btn" onClick={props.onBoostGrowth}>模拟关系增长</button>
        <button type="button" onClick={props.onOpenDevice}>打开设备页</button>
        <button type="button" onClick={props.onReset}>重置 Demo 状态</button>
      </div>

      {props.recordingMode ? null : (
        <>
          <div className="demo-row">
            <span>当前设备输出快照</span>
            <pre className="json-box">{JSON.stringify(props.currentOutput, null, 2)}</pre>
          </div>

          <div className="demo-row" data-testid="demo-telemetry-preview">
            <span>最近 telemetry 预览</span>
            {telemetryPreview.length ? (
              <ul className="demo-telemetry-list">
                {telemetryPreview.map((item) => (
                  <li key={item.id} className="demo-telemetry-item" data-testid="demo-telemetry-item">
                    <b>{item.eventType}</b>
                    <small>{item.status}</small>
                    <small>{item.source}</small>
                    <small>{new Date(item.at).toLocaleTimeString()}</small>
                    {item.error ? <p>{item.error}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">暂无 telemetry 数据</p>
            )}
          </div>
        </>
      )}
    </article>
  );
}
