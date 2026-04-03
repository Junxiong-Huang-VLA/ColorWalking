import type { DeviceInputEventType, DeviceOutputState, EyeState, MotionTemplate, VoiceStyle } from "@colorwalking/shared";

export type AppTabKey =
  | "home"
  | "product"
  | "interaction"
  | "growth"
  | "memory"
  | "device"
  | "validation"
  | "progress"
  | "story"
  | "assets";

export type SheepEmotion = "calm" | "soft" | "happy" | "sleepy" | "shy" | "sad";
export type SheepExpression = "idle" | "blink" | "smile" | "rest";
export type SheepMotion = MotionTemplate;
export type EmotionSource =
  | "daily_color_drawn"
  | "touch_head"
  | "touch_body"
  | "hug_pressure"
  | "proximity_near"
  | "picked_up"
  | "laid_down"
  | "bedtime_mode_started"
  | "chat_started"
  | "rollback";

export type CompanionEventType = Exclude<EmotionSource, "rollback">;
export type DeviceSensorStatus = "ok" | "unknown" | "error";
export type InteractionInputMode = "text" | "voice";
export type SceneMode = "auto" | "daytime" | "night" | "bedtime";
export type InteractionScene = "chat" | "comfort" | "bedtime" | "mood" | "color";
export type DemoScenarioPreset = "today_first_meet" | "tonight_tired" | "companionship_growth";
export type DemoPresetIntensity = "light" | "medium" | "strong";
export type DemoPresetTimeWindow = "day" | "night" | "bedtime";
export type DemoPresetDeviceState = "ok" | "degraded" | "offline" | "recovering";
export type DemoPresetBondStage = "intro" | "familiar" | "close";
export type DemoPresetColorCategory = "calm" | "soft" | "energy" | "hope" | "sleepy";
export type TelemetryExportFormat = "json" | "csv";
export interface MilestoneMockPayload {
  activityId: string | null;
  channel: string | null;
  batchId: string | null;
}
export interface DemoRecordingConfig {
  hideDebugNoise: boolean;
  fixedColorId: string | null;
  fixedScene: InteractionScene;
  fixedBondLevel: number;
  fixedDeviceState: DemoPresetDeviceState;
}
export interface DemoPresetOptions {
  intensity: DemoPresetIntensity;
  timeWindow: DemoPresetTimeWindow;
  deviceState: DemoPresetDeviceState;
  bondStage: DemoPresetBondStage;
  colorCategory: DemoPresetColorCategory;
}
export type SharedMomentCategory = "milestone" | "first_time" | "streak" | "loop";
export type SharedMilestoneType =
  | "bond_level"
  | "first_draw"
  | "first_bedtime"
  | "streak"
  | "loop_complete"
  | "demo_boost"
  | "scene_switch"
  | "reservation_triggered"
  | "campaign_triggered";
export type MilestoneDedupeScope = "global" | "day" | "day_scene";
export type MilestoneGenerationRule =
  | "once_ever"
  | "once_per_day"
  | "once_per_day_per_scene"
  | "by_milestone_id";
export type ExperienceSurveyUploadStatus =
  | "saved_local"
  | "upload_pending"
  | "upload_failed"
  | "upload_permanent_failed"
  | "upload_success";

export interface ExperienceFeedbackState {
  wantsPhysical: "yes" | "no" | "unsure" | null;
  favoriteScene: InteractionScene | null;
  favoriteColorExperience: string | null;
  joinWaitlist: "yes" | "no" | null;
  contact: string | null;
  continueUsing: "yes" | "no" | "maybe" | null;
  updatedAt: string | null;
}

export interface ExperienceSurveyPayload {
  wantsPhysical: "yes" | "no" | "unsure" | null;
  favoriteScene: InteractionScene | null;
  favoriteColorExperience: string | null;
  joinWaitlist: "yes" | "no" | null;
  contact: string | null;
}

export interface ExperienceSurveySubmission {
  id: string;
  createdAt: string;
  source: "experience_feedback_card" | "demo_mode" | "milestone";
  status: ExperienceSurveyUploadStatus;
  attemptCount: number;
  lastAttemptAt: string | null;
  uploadedAt: string | null;
  nextRetryAt: string | null;
  permanentFailedAt: string | null;
  lastError: string | null;
  payload: ExperienceSurveyPayload;
}

export interface SharedMomentItem {
  id: string;
  title: string;
  desc: string;
  dayKey: string;
  at: string;
  key?: string;
  milestoneId?: string;
  milestoneType?: SharedMilestoneType;
  scene?: InteractionScene;
  category?: SharedMomentCategory;
}

export interface InteractionSummaryItem {
  dayKey: string;
  summary: string;
  interactionCount: number;
  bedtimeCount: number;
  lastScene: InteractionScene;
  updatedAt: string;
}

export interface UserProfileState {
  userId: string;
  nickname: string;
  timezone: string;
  createdAt: string;
  preferredInputMode: InteractionInputMode;
  gentleModeEnabled: boolean;
  experienceFeedback: ExperienceFeedbackState;
  surveySubmissions: ExperienceSurveySubmission[];
}

export interface SheepProfileState {
  name: string;
  title: string;
  origin: string;
  greeting: string;
}

export interface LuckyColorMoodBias {
  baseEmotion: SheepEmotion;
  levelBias: number;
  stabilityBias: number;
}

export interface LuckyColorItem {
  colorId: string;
  colorName: string;
  hex: string;
  softHex: string;
  glowHex: string;
  category: string;
  keywords: string[];
  message: string;
  moodBias: LuckyColorMoodBias;
}

export interface DailyColorHistoryItem {
  dayKey: string;
  colorId: string;
  colorName: string;
  hex: string;
  softHex: string;
  glowHex: string;
  category: string;
  drawnAt: string;
}

export interface DailyColorState {
  dayKey: string;
  colorId: string | null;
  colorName: string;
  colorHex: string;
  softHex: string;
  glowHex: string;
  category: string;
  keywords: string[];
  message: string;
  moodBias: LuckyColorMoodBias;
  eyeSoftness: number;
  syncStatus: "idle" | "synced" | "pending_device";
  atmosphereTheme: "moon_warm" | "cloud_cool" | "mist_pastel";
  drawnAt: string | null;
  history: DailyColorHistoryItem[];
}

export interface SheepEmotionState {
  emotion: SheepEmotion;
  emotionLevel: number;
  emotionSource: EmotionSource;
  emotionStability: number;
  baseEmotion: SheepEmotion;
  baseLevel: number;
  updatedAt: string;
  lastEventAt: string | null;
  trend: Array<{
    at: string;
    emotion: SheepEmotion;
    level: number;
    source: EmotionSource;
  }>;
}

export interface SheepVisualState {
  eyeState: EyeState;
  eyeColorHex: string;
  scarfColorHex: string;
  expression: SheepExpression;
  motionTemplate: SheepMotion;
  voiceStyle: VoiceStyle;
  statusText: string;
}

export interface BondState {
  level: number;
  bondPoints: number;
  streakDays: number;
  todayInteractCount: number;
  lastInteractAt: string;
  lastCheckInDayKey: string;
}

export interface GrowthLineState {
  level: number;
  xp: number;
  unlocked: string[];
}

export type GrowthLineId = "color_sense" | "expression" | "companion" | "island_story";

export interface GrowthTaskRewardItem {
  taskId: string;
  at: string;
  bondPoints: number;
  lineXp: Partial<Record<GrowthLineId, number>>;
  itemReward?: string;
}

export interface GrowthState {
  colorSense: GrowthLineState;
  expression: GrowthLineState;
  companion: GrowthLineState;
  islandStory: GrowthLineState;
  taskDayKey: string;
  eventCounter: Partial<Record<CompanionEventType, number>>;
  completedTaskIds: string[];
  unlockedNodeIds: string[];
  taskRewards: GrowthTaskRewardItem[];
}

export interface MemoryItem {
  id: string;
  type: "preference" | "moment";
  text: string;
  at: string;
}

export interface TimelineItem {
  id: string;
  event: string;
  at: string;
}

export interface ColorCalendarItem {
  dayKey: string;
  colorHex: string;
  colorName: string;
}

export interface MemoryCardItem {
  id: string;
  title: string;
  desc: string;
  mood: string;
  at: string;
  milestoneId?: string;
  category?: "daily" | "milestone" | "memory";
}

export interface MemoryState {
  rememberedItems: MemoryItem[];
  timeline: TimelineItem[];
  colorCalendar: ColorCalendarItem[];
  memoryCards: MemoryCardItem[];
  interactionSummaries: InteractionSummaryItem[];
  sharedMoments: SharedMomentItem[];
  bedtimeMemories: MemoryCardItem[];
}

export interface DeviceState {
  connected: boolean;
  deviceId: string | null;
  battery: number | null;
  firmware: string | null;
  syncState: "ok" | "pending" | "syncing" | "error";
  syncMode: "app_master" | "device_follow";
  pendingCommands: Array<{
    commandId: string;
    queuedAt: string;
    output: DeviceOutputState;
  }>;
  sensors: Record<DeviceInputEventType, DeviceSensorStatus>;
  lastSensorEventAt: string | null;
  lastOutput: DeviceOutputState | null;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  lastSuccessfulSync: {
    at: string;
    output: DeviceOutputState;
  } | null;
  recentEventLogs: Array<{
    id: string;
    at: string;
    level: "info" | "warn" | "error";
    type: string;
    message: string;
  }>;
}

export type TelemetrySource =
  | "survey_queue"
  | "device_bridge"
  | "app_ui"
  | "demo_mode"
  | "memory_page"
  | "waitlist_page";
export type TelemetryStatus =
  | "info"
  | "started"
  | "retrying"
  | "success"
  | "failed"
  | "permanent_failed";
export type TelemetryEventType = "survey_upload" | "device_sync" | "product_event";
export type TelemetryEventName =
  | "demo_opened"
  | "daily_color_drawn"
  | "scene_entered"
  | "entry_clicked"
  | "tab_converted"
  | "waitlist_cta_clicked"
  | "interaction_completed"
  | "memory_viewed"
  | "survey_started"
  | "survey_saved"
  | "survey_upload_success"
  | "survey_upload_failed"
  | "waitlist_join_intent"
  | "demo_script_triggered"
  | "survey_upload_started"
  | "device_sync_retry"
  | "device_sync_failed"
  | "device_sync_success";

export interface TelemetryEventItem {
  id: string;
  at: string;
  traceId: string;
  eventType: TelemetryEventType;
  eventName: TelemetryEventName;
  source: TelemetrySource;
  status: TelemetryStatus;
  error: string | null;
  payload?: Record<string, string | number | boolean | null>;
}

export interface TelemetryState {
  events: TelemetryEventItem[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "sheep";
  text: string;
  at: string;
  channel: "text" | "voice";
}

export interface InteractionState {
  messages: ChatMessage[];
  lastEventType: CompanionEventType | null;
  lastEventAt: string | null;
  activeScene: InteractionScene;
  contextSnapshot: {
    at: string;
    fromTab: AppTabKey;
    sceneMode: SceneMode;
    scene: InteractionScene;
    colorName: string;
    colorHex: string;
    emotion: SheepEmotion;
  } | null;
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
}

export interface UIState {
  activeTab: AppTabKey;
  activeModal: "none" | "daily_color" | "task_reward" | "device_debug";
  isVoiceRecording: boolean;
  showDebugPanel: boolean;
  quietUI: boolean;
  sceneMode: SceneMode;
  demoMode: boolean;
}

export interface AppRootState {
  userProfile: UserProfileState;
  sheepProfile: SheepProfileState;
  sheepEmotionState: SheepEmotionState;
  sheepVisualState: SheepVisualState;
  dailyColorState: DailyColorState;
  bondState: BondState;
  growthState: GrowthState;
  memoryState: MemoryState;
  deviceState: DeviceState;
  interactionState: InteractionState;
  telemetryState: TelemetryState;
  ui: UIState;
}
