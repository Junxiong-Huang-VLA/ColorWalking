/**
 * @deprecated 已由 `src/lib/luckyColorEngine.ts` 接管主链抽色与记录逻辑。
 * 保留仅用于历史回溯，不应继续引用。
 */
import type { DailyColorHistoryItem, DailyColorState, LuckyColorItem } from "../../state/types";
import { LUCKY_COLOR_CATALOG } from "./catalog";

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function pickDailyLuckyColor(dayKey: string, userId: string): LuckyColorItem {
  const index = hashSeed(`${dayKey}-${userId}-lucky-color`) % LUCKY_COLOR_CATALOG.length;
  return LUCKY_COLOR_CATALOG[index] ?? LUCKY_COLOR_CATALOG[0];
}

export function upsertDailyHistory(
  history: DailyColorState["history"],
  item: DailyColorHistoryItem,
  max = 365
): DailyColorState["history"] {
  const filtered = history.filter((entry) => entry.dayKey !== item.dayKey);
  return [item, ...filtered].slice(0, max);
}
