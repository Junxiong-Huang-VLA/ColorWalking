import { formatDayKey } from "@colorwalking/shared";

export type LifeMood = "calm" | "soft" | "happy" | "sleepy" | "shy" | "sad";
export type LifeScene = "chat" | "comfort" | "bedtime" | "mood" | "color";

export type LifeMemory = {
  id: string;
  at: string;
  line: string;
  mood: LifeMood;
  scene: LifeScene;
  colorHex: string;
  colorName: string;
  keyword: string;
  tag: "ritual" | "interaction";
};

export type GrowthState = {
  bondPoints: number;
  bondLevel: number;
  bondTitle: string;
  streakDays: number;
  ritualCount: number;
  interactionCount: number;
  traits: string[];
  lastDayKey: string;
};

export type SheepState = {
  luckyColorHex: string;
  luckyColorName: string;
  mood: LifeMood;
  scene: LifeScene;
  statusLine: string;
  lastAwakeAt: string;
};

export type WaitlistEntry = {
  name: string;
  email: string;
  intent: string;
  submittedAt: string;
};

export type DigitalLifeState = {
  sheepState: SheepState;
  growthState: GrowthState;
  memoryState: LifeMemory[];
  waitlistState: WaitlistEntry[];
};

const LIFE_KEY = "lambroll-isle.digital-life.v1";
const LIFE_EVENT = "lambroll-isle:life-updated";
const MAX_MEMORIES = 28;

const TRAIT_UNLOCKS = [
  { at: 2, trait: "会先看向你" },
  { at: 4, trait: "围巾会记住你喜欢的颜色" },
  { at: 6, trait: "会在夜里等你说晚安" },
  { at: 9, trait: "开始把你们的日常变成共同记忆" },
  { at: 12, trait: "会用眼神回应你的情绪" }
] as const;

function defaultLifeState(): DigitalLifeState {
  const now = new Date().toISOString();
  return {
    sheepState: {
      luckyColorHex: "#7ea9df",
      luckyColorName: "云雾蓝",
      mood: "soft",
      scene: "chat",
      statusLine: "小羊卷在这里，安静地等你。",
      lastAwakeAt: now
    },
    growthState: {
      bondPoints: 0,
      bondLevel: 1,
      bondTitle: "刚刚相遇",
      streakDays: 1,
      ritualCount: 0,
      interactionCount: 0,
      traits: ["会在你点开页面时看向你"],
      lastDayKey: formatDayKey(new Date())
    },
    memoryState: [],
    waitlistState: []
  };
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function toDayTime(dayKey: string): number {
  const t = new Date(`${dayKey}T00:00:00`).getTime();
  return Number.isFinite(t) ? t : 0;
}

function nextStreak(lastDayKey: string, currentDayKey: string, current: number): number {
  if (!lastDayKey) return 1;
  if (lastDayKey === currentDayKey) return current;
  const diffDays = Math.round((toDayTime(currentDayKey) - toDayTime(lastDayKey)) / 86400000);
  if (diffDays === 1) return Math.max(1, current + 1);
  return 1;
}

function titleByLevel(level: number): string {
  if (level <= 1) return "刚刚相遇";
  if (level === 2) return "开始熟悉";
  if (level === 3) return "彼此依赖";
  if (level === 4) return "深度陪伴";
  return "共同生活中";
}

function traitsByPoints(points: number): string[] {
  const base = ["会在你点开页面时看向你"];
  TRAIT_UNLOCKS.forEach((item) => {
    if (points >= item.at) base.push(item.trait);
  });
  return base;
}

function pushMemory(state: DigitalLifeState, memory: LifeMemory): DigitalLifeState {
  return {
    ...state,
    memoryState: [memory, ...state.memoryState].slice(0, MAX_MEMORIES)
  };
}

function save(state: DigitalLifeState): DigitalLifeState {
  try {
    localStorage.setItem(LIFE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LIFE_EVENT, { detail: state }));
  }
  return state;
}

export function loadLifeState(): DigitalLifeState {
  const raw = safeParse<DigitalLifeState>(localStorage.getItem(LIFE_KEY));
  if (!raw) return defaultLifeState();
  const base = defaultLifeState();
  return {
    sheepState: { ...base.sheepState, ...raw.sheepState },
    growthState: { ...base.growthState, ...raw.growthState },
    memoryState: Array.isArray(raw.memoryState) ? raw.memoryState : base.memoryState,
    waitlistState: Array.isArray(raw.waitlistState) ? raw.waitlistState : base.waitlistState
  };
}

export function onLifeStateUpdate(handler: (state: DigitalLifeState) => void): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<DigitalLifeState>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener(LIFE_EVENT, listener as EventListener);
  return () => window.removeEventListener(LIFE_EVENT, listener as EventListener);
}

function withGrowth(state: DigitalLifeState, plus: number): GrowthState {
  const current = state.growthState;
  const points = Math.max(0, current.bondPoints + plus);
  const level = Math.min(5, 1 + Math.floor(points / 3));
  const dayKey = formatDayKey(new Date());
  return {
    ...current,
    bondPoints: points,
    bondLevel: level,
    bondTitle: titleByLevel(level),
    streakDays: nextStreak(current.lastDayKey, dayKey, current.streakDays),
    traits: traitsByPoints(points),
    lastDayKey: dayKey
  };
}

export function recordRitual(input: {
  colorHex: string;
  colorName: string;
  keyword: string;
  statusLine: string;
}): DigitalLifeState {
  const prev = loadLifeState();
  const now = new Date().toISOString();
  const growth = withGrowth(
    {
      ...prev,
      growthState: {
        ...prev.growthState,
        ritualCount: prev.growthState.ritualCount + 1
      }
    },
    2
  );

  const memory: LifeMemory = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: now,
    line: `你们一起抽到了${input.colorName}，小羊卷今天醒得很温柔。`,
    mood: "happy",
    scene: "color",
    colorHex: input.colorHex,
    colorName: input.colorName,
    keyword: input.keyword,
    tag: "ritual"
  };

  const next = pushMemory(
    {
      ...prev,
      sheepState: {
        luckyColorHex: input.colorHex,
        luckyColorName: input.colorName,
        mood: "happy",
        scene: "color",
        statusLine: input.statusLine,
        lastAwakeAt: now
      },
      growthState: growth
    },
    memory
  );

  return save(next);
}

export function recordInteraction(input: {
  action: "pet" | "cuddle" | "near" | "bedtime";
  mood: LifeMood;
  scene: LifeScene;
  statusLine: string;
  colorHex: string;
  colorName: string;
}): DigitalLifeState {
  const prev = loadLifeState();
  const now = new Date().toISOString();
  const actionWord: Record<typeof input.action, string> = {
    pet: "摸摸头",
    cuddle: "抱一抱",
    near: "靠近",
    bedtime: "今晚陪我"
  };

  const growth = withGrowth(
    {
      ...prev,
      growthState: {
        ...prev.growthState,
        interactionCount: prev.growthState.interactionCount + 1
      }
    },
    1
  );

  const memory: LifeMemory = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: now,
    line: `你点了「${actionWord[input.action]}」，它认真地回应了你。`,
    mood: input.mood,
    scene: input.scene,
    colorHex: input.colorHex,
    colorName: input.colorName,
    keyword: actionWord[input.action],
    tag: "interaction"
  };

  const next = pushMemory(
    {
      ...prev,
      sheepState: {
        luckyColorHex: input.colorHex,
        luckyColorName: input.colorName,
        mood: input.mood,
        scene: input.scene,
        statusLine: input.statusLine,
        lastAwakeAt: now
      },
      growthState: growth
    },
    memory
  );

  return save(next);
}

export function submitWaitlist(input: { name: string; email: string; intent: string }): DigitalLifeState {
  const prev = loadLifeState();
  const next: DigitalLifeState = {
    ...prev,
    waitlistState: [
      {
        name: input.name,
        email: input.email,
        intent: input.intent,
        submittedAt: new Date().toISOString()
      },
      ...prev.waitlistState
    ].slice(0, 80)
  };
  return save(next);
}

export function buildRelationshipNarrative(state: DigitalLifeState): { stageLine: string; nextLine: string } {
  const growth = state.growthState;
  const stageLine = `你们现在是「${growth.bondTitle}」关系（Lv.${growth.bondLevel}）`;
  const nextLine =
    growth.bondLevel >= 5
      ? "它已经把你当成固定陪伴对象，接下来重点是把记忆变得更深。"
      : `再完成 ${Math.max(1, growth.bondLevel * 3 - growth.bondPoints + 1)} 次陪伴互动，它会进入下一阶段。`;
  return { stageLine, nextLine };
}
