import type { DeviceInputEventType, DeviceOutputState } from "@colorwalking/shared";
import type {
  AppTabKey,
  CompanionEventType,
  DemoPresetOptions,
  DemoScenarioPreset,
  DeviceSensorStatus,
  InteractionInputMode,
  InteractionScene,
  MilestoneMockPayload,
  SceneMode,
  SharedMilestoneType,
  TelemetryEventName,
  TelemetrySource,
  UIState,
  UserProfileState
} from "../state/types";

export type AppEvent =
  | { type: "APP_BOOTSTRAP"; nowIso: string; dayKey: string }
  | { type: "TAB_CHANGED"; tab: AppTabKey }
  | { type: "UI_MODAL_CHANGED"; modal: UIState["activeModal"] }
  | { type: "UI_RECORDING_CHANGED"; recording: boolean }
  | { type: "UI_DEBUG_PANEL_CHANGED"; visible: boolean }
  | { type: "UI_QUIET_MODE_CHANGED"; quiet: boolean }
  | { type: "UI_SCENE_MODE_CHANGED"; mode: SceneMode }
  | { type: "UI_DEMO_MODE_CHANGED"; enabled: boolean }
  | {
      type: "PRODUCT_EVENT_TRACKED";
      nowIso: string;
      eventName: TelemetryEventName;
      source: TelemetrySource;
      status?: "info" | "started" | "retrying" | "success" | "failed" | "permanent_failed";
      payload?: Record<string, string | number | boolean | null>;
    }
  | { type: "INTERACTION_SCENE_CHANGED"; nowIso: string; scene: InteractionScene }
  | { type: "INTERACTION_CONTEXT_CAPTURED"; nowIso: string; fromTab: AppTabKey }
  | { type: "USER_PROFILE_UPDATED"; patch: Partial<UserProfileState> }
  | { type: "USER_SURVEY_UPLOAD_STARTED"; submissionId: string; nowIso: string }
  | { type: "USER_SURVEY_UPLOAD_SUCCEEDED"; submissionId: string; nowIso: string }
  | {
      type: "USER_SURVEY_UPLOAD_FAILED";
      submissionId: string;
      nowIso: string;
      error: string;
      nextRetryAt: string | null;
      permanent: boolean;
    }
  | { type: "USER_INPUT_MODE_CHANGED"; mode: InteractionInputMode }
  | {
      type: "MILESTONE_PLACEHOLDER_TRIGGERED";
      nowIso: string;
      dayKey: string;
      milestoneId: string;
      milestoneType: SharedMilestoneType;
      title: string;
      desc: string;
      scene?: InteractionScene;
      meta?: MilestoneMockPayload;
    }
  | { type: "DAILY_COLOR_DRAWN"; nowIso: string; dayKey: string }
  | { type: "DEMO_DAILY_COLOR_SET"; nowIso: string; dayKey: string; colorId: string }
  | { type: "DEMO_GROWTH_BOOST"; nowIso: string }
  | { type: "DEMO_PRESET_APPLIED"; nowIso: string; dayKey: string; preset: DemoScenarioPreset; options?: DemoPresetOptions }
  | { type: "DEMO_STATE_RESET"; nowIso: string; dayKey: string }
  | { type: "INTERACTION_TRIGGERED"; nowIso: string; interaction: DeviceInputEventType }
  | { type: "BEDTIME_MODE_STARTED"; nowIso: string }
  | { type: "CHAT_SENT"; nowIso: string; text: string }
  | { type: "VOICE_INTERACTION"; nowIso: string; transcript: string }
  | { type: "EMOTION_TICK"; nowIso: string }
  | { type: "COMPANION_EVENT_TRIGGERED"; nowIso: string; eventType: CompanionEventType }
  | { type: "GROWTH_TASK_REWARDS_CLEARED" }
  | { type: "DEVICE_CONNECTION_CHANGED"; nowIso: string; connected: boolean }
  | { type: "DEVICE_STATUS_SYNCED"; nowIso: string; battery: number | null; firmware: string | null }
  | { type: "DEVICE_SYNC_MODE_CHANGED"; mode: "app_master" | "device_follow" }
  | { type: "DEVICE_SYNC_RETRY_REQUESTED"; nowIso: string }
  | { type: "DEVICE_PENDING_COMMANDS_CLEARED"; nowIso: string }
  | { type: "DEVICE_COMMAND_ENQUEUED"; nowIso: string; commandId: string; output: DeviceOutputState }
  | { type: "DEVICE_COMMAND_FLUSHED"; nowIso: string; commandId: string }
  | { type: "DEVICE_OUTPUT_SYNC_FAILED"; nowIso: string; error: string }
  | { type: "DEVICE_SENSOR_TESTED"; nowIso: string; sensor: DeviceInputEventType; status: DeviceSensorStatus }
  | { type: "DEVICE_OUTPUT_SYNCED"; nowIso: string; output: DeviceOutputState }
  | { type: "COLOR_CALIBRATED"; nowIso: string; eyeSoftness: number };
