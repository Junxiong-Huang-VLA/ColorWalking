import type { LuckyColorsConfig } from "../types/color";
import type { DeviceProtocolConfig, MockDeviceEventsConfig } from "../types/device";
import type { EmotionMapConfig, ExpressionMapConfig } from "../types/emotion";
import type { DailyTasksConfig, GrowthTreeConfig, TaskRewardCopyConfig } from "../types/growth";
import type { RoleConfig } from "../types/role";

const EMOTIONS = ["calm", "soft", "happy", "sleepy", "shy", "sad"] as const;
const COMPANION_EVENTS = [
  "daily_color_drawn",
  "touch_head",
  "touch_body",
  "hug_pressure",
  "proximity_near",
  "picked_up",
  "laid_down",
  "bedtime_mode_started",
  "chat_started"
] as const;
const DEVICE_EVENTS = ["touch_head", "touch_body", "hug_pressure", "proximity_near", "picked_up", "laid_down"] as const;
const EYE_STATES = ["open", "half_closed", "closed"] as const;
const EXPRESSIONS = ["idle", "blink", "smile", "rest"] as const;
const MOTIONS = ["idle_breathe", "nuzzle", "tiny_hop", "rest_pose"] as const;
const VOICES = ["soft", "whisper", "light_bright"] as const;
const GROWTH_LINES = ["color_sense", "expression", "companion", "island_story"] as const;
const SCENES = ["daytime", "night", "bedtime"] as const;

type JsonRecord = Record<string, unknown>;

function fail(scope: string, message: string): never {
  throw new Error(`[config:${scope}] ${message}`);
}

function asRecord(value: unknown, scope: string, path: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(scope, `${path} must be an object`);
  }
  return value as JsonRecord;
}

function asArray(value: unknown, scope: string, path: string): unknown[] {
  if (!Array.isArray(value)) {
    fail(scope, `${path} must be an array`);
  }
  return value;
}

function asString(value: unknown, scope: string, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(scope, `${path} must be a non-empty string`);
  }
  return value;
}

function asNumber(value: unknown, scope: string, path: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(scope, `${path} must be a number`);
  }
  return value;
}

function asStringArray(value: unknown, scope: string, path: string): string[] {
  const list = asArray(value, scope, path);
  return list.map((item, index) => asString(item, scope, `${path}[${index}]`));
}

function asOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  scope: string,
  path: string
): T[number] {
  const text = asString(value, scope, path);
  if (!allowed.includes(text)) {
    fail(scope, `${path} must be one of: ${allowed.join(", ")}`);
  }
  return text as T[number];
}

function assertHex(value: unknown, scope: string, path: string): string {
  const text = asString(value, scope, path);
  if (!/^#[0-9a-fA-F]{6}$/.test(text)) {
    fail(scope, `${path} must be a valid hex color like #AABBCC`);
  }
  return text;
}

export function validateRoleConfig(value: unknown): RoleConfig {
  const scope = "role-config";
  const root = asRecord(value, scope, "root");
  asString(root.version, scope, "version");
  asString(root.roleName, scope, "roleName");
  asString(root.brandName, scope, "brandName");
  asString(root.worldviewOrigin, scope, "worldviewOrigin");
  asString(root.roleIdentity, scope, "roleIdentity");
  asString(root.corePositioning, scope, "corePositioning");
  asString(root.oneLineDefinition, scope, "oneLineDefinition");
  asStringArray(root.personalityKeywords, scope, "personalityKeywords");
  asStringArray(root.toneRules, scope, "toneRules");
  asStringArray(root.forbiddenZones, scope, "forbiddenZones");
  asStringArray(root.signatureAccessories, scope, "signatureAccessories");
  asStringArray(root.visualKeywords, scope, "visualKeywords");
  asStringArray(root.signatureExpressions, scope, "signatureExpressions");
  return root as unknown as RoleConfig;
}

export function validateLuckyColorsConfig(value: unknown): LuckyColorsConfig {
  const scope = "lucky-colors";
  const root = asRecord(value, scope, "root");
  asString(root.version, scope, "version");
  const defaultEyeSoftness = asNumber(root.defaultEyeSoftness, scope, "defaultEyeSoftness");
  if (defaultEyeSoftness < 0 || defaultEyeSoftness > 1) {
    fail(scope, "defaultEyeSoftness must be between 0 and 1");
  }
  const colors = asArray(root.colors, scope, "colors");
  if (colors.length < 12) {
    fail(scope, "colors must contain at least 12 items");
  }

  colors.forEach((item, index) => {
    const color = asRecord(item, scope, `colors[${index}]`);
    asString(color.colorId, scope, `colors[${index}].colorId`);
    asString(color.colorName, scope, `colors[${index}].colorName`);
    assertHex(color.hex, scope, `colors[${index}].hex`);
    assertHex(color.softHex, scope, `colors[${index}].softHex`);
    assertHex(color.glowHex, scope, `colors[${index}].glowHex`);
    asString(color.category, scope, `colors[${index}].category`);
    asStringArray(color.keywords, scope, `colors[${index}].keywords`);
    asString(color.message, scope, `colors[${index}].message`);
    const moodBias = asRecord(color.moodBias, scope, `colors[${index}].moodBias`);
    asOneOf(moodBias.baseEmotion, EMOTIONS, scope, `colors[${index}].moodBias.baseEmotion`);
    asNumber(moodBias.levelBias, scope, `colors[${index}].moodBias.levelBias`);
    asNumber(moodBias.stabilityBias, scope, `colors[${index}].moodBias.stabilityBias`);
  });

  return root as unknown as LuckyColorsConfig;
}

export function validateEmotionMapConfig(value: unknown): EmotionMapConfig {
  const scope = "emotion-map";
  const root = asRecord(value, scope, "root");
  asString(root.version, scope, "version");

  const baseMap = asRecord(root.baseEmotionByCategory, scope, "baseEmotionByCategory");
  Object.keys(baseMap).forEach((key) => asOneOf(baseMap[key], EMOTIONS, scope, `baseEmotionByCategory.${key}`));

  const eventOffsets = asRecord(root.eventOffsets, scope, "eventOffsets");
  COMPANION_EVENTS.forEach((eventType) => {
    if (!(eventType in eventOffsets)) {
      fail(scope, `eventOffsets.${eventType} is required`);
    }
    const rule = asRecord(eventOffsets[eventType], scope, `eventOffsets.${eventType}`);
    asOneOf(rule.targetEmotion, EMOTIONS, scope, `eventOffsets.${eventType}.targetEmotion`);
    asNumber(rule.levelDelta, scope, `eventOffsets.${eventType}.levelDelta`);
    asNumber(rule.stabilityDelta, scope, `eventOffsets.${eventType}.stabilityDelta`);
  });

  const rollback = asRecord(root.rollbackRules, scope, "rollbackRules");
  asNumber(rollback.tickSeconds, scope, "rollbackRules.tickSeconds");
  asNumber(rollback.switchCooldownSeconds, scope, "rollbackRules.switchCooldownSeconds");
  asNumber(rollback.idleRollbackSeconds, scope, "rollbackRules.idleRollbackSeconds");
  asNumber(rollback.recoverRate, scope, "rollbackRules.recoverRate");
  asNumber(rollback.levelEpsilon, scope, "rollbackRules.levelEpsilon");
  asNumber(rollback.stabilityRecoveryTarget, scope, "rollbackRules.stabilityRecoveryTarget");
  asNumber(rollback.stabilityRecoveryRate, scope, "rollbackRules.stabilityRecoveryRate");
  asNumber(rollback.minStability, scope, "rollbackRules.minStability");
  asNumber(rollback.maxStability, scope, "rollbackRules.maxStability");

  const scenes = asRecord(root.sceneModifiers, scope, "sceneModifiers");
  SCENES.forEach((scene) => {
    if (!(scene in scenes)) {
      fail(scope, `sceneModifiers.${scene} is required`);
    }
    const modifier = asRecord(scenes[scene], scope, `sceneModifiers.${scene}`);
    asNumber(modifier.levelOffset, scope, `sceneModifiers.${scene}.levelOffset`);
    asNumber(modifier.stabilityOffset, scope, `sceneModifiers.${scene}.stabilityOffset`);
    const preferred = asArray(modifier.preferredEmotions, scope, `sceneModifiers.${scene}.preferredEmotions`);
    preferred.forEach((emotion, index) =>
      asOneOf(emotion, EMOTIONS, scope, `sceneModifiers.${scene}.preferredEmotions[${index}]`)
    );
  });

  return root as unknown as EmotionMapConfig;
}

export function validateExpressionMapConfig(value: unknown): ExpressionMapConfig {
  const scope = "expression-map";
  const root = asRecord(value, scope, "root");
  asString(root.version, scope, "version");
  const visualMap = asRecord(root.emotionVisualMap, scope, "emotionVisualMap");

  EMOTIONS.forEach((emotion) => {
    if (!(emotion in visualMap)) {
      fail(scope, `emotionVisualMap.${emotion} is required`);
    }
    const preset = asRecord(visualMap[emotion], scope, `emotionVisualMap.${emotion}`);
    asOneOf(preset.eyeState, EYE_STATES, scope, `emotionVisualMap.${emotion}.eyeState`);
    asOneOf(preset.expression, EXPRESSIONS, scope, `emotionVisualMap.${emotion}.expression`);
    asOneOf(preset.motionTemplate, MOTIONS, scope, `emotionVisualMap.${emotion}.motionTemplate`);
    asOneOf(preset.voiceStyle, VOICES, scope, `emotionVisualMap.${emotion}.voiceStyle`);
    const statusText = asStringArray(preset.statusText, scope, `emotionVisualMap.${emotion}.statusText`);
    if (!statusText.length) {
      fail(scope, `emotionVisualMap.${emotion}.statusText must not be empty`);
    }
    const blend = asRecord(preset.eyeColorBlend, scope, `emotionVisualMap.${emotion}.eyeColorBlend`);
    assertHex(blend.hex, scope, `emotionVisualMap.${emotion}.eyeColorBlend.hex`);
    const weight = asNumber(blend.weight, scope, `emotionVisualMap.${emotion}.eyeColorBlend.weight`);
    if (weight < 0 || weight > 1) {
      fail(scope, `emotionVisualMap.${emotion}.eyeColorBlend.weight must be between 0 and 1`);
    }
  });

  return root as unknown as ExpressionMapConfig;
}

export function validateGrowthTreeConfig(value: unknown): GrowthTreeConfig {
  const scope = "growth-tree";
  const root = asRecord(value, scope, "root");
  asString(root.version, scope, "version");

  const bondLevels = asArray(root.bondLevels, scope, "bondLevels");
  if (!bondLevels.length) {
    fail(scope, "bondLevels must not be empty");
  }
  bondLevels.forEach((item, index) => {
    const level = asRecord(item, scope, `bondLevels[${index}]`);
    asNumber(level.level, scope, `bondLevels[${index}].level`);
    asString(level.title, scope, `bondLevels[${index}].title`);
    asNumber(level.requiredBondPoints, scope, `bondLevels[${index}].requiredBondPoints`);
    asString(level.reward, scope, `bondLevels[${index}].reward`);
  });

  const growthLines = asArray(root.growthLines, scope, "growthLines");
  if (!growthLines.length) {
    fail(scope, "growthLines must not be empty");
  }
  growthLines.forEach((line, index) => {
    const lineRecord = asRecord(line, scope, `growthLines[${index}]`);
    asOneOf(lineRecord.lineId, GROWTH_LINES, scope, `growthLines[${index}].lineId`);
    asString(lineRecord.lineName, scope, `growthLines[${index}].lineName`);
    asString(lineRecord.description, scope, `growthLines[${index}].description`);
    const nodes = asArray(lineRecord.nodes, scope, `growthLines[${index}].nodes`);
    nodes.forEach((node, nodeIndex) => {
      const nodeRecord = asRecord(node, scope, `growthLines[${index}].nodes[${nodeIndex}]`);
      asString(nodeRecord.nodeId, scope, `growthLines[${index}].nodes[${nodeIndex}].nodeId`);
      asString(nodeRecord.title, scope, `growthLines[${index}].nodes[${nodeIndex}].title`);
      asString(nodeRecord.description, scope, `growthLines[${index}].nodes[${nodeIndex}].description`);
      const condition = asRecord(nodeRecord.condition, scope, `growthLines[${index}].nodes[${nodeIndex}].condition`);
      asNumber(condition.requiredBondLevel, scope, `growthLines[${index}].nodes[${nodeIndex}].condition.requiredBondLevel`);
      asNumber(condition.requiredLineXp, scope, `growthLines[${index}].nodes[${nodeIndex}].condition.requiredLineXp`);
      if (condition.requiredTaskIds !== undefined) {
        asStringArray(condition.requiredTaskIds, scope, `growthLines[${index}].nodes[${nodeIndex}].condition.requiredTaskIds`);
      }
      const reward = asRecord(nodeRecord.reward, scope, `growthLines[${index}].nodes[${nodeIndex}].reward`);
      asString(reward.unlock, scope, `growthLines[${index}].nodes[${nodeIndex}].reward.unlock`);
    });
  });

  return root as unknown as GrowthTreeConfig;
}

export function validateDailyTasksConfig(value: unknown): DailyTasksConfig {
  const scope = "daily-tasks";
  const root = asRecord(value, scope, "root");
  asString(root.version, scope, "version");

  const tasks = asArray(root.tasks, scope, "tasks");
  tasks.forEach((task, index) => {
    const taskRecord = asRecord(task, scope, `tasks[${index}]`);
    asString(taskRecord.taskId, scope, `tasks[${index}].taskId`);
    asString(taskRecord.title, scope, `tasks[${index}].title`);
    asString(taskRecord.description, scope, `tasks[${index}].description`);
    const condition = asRecord(taskRecord.condition, scope, `tasks[${index}].condition`);
    asOneOf(condition.eventType, COMPANION_EVENTS, scope, `tasks[${index}].condition.eventType`);
    asNumber(condition.minCount, scope, `tasks[${index}].condition.minCount`);
    if (typeof condition.oncePerDay !== "boolean") {
      fail(scope, `tasks[${index}].condition.oncePerDay must be boolean`);
    }
    const reward = asRecord(taskRecord.reward, scope, `tasks[${index}].reward`);
    asNumber(reward.bondPoints, scope, `tasks[${index}].reward.bondPoints`);
    const lineXp = asRecord(reward.lineXp, scope, `tasks[${index}].reward.lineXp`);
    Object.keys(lineXp).forEach((lineKey) => {
      asOneOf(lineKey, GROWTH_LINES, scope, `tasks[${index}].reward.lineXp.${lineKey}`);
      asNumber(lineXp[lineKey], scope, `tasks[${index}].reward.lineXp.${lineKey}`);
    });
    if (reward.itemReward !== undefined) {
      asString(reward.itemReward, scope, `tasks[${index}].reward.itemReward`);
    }
  });

  const streakRewards = asArray(root.streakRewards, scope, "streakRewards");
  streakRewards.forEach((item, index) => {
    const rewardNode = asRecord(item, scope, `streakRewards[${index}]`);
    asNumber(rewardNode.streakDays, scope, `streakRewards[${index}].streakDays`);
    const reward = asRecord(rewardNode.reward, scope, `streakRewards[${index}].reward`);
    asNumber(reward.bondPoints, scope, `streakRewards[${index}].reward.bondPoints`);
    asString(reward.unlock, scope, `streakRewards[${index}].reward.unlock`);
  });

  return root as unknown as DailyTasksConfig;
}

export function validateTaskRewardCopyConfig(value: unknown): TaskRewardCopyConfig {
  const scope = "task-reward-copy";
  const root = asRecord(value, scope, "root");
  asString(root.version, scope, "version");
  asString(root.fallbackHint, scope, "fallbackHint");

  const taskHints = asRecord(root.taskHints, scope, "taskHints");
  Object.keys(taskHints).forEach((taskId) => {
    asString(taskHints[taskId], scope, `taskHints.${taskId}`);
  });

  const taskTitles = asRecord(root.taskTitles, scope, "taskTitles");
  Object.keys(taskTitles).forEach((taskId) => {
    asString(taskTitles[taskId], scope, `taskTitles.${taskId}`);
  });

  return root as unknown as TaskRewardCopyConfig;
}

export function validateDeviceProtocolConfig(value: unknown): DeviceProtocolConfig {
  const scope = "device-protocol";
  const root = asRecord(value, scope, "root");
  asString(root.version, scope, "version");

  const inputEvents = asArray(root.inputEvents, scope, "inputEvents");
  inputEvents.forEach((item, index) => {
    const event = asRecord(item, scope, `inputEvents[${index}]`);
    asOneOf(event.eventType, DEVICE_EVENTS, scope, `inputEvents[${index}].eventType`);
    asString(event.description, scope, `inputEvents[${index}].description`);
    const fields = asArray(event.fields, scope, `inputEvents[${index}].fields`);
    fields.forEach((field, fieldIndex) => {
      const fieldRecord = asRecord(field, scope, `inputEvents[${index}].fields[${fieldIndex}]`);
      asString(fieldRecord.name, scope, `inputEvents[${index}].fields[${fieldIndex}].name`);
      asString(fieldRecord.type, scope, `inputEvents[${index}].fields[${fieldIndex}].type`);
      asString(fieldRecord.description, scope, `inputEvents[${index}].fields[${fieldIndex}].description`);
    });
  });

  const outputState = asRecord(root.outputState, scope, "outputState");
  const outputFields = asArray(outputState.fields, scope, "outputState.fields");
  outputFields.forEach((field, index) => {
    const fieldRecord = asRecord(field, scope, `outputState.fields[${index}]`);
    asString(fieldRecord.name, scope, `outputState.fields[${index}].name`);
    asString(fieldRecord.type, scope, `outputState.fields[${index}].type`);
    asString(fieldRecord.description, scope, `outputState.fields[${index}].description`);
  });
  asString(outputState.note, scope, "outputState.note");
  asStringArray(root.notes, scope, "notes");

  return root as unknown as DeviceProtocolConfig;
}

export function validateMockDeviceEventsConfig(value: unknown): MockDeviceEventsConfig {
  const scope = "mock-device-events";
  const root = asRecord(value, scope, "root");
  asString(root.version, scope, "version");
  const events = asArray(root.events, scope, "events");
  if (!events.length) {
    fail(scope, "events must not be empty");
  }
  events.forEach((item, index) => {
    const event = asRecord(item, scope, `events[${index}]`);
    asOneOf(event.eventType, DEVICE_EVENTS, scope, `events[${index}].eventType`);
    const payload = asRecord(event.payload, scope, `events[${index}].payload`);
    asString(payload.timestamp, scope, `events[${index}].payload.timestamp`);
    asOneOf(payload.source, ["mock", "hardware"] as const, scope, `events[${index}].payload.source`);
  });
  return root as unknown as MockDeviceEventsConfig;
}
