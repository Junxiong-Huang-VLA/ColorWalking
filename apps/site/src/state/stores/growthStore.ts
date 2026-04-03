import { useAppSelector, useAppStore } from "../store";
import type { AppRootState } from "../types";

export const growthSelectors = {
  bond: (state: AppRootState) => state.bondState,
  growth: (state: AppRootState) => state.growthState,
  taskRewards: (state: AppRootState) => state.growthState.taskRewards,
  completedTaskIds: (state: AppRootState) => state.growthState.completedTaskIds,
  unlockedNodeIds: (state: AppRootState) => state.growthState.unlockedNodeIds
};

export function useGrowthStore() {
  const bondState = useAppSelector(growthSelectors.bond);
  const growthState = useAppSelector(growthSelectors.growth);
  const { dispatch } = useAppStore();

  return {
    bondState,
    growthState,
    actions: {
      clearTaskRewards: () => {
        dispatch({ type: "GROWTH_TASK_REWARDS_CLEARED" });
      }
    }
  };
}
