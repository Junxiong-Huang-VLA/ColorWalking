import taskRewardCopyJson from "../../config/task-reward-copy.json";
import { validateTaskRewardCopyConfig } from "../../lib/configValidator";
import type { TaskRewardCopyConfig } from "../../types/growth";

const TASK_REWARD_COPY: TaskRewardCopyConfig = validateTaskRewardCopyConfig(taskRewardCopyJson);

export function getTaskRewardHint(taskIds: string[]): string | null {
  if (!taskIds.length) return null;
  for (const taskId of taskIds) {
    const hint = TASK_REWARD_COPY.taskHints[taskId];
    if (hint) return hint;
  }
  return TASK_REWARD_COPY.fallbackHint;
}

export function getTaskRewardTitle(taskId: string): string {
  return TASK_REWARD_COPY.taskTitles[taskId] ?? taskId;
}
