import type { AppRootState } from "../types";
import { sceneProfileOf } from "../../domain/interactionScenes";
import { buildSurveyQueueSummary } from "../../features/memory/surveyQueueView";

export const selectActiveTab = (state: AppRootState) => state.ui.activeTab;
export const selectTodayColor = (state: AppRootState) => state.dailyColorState;
export const selectSheepProfile = (state: AppRootState) => state.sheepProfile;
export const selectSheepEmotionState = (state: AppRootState) => state.sheepEmotionState;
export const selectSheepVisualState = (state: AppRootState) => state.sheepVisualState;
export const selectBondOverview = (state: AppRootState) => state.bondState;
export const selectGrowthLines = (state: AppRootState) => state.growthState;
export const selectMemoryState = (state: AppRootState) => state.memoryState;
export const selectDeviceState = (state: AppRootState) => state.deviceState;
export const selectMessages = (state: AppRootState) => state.interactionState.messages;
export const selectActiveScene = (state: AppRootState) => state.interactionState.activeScene;
export const selectActiveSceneProfile = (state: AppRootState) =>
  sceneProfileOf(state.interactionState.activeScene);
export const selectSceneAtmosphereClass = (state: AppRootState) =>
  sceneProfileOf(state.interactionState.activeScene).atmosphereClass;
export const selectDailySummaryScene = (state: AppRootState, dayKey: string) =>
  state.memoryState.interactionSummaries.find((item) => item.dayKey === dayKey)?.lastScene ?? null;
export const selectSharedMilestoneIds = (state: AppRootState) =>
  state.memoryState.sharedMoments.map((item) => item.milestoneId).filter(Boolean) as string[];
export const selectSurveySubmissionStats = (state: AppRootState) =>
  buildSurveyQueueSummary(state.userProfile.surveySubmissions);
export const selectRecentTelemetry = (state: AppRootState, limit = 20) =>
  state.telemetryState.events.slice(0, Math.max(1, limit));
