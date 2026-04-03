import {
  applyEmotionEvent,
  applyTaskCompletionsByEvents,
  buildOutputStatePayload,
  createEmotionStateFromLuckyColor,
  createMockGrowthRuntime,
  deriveVisualFromEmotion,
  drawDailyLuckyColor,
  getLuckyColorById,
  getLuckyColors,
  getReachedStreakRewards,
  listSupportedInputEvents,
  normalizeInputEvent,
  parseMockInputEvent,
  rollbackEmotionState
} from "../src/lib";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[engine-smoke] ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`[engine-smoke] ${message}. expected=${String(expected)} actual=${String(actual)}`);
  }
}

function assertMatch(actual: string, pattern: RegExp, message: string): void {
  if (!pattern.test(actual)) {
    throw new Error(`[engine-smoke] ${message}. actual=${actual}`);
  }
}

function runLuckyColorSmokeTest() {
  const colors = getLuckyColors();
  assert(colors.length >= 12, "lucky colors should contain at least 12 items");

  const dayKey = "2026-04-01";
  const userId = "smoke-user";
  const first = drawDailyLuckyColor(dayKey, userId);
  const second = drawDailyLuckyColor(dayKey, userId);

  assertEqual(first.colorId, second.colorId, "daily color draw should be deterministic");
  assert(getLuckyColorById(first.colorId), "drawn color should exist in catalog");
}

function runEmotionAndExpressionSmokeTest() {
  const luckyColor = drawDailyLuckyColor("2026-04-01", "smoke-user");
  const base = createEmotionStateFromLuckyColor({
    category: luckyColor.category,
    moodBias: luckyColor.moodBias,
    nowIso: "2026-04-01T10:00:00.000Z",
    scene: "daytime"
  });

  const boosted = applyEmotionEvent({
    state: base,
    eventType: "touch_head",
    nowIso: "2026-04-01T10:00:10.000Z",
    scene: "daytime"
  });
  assertEqual(boosted.emotionSource, "touch_head", "interaction should update emotion source");
  assert(boosted.emotionLevel >= 0 && boosted.emotionLevel <= 100, "emotion level should be clamped");

  const rolled = rollbackEmotionState({
    state: boosted,
    nowIso: "2026-04-01T10:03:10.000Z",
    scene: "daytime"
  });
  assert(
    Math.abs(rolled.emotionLevel - boosted.baseLevel) <= Math.abs(boosted.emotionLevel - boosted.baseLevel),
    "rollback should move emotion level toward base level"
  );

  const visual = deriveVisualFromEmotion({
    emotionState: rolled,
    luckyColor: {
      hex: luckyColor.hex,
      softHex: luckyColor.softHex
    },
    seed: "smoke-seed"
  });
  assertMatch(visual.eyeColorHex, /^#[0-9a-fA-F]{6}$/, "eye color should be valid hex");
  assert(visual.statusText.length > 0, "visual output should include status text");
}

function runGrowthSmokeTest() {
  const runtime = createMockGrowthRuntime("2026-04-01");
  const next = applyTaskCompletionsByEvents(runtime, {
    daily_color_drawn: 1,
    touch_head: 1,
    chat_started: 1
  });

  assert(next.completedTaskIds.includes("task_daily_draw"), "daily draw task should be completed");
  assert(next.completedTaskIds.includes("task_gentle_touch"), "touch task should be completed");
  assert(next.completedTaskIds.includes("task_chat_started"), "chat task should be completed");
  assert(next.bondPoints > runtime.bondPoints, "growth rewards should increase bond points");

  const streakRewards = getReachedStreakRewards(7);
  assert(streakRewards.length > 0, "streak rewards should be returned for reached streak");
}

function runDeviceBridgeSmokeTest() {
  const events = listSupportedInputEvents();
  assert(events.includes("touch_head"), "touch_head should be supported input event");

  const mockEvent = parseMockInputEvent("touch_head");
  assert(mockEvent, "mock event payload should be available");

  const normalized = normalizeInputEvent({
    eventType: "touch_head",
    payload: { source: "hardware", strength: 41 }
  });
  assertEqual(normalized?.eventType, "touch_head", "normalizeInputEvent should keep eventType");
  assertEqual(normalized?.payload.source, "hardware", "normalizeInputEvent should preserve hardware source");

  const output = buildOutputStatePayload({ emotion: "happy", emotionLevel: 66 });
  assertEqual(output.emotion, "happy", "output builder should keep provided emotion");
  assertEqual(output.emotionLevel, 66, "output builder should keep provided emotion level");
}

function run() {
  runLuckyColorSmokeTest();
  runEmotionAndExpressionSmokeTest();
  runGrowthSmokeTest();
  runDeviceBridgeSmokeTest();
  console.log("[engine-smoke] all smoke checks passed");
}

run();
