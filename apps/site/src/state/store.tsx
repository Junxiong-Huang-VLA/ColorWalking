import { createContext, useContext, useMemo, useReducer, useEffect, type ReactNode } from "react";
import { appReducer } from "../domain/reducers";
import type { AppEvent } from "../domain/events";
import type { AppRootState } from "./types";
import { createInitialUserProfile } from "./slices/userProfileSlice";
import { createInitialSheepProfileState } from "./slices/sheepStateSlice";
import { createInitialDailyColorState } from "./slices/dailyColorSlice";
import { createInitialBondState } from "./slices/bondStateSlice";
import { createInitialGrowthState } from "./slices/growthStateSlice";
import { createInitialMemoryState } from "./slices/memoryStateSlice";
import { createInitialDeviceState } from "./slices/deviceStateSlice";
import { createInitialInteractionState } from "./slices/interactionStateSlice";
import { createInitialSheepEmotionState } from "./slices/sheepEmotionStateSlice";
import { createInitialSheepVisualState } from "./slices/sheepVisualStateSlice";
import { createInitialTelemetryState } from "./slices/telemetryStateSlice";
import { nowIso, dayKeyOf } from "../utils/time";
import type { ExperienceSurveyPayload, ExperienceSurveySubmission } from "./types";

const STORAGE_KEY = "lambroll.site.ia.v2";

type PersistedAppState = Pick<
  AppRootState,
  | "userProfile"
  | "sheepProfile"
  | "sheepEmotionState"
  | "sheepVisualState"
  | "dailyColorState"
  | "bondState"
  | "growthState"
  | "memoryState"
  | "interactionState"
  | "deviceState"
  | "telemetryState"
>;

type AppStoreValue = {
  state: AppRootState;
  dispatch: (event: AppEvent) => void;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function createInitialAppState(atIso = nowIso()): AppRootState {
  const dayKey = dayKeyOf(atIso);
  return {
    userProfile: createInitialUserProfile(atIso),
    sheepProfile: createInitialSheepProfileState(),
    sheepEmotionState: createInitialSheepEmotionState(atIso),
    sheepVisualState: createInitialSheepVisualState(),
    dailyColorState: createInitialDailyColorState(dayKey),
    bondState: createInitialBondState(atIso),
    growthState: createInitialGrowthState(dayKey),
    memoryState: createInitialMemoryState(atIso, dayKey),
    deviceState: createInitialDeviceState(),
    interactionState: createInitialInteractionState(atIso),
    telemetryState: createInitialTelemetryState(),
    ui: {
      activeTab: "home",
      activeModal: "none",
      isVoiceRecording: false,
      showDebugPanel: false,
      quietUI: false,
      sceneMode: "auto",
      demoMode: false
    }
  };
}

function rehydrateState(): AppRootState {
  const base = createInitialAppState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    const parsedFeedback = parsed.userProfile?.experienceFeedback;
    const parsedSubmissions: Array<
      Partial<ExperienceSurveySubmission> & { status?: string; payload?: Partial<ExperienceSurveyPayload> }
    > =
      parsed.userProfile?.surveySubmissions && Array.isArray(parsed.userProfile.surveySubmissions)
        ? (parsed.userProfile.surveySubmissions as Array<
            Partial<ExperienceSurveySubmission> & { status?: string; payload?: Partial<ExperienceSurveyPayload> }
          >)
        : [];
    const normalizedSubmissions: ExperienceSurveySubmission[] = parsedSubmissions
      .filter((item) => Boolean(item.id && item.createdAt))
      .map((item) => {
        const rawStatus = String(item.status ?? "saved_local");
        return {
        id: item.id as string,
        createdAt: item.createdAt as string,
        source: item.source ?? "experience_feedback_card",
        status:
          rawStatus === "queued_api"
            ? "upload_pending"
            : rawStatus === "upload_pending" ||
                rawStatus === "upload_failed" ||
                rawStatus === "upload_permanent_failed" ||
                rawStatus === "upload_success" ||
                rawStatus === "saved_local"
              ? rawStatus
              : "saved_local",
        attemptCount: typeof item.attemptCount === "number" ? item.attemptCount : 0,
        lastAttemptAt: item.lastAttemptAt ?? null,
        uploadedAt: item.uploadedAt ?? null,
        nextRetryAt: item.nextRetryAt ?? null,
        permanentFailedAt: item.permanentFailedAt ?? null,
        lastError: item.lastError ?? null,
        payload: {
          wantsPhysical: item.payload?.wantsPhysical ?? null,
          favoriteScene: item.payload?.favoriteScene ?? null,
          favoriteColorExperience: item.payload?.favoriteColorExperience ?? null,
          joinWaitlist: item.payload?.joinWaitlist ?? null,
          contact: item.payload?.contact ?? null
        }
      };
      });
    return {
      ...base,
      ...parsed,
      userProfile: parsed.userProfile
        ? {
            ...base.userProfile,
            ...parsed.userProfile,
            experienceFeedback: {
              ...base.userProfile.experienceFeedback,
              ...(parsedFeedback ?? {})
            },
            surveySubmissions: normalizedSubmissions.length ? normalizedSubmissions : base.userProfile.surveySubmissions
          }
        : base.userProfile,
      sheepProfile: parsed.sheepProfile ? { ...base.sheepProfile, ...parsed.sheepProfile } : base.sheepProfile,
      sheepEmotionState: parsed.sheepEmotionState
        ? { ...base.sheepEmotionState, ...parsed.sheepEmotionState }
        : base.sheepEmotionState,
      sheepVisualState: parsed.sheepVisualState ? { ...base.sheepVisualState, ...parsed.sheepVisualState } : base.sheepVisualState,
      dailyColorState: parsed.dailyColorState ? { ...base.dailyColorState, ...parsed.dailyColorState } : base.dailyColorState,
      bondState: parsed.bondState ? { ...base.bondState, ...parsed.bondState } : base.bondState,
      growthState: parsed.growthState ? { ...base.growthState, ...parsed.growthState } : base.growthState,
      memoryState: parsed.memoryState ? { ...base.memoryState, ...parsed.memoryState } : base.memoryState,
      deviceState: parsed.deviceState ? { ...base.deviceState, ...parsed.deviceState } : base.deviceState,
      interactionState: parsed.interactionState ? { ...base.interactionState, ...parsed.interactionState } : base.interactionState,
      telemetryState: parsed.telemetryState ? { ...base.telemetryState, ...parsed.telemetryState } : base.telemetryState,
      ui: base.ui
    };
  } catch {
    return base;
  }
}

function toPersistedState(state: AppRootState): PersistedAppState {
  return {
    userProfile: state.userProfile,
    sheepProfile: state.sheepProfile,
    sheepEmotionState: state.sheepEmotionState,
    sheepVisualState: state.sheepVisualState,
    dailyColorState: state.dailyColorState,
    bondState: state.bondState,
    growthState: state.growthState,
    memoryState: state.memoryState,
    interactionState: state.interactionState,
    telemetryState: state.telemetryState,
    deviceState: {
      ...state.deviceState,
      connected: false,
      deviceId: null,
      pendingCommands: [],
      syncState: "ok",
      lastSyncError: null
    }
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, rehydrateState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistedState(state)));
  }, [state]);

  const value = useMemo<AppStoreValue>(() => ({ state, dispatch }), [state]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const value = useContext(AppStoreContext);
  if (!value) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return value;
}

export function useAppSelector<T>(selector: (state: AppRootState) => T): T {
  const { state } = useAppStore();
  return selector(state);
}

