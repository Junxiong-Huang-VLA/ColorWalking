import { useAppSelector, useAppStore } from "../store";
import type { AppRootState, AppTabKey, SceneMode, UIState } from "../types";

export const uiSelectors = {
  ui: (state: AppRootState) => state.ui,
  activeTab: (state: AppRootState) => state.ui.activeTab,
  activeModal: (state: AppRootState) => state.ui.activeModal,
  isVoiceRecording: (state: AppRootState) => state.ui.isVoiceRecording,
  showDebugPanel: (state: AppRootState) => state.ui.showDebugPanel,
  quietUI: (state: AppRootState) => state.ui.quietUI,
  sceneMode: (state: AppRootState) => state.ui.sceneMode,
  demoMode: (state: AppRootState) => state.ui.demoMode
};

export function useUIStore() {
  const uiState = useAppSelector(uiSelectors.ui);
  const { dispatch } = useAppStore();

  return {
    uiState,
    actions: {
      setActiveTab: (tab: AppTabKey) => {
        dispatch({ type: "TAB_CHANGED", tab });
      },
      setActiveModal: (modal: UIState["activeModal"]) => {
        dispatch({ type: "UI_MODAL_CHANGED", modal });
      },
      setVoiceRecording: (recording: boolean) => {
        dispatch({ type: "UI_RECORDING_CHANGED", recording });
      },
      setDebugPanelVisible: (visible: boolean) => {
        dispatch({ type: "UI_DEBUG_PANEL_CHANGED", visible });
      },
      setQuietUI: (quiet: boolean) => {
        dispatch({ type: "UI_QUIET_MODE_CHANGED", quiet });
      },
      setSceneMode: (mode: SceneMode) => {
        dispatch({ type: "UI_SCENE_MODE_CHANGED", mode });
      },
      setDemoMode: (enabled: boolean) => {
        dispatch({ type: "UI_DEMO_MODE_CHANGED", enabled });
      }
    }
  };
}
