import { milestoneRuleOf } from "../../config/milestoneRules";
import type { SharedMomentItem } from "../../state/types";

function matchesScope(
  existing: SharedMomentItem,
  candidate: SharedMomentItem,
  scope: "global" | "day" | "day_scene"
): boolean {
  if (scope === "global") return true;
  if (scope === "day") return existing.dayKey === candidate.dayKey;
  return existing.dayKey === candidate.dayKey && existing.scene === candidate.scene;
}

function isSameMilestoneType(existing: SharedMomentItem, candidate: SharedMomentItem): boolean {
  if (!candidate.milestoneType) return false;
  if (existing.milestoneType !== candidate.milestoneType) return false;
  const rule = milestoneRuleOf(candidate.milestoneType);

  if (rule.generationRule === "by_milestone_id" && candidate.milestoneId && existing.milestoneId) {
    return existing.milestoneId === candidate.milestoneId;
  }

  return matchesScope(existing, candidate, rule.dedupeScope);
}

export function shouldAppendSharedMoment(
  existingItems: SharedMomentItem[],
  candidate: SharedMomentItem
): boolean {
  return !existingItems.some((existing) => {
    if (candidate.milestoneId && existing.milestoneId === candidate.milestoneId) return true;
    if (candidate.key && existing.key === candidate.key) return true;
    if (isSameMilestoneType(existing, candidate)) return true;
    return (
      existing.dayKey === candidate.dayKey &&
      existing.category === candidate.category &&
      existing.title === candidate.title &&
      existing.desc === candidate.desc
    );
  });
}
