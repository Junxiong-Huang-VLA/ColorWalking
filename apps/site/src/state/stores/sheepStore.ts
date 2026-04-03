import type { DeviceInputEventType } from "@colorwalking/shared";
import { useAppSelector, useAppStore } from "../store";
import type {
  AppRootState,
  AppTabKey,
  DemoPresetOptions,
  DemoScenarioPreset,
  InteractionScene,
  MilestoneMockPayload
} from "../types";
import { nowIso, todayKey } from "../../utils/time";

export const sheepSelectors = {
  profile: (state: AppRootState) => state.sheepProfile,
  emotion: (state: AppRootState) => state.sheepEmotionState,
  visual: (state: AppRootState) => state.sheepVisualState,
  dailyColor: (state: AppRootState) => state.dailyColorState,
  interactionMessages: (state: AppRootState) => state.interactionState.messages,
  interactionLastEventType: (state: AppRootState) => state.interactionState.lastEventType,
  interactionLastEventAt: (state: AppRootState) => state.interactionState.lastEventAt,
  interactionScene: (state: AppRootState) => state.interactionState.activeScene,
  interactionContextSnapshot: (state: AppRootState) => state.interactionState.contextSnapshot,
  interactionFeedback: (state: AppRootState) => state.interactionState.lastFeedback
};

function normalizeMilestoneMetaValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function slugifyMilestoneMeta(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

export function useSheepStore() {
  const sheepProfile = useAppSelector(sheepSelectors.profile);
  const sheepEmotionState = useAppSelector(sheepSelectors.emotion);
  const sheepVisualState = useAppSelector(sheepSelectors.visual);
  const dailyColorState = useAppSelector(sheepSelectors.dailyColor);
  const messages = useAppSelector(sheepSelectors.interactionMessages);
  const lastEventType = useAppSelector(sheepSelectors.interactionLastEventType);
  const lastEventAt = useAppSelector(sheepSelectors.interactionLastEventAt);
  const activeScene = useAppSelector(sheepSelectors.interactionScene);
  const contextSnapshot = useAppSelector(sheepSelectors.interactionContextSnapshot);
  const lastFeedback = useAppSelector(sheepSelectors.interactionFeedback);
  const { dispatch } = useAppStore();

  return {
    sheepProfile,
    sheepEmotionState,
    sheepVisualState,
    dailyColorState,
    messages,
    lastEventType,
    lastEventAt,
    activeScene,
    contextSnapshot,
    lastFeedback,
    actions: {
      bootstrapToday: () => {
        dispatch({ type: "APP_BOOTSTRAP", nowIso: nowIso(), dayKey: todayKey() });
      },
      drawDailyColor: () => {
        dispatch({ type: "DAILY_COLOR_DRAWN", nowIso: nowIso(), dayKey: todayKey() });
      },
      setDailyColorForDemo: (colorId: string) => {
        dispatch({ type: "DEMO_DAILY_COLOR_SET", nowIso: nowIso(), dayKey: todayKey(), colorId });
      },
      triggerInteraction: (interaction: DeviceInputEventType) => {
        dispatch({ type: "INTERACTION_TRIGGERED", nowIso: nowIso(), interaction });
      },
      sendChat: (text: string) => {
        dispatch({ type: "CHAT_SENT", nowIso: nowIso(), text });
      },
      sendVoiceMock: (transcript: string) => {
        dispatch({ type: "VOICE_INTERACTION", nowIso: nowIso(), transcript });
      },
      startBedtimeMode: () => {
        dispatch({ type: "BEDTIME_MODE_STARTED", nowIso: nowIso() });
      },
      setInteractionScene: (scene: InteractionScene) => {
        dispatch({ type: "INTERACTION_SCENE_CHANGED", nowIso: nowIso(), scene });
      },
      captureInteractionContext: (fromTab: AppTabKey) => {
        dispatch({ type: "INTERACTION_CONTEXT_CAPTURED", nowIso: nowIso(), fromTab });
      },
      tickEmotion: () => {
        dispatch({ type: "EMOTION_TICK", nowIso: nowIso() });
      },
      calibrateEyeSoftness: (eyeSoftness: number) => {
        dispatch({ type: "COLOR_CALIBRATED", nowIso: nowIso(), eyeSoftness });
      },
      boostGrowthForDemo: () => {
        dispatch({ type: "DEMO_GROWTH_BOOST", nowIso: nowIso() });
      },
      applyDemoPreset: (preset: DemoScenarioPreset, options?: DemoPresetOptions) => {
        dispatch({ type: "DEMO_PRESET_APPLIED", nowIso: nowIso(), dayKey: todayKey(), preset, options });
      },
      triggerMilestoneMock: (
        type: "reservation_triggered" | "campaign_triggered",
        payload?: Partial<MilestoneMockPayload>
      ) => {
        const at = nowIso();
        const dayKey = todayKey();
        const meta: MilestoneMockPayload = {
          activityId: normalizeMilestoneMetaValue(payload?.activityId),
          channel: normalizeMilestoneMetaValue(payload?.channel),
          batchId: normalizeMilestoneMetaValue(payload?.batchId)
        };
        const activityKey = slugifyMilestoneMeta(meta.activityId, "activity");
        const channelKey = slugifyMilestoneMeta(meta.channel, "direct");
        const batchKey = slugifyMilestoneMeta(meta.batchId, dayKey);
        if (type === "reservation_triggered") {
          dispatch({
            type: "MILESTONE_PLACEHOLDER_TRIGGERED",
            nowIso: at,
            dayKey,
            milestoneId: `demo-reservation-${dayKey}-${activityKey}-${channelKey}-${batchKey}`,
            milestoneType: "reservation_triggered",
            title: "Demo：预约触发占位",
            desc: "演示触发：已进入预约候补占位流程。",
            scene: activeScene,
            meta
          });
          return;
        }
        dispatch({
          type: "MILESTONE_PLACEHOLDER_TRIGGERED",
          nowIso: at,
          dayKey,
          milestoneId: `demo-campaign-${dayKey}-${activityKey}-${channelKey}-${batchKey}`,
          milestoneType: "campaign_triggered",
          title: "Demo：活动触达占位",
          desc: "演示触发：后续可用于活动提醒与触达。",
          scene: activeScene,
          meta
        });
      },
      resetDemoState: () => {
        dispatch({ type: "DEMO_STATE_RESET", nowIso: nowIso(), dayKey: todayKey() });
      }
    }
  };
}
