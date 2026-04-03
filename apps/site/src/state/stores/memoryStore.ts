import { useAppSelector } from "../store";
import type { AppRootState } from "../types";

export const memorySelectors = {
  memory: (state: AppRootState) => state.memoryState,
  rememberedItems: (state: AppRootState) => state.memoryState.rememberedItems,
  timeline: (state: AppRootState) => state.memoryState.timeline,
  colorCalendar: (state: AppRootState) => state.memoryState.colorCalendar,
  memoryCards: (state: AppRootState) => state.memoryState.memoryCards
};

export function useMemoryStore() {
  const memoryState = useAppSelector(memorySelectors.memory);
  return {
    memoryState
  };
}
