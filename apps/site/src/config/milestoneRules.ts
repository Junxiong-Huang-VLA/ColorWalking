import type {
  MilestoneDedupeScope,
  MilestoneGenerationRule,
  SharedMilestoneType
} from "../state/types";

export type MilestoneRule = {
  dedupeScope: MilestoneDedupeScope;
  generationRule: MilestoneGenerationRule;
};

export const MILESTONE_RULES: Record<SharedMilestoneType, MilestoneRule> = {
  bond_level: {
    dedupeScope: "global",
    generationRule: "by_milestone_id"
  },
  first_draw: {
    dedupeScope: "global",
    generationRule: "once_ever"
  },
  first_bedtime: {
    dedupeScope: "global",
    generationRule: "once_ever"
  },
  streak: {
    dedupeScope: "global",
    generationRule: "by_milestone_id"
  },
  loop_complete: {
    dedupeScope: "global",
    generationRule: "once_ever"
  },
  demo_boost: {
    dedupeScope: "day",
    generationRule: "once_per_day"
  },
  scene_switch: {
    dedupeScope: "day_scene",
    generationRule: "once_per_day_per_scene"
  },
  reservation_triggered: {
    dedupeScope: "global",
    generationRule: "by_milestone_id"
  },
  campaign_triggered: {
    dedupeScope: "global",
    generationRule: "by_milestone_id"
  }
};

export function milestoneRuleOf(milestoneType: SharedMilestoneType): MilestoneRule {
  return MILESTONE_RULES[milestoneType];
}
