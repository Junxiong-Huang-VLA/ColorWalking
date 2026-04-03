import { formatDayKey } from "@colorwalking/shared";
import { pushBridgeOutputRemote } from "./services/backendApi";

export type LifeMood = "calm" | "soft" | "happy" | "sleepy" | "shy" | "sad";
export type LifeScene = "chat" | "comfort" | "bedtime" | "mood" | "color";
export type WaitlistUploadStatus = "filled" | "queued" | "uploading" | "success" | "failed";
export type WaitlistSource = "home" | "lucky" | "future" | "about" | "premiere" | "unknown";

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
  id: string;
  name: string;
  email: string;
  intent: string;
  source: WaitlistSource;
  status: WaitlistUploadStatus;
  retryCount: number;
  failReason?: string;
  followupRequestedAt?: string;
  submittedAt: string;
  updatedAt: string;
};

export type DeviceBridgeOutput = {
  id: string;
  createdAt: string;
  trigger:
    | "ritual"
    | "interaction"
    | "waitlist-filled"
    | "waitlist-queued"
    | "waitlist-uploading"
    | "waitlist-success"
    | "waitlist-failed"
    | "waitlist-followup"
    | "e2e-covered"
    | "manual";
  payload: {
    luckyColorHex: string;
    luckyColorName: string;
    mood: LifeMood;
    scene: LifeScene;
    statusLine: string;
    bondLevel: number;
    bondTitle: string;
    memoryCount: number;
    latestMemoryLine: string;
    waitlistStatus: WaitlistUploadStatus | "none";
    waitlistIntent: string;
    waitlistSource: WaitlistSource | "none";
  };
};

export type ClosureState = {
  bridgeOutputs: DeviceBridgeOutput[];
  e2eBaseline: {
    covered: boolean;
    coveredAt: string;
    note: string;
  };
};

export type DigitalLifeState = {
  sheepState: SheepState;
  growthState: GrowthState;
  memoryState: LifeMemory[];
  waitlistState: WaitlistEntry[];
  closureState: ClosureState;
};

export type ClosureChecklist = {
  luckyColorGenerated: boolean;
  sheepStateUpdated: boolean;
  interactionOccurred: boolean;
  growthWritten: boolean;
  memorySettled: boolean;
  waitlistRecorded: boolean;
  bridgeOutputGenerated: boolean;
  e2eBaselineCovered: boolean;
};

const LIFE_KEY = "lambroll-isle.digital-life.v1";
const LIFE_EVENT = "lambroll-isle:life-updated";
const MAX_MEMORIES = 28;
const MAX_WAITLIST_ENTRIES = 80;
const MAX_BRIDGE_OUTPUTS = 24;
const DEFAULT_STATUS_LINE = "小羊卷在这里，安静地等你。";

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
      statusLine: DEFAULT_STATUS_LINE,
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
    waitlistState: [],
    closureState: {
      bridgeOutputs: [],
      e2eBaseline: {
        covered: false,
        coveredAt: "",
        note: ""
      }
    }
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

function isLifeMood(value: unknown): value is LifeMood {
  return value === "calm" || value === "soft" || value === "happy" || value === "sleepy" || value === "shy" || value === "sad";
}

function isLifeScene(value: unknown): value is LifeScene {
  return value === "chat" || value === "comfort" || value === "bedtime" || value === "mood" || value === "color";
}

function isWaitlistStatus(value: unknown): value is WaitlistUploadStatus {
  return value === "filled" || value === "queued" || value === "uploading" || value === "success" || value === "failed";
}

function isWaitlistSource(value: unknown): value is WaitlistSource {
  return value === "home" || value === "lucky" || value === "future" || value === "about" || value === "premiere" || value === "unknown";
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function clampString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeWaitlistEntry(raw: unknown, index: number): WaitlistEntry {
  const item = (raw ?? {}) as Partial<WaitlistEntry>;
  const now = new Date().toISOString();
  const submittedAt = clampString(item.submittedAt, now);
  return {
    id: clampString(item.id, createId(`wl${index}`)),
    name: clampString(item.name, ""),
    email: clampString(item.email, ""),
    intent: clampString(item.intent, "想继续陪伴小羊卷"),
    source: isWaitlistSource(item.source) ? item.source : "unknown",
    status: isWaitlistStatus(item.status) ? item.status : "success",
    retryCount: typeof item.retryCount === "number" && Number.isFinite(item.retryCount) ? Math.max(0, item.retryCount) : 0,
    failReason: typeof item.failReason === "string" ? item.failReason : undefined,
    followupRequestedAt: typeof item.followupRequestedAt === "string" ? item.followupRequestedAt : undefined,
    submittedAt,
    updatedAt: clampString(item.updatedAt, submittedAt)
  };
}

function normalizeBridgeOutput(raw: unknown, index: number): DeviceBridgeOutput | null {
  const item = raw as Partial<DeviceBridgeOutput> | null | undefined;
  if (!item || typeof item !== "object") return null;
  if (
    item.trigger !== "ritual" &&
    item.trigger !== "interaction" &&
    item.trigger !== "waitlist-filled" &&
    item.trigger !== "waitlist-queued" &&
    item.trigger !== "waitlist-uploading" &&
    item.trigger !== "waitlist-success" &&
    item.trigger !== "waitlist-failed" &&
    item.trigger !== "waitlist-followup" &&
    item.trigger !== "e2e-covered" &&
    item.trigger !== "manual"
  ) {
    return null;
  }

  const payload = item.payload as DeviceBridgeOutput["payload"] | undefined;
  if (!payload) return null;

  return {
    id: clampString(item.id, createId(`bridge${index}`)),
    createdAt: clampString(item.createdAt, new Date().toISOString()),
    trigger: item.trigger,
    payload: {
      luckyColorHex: clampString(payload.luckyColorHex, "#7ea9df"),
      luckyColorName: clampString(payload.luckyColorName, "云雾蓝"),
      mood: isLifeMood(payload.mood) ? payload.mood : "soft",
      scene: isLifeScene(payload.scene) ? payload.scene : "chat",
      statusLine: clampString(payload.statusLine, DEFAULT_STATUS_LINE),
      bondLevel: typeof payload.bondLevel === "number" && Number.isFinite(payload.bondLevel) ? payload.bondLevel : 1,
      bondTitle: clampString(payload.bondTitle, "刚刚相遇"),
      memoryCount: typeof payload.memoryCount === "number" && Number.isFinite(payload.memoryCount) ? payload.memoryCount : 0,
      latestMemoryLine: clampString(payload.latestMemoryLine, ""),
      waitlistStatus: isWaitlistStatus(payload.waitlistStatus) ? payload.waitlistStatus : "none",
      waitlistIntent: clampString(payload.waitlistIntent, ""),
      waitlistSource: isWaitlistSource(payload.waitlistSource) ? payload.waitlistSource : "none"
    }
  };
}

function normalizeClosureState(raw: unknown): ClosureState {
  const item = (raw ?? {}) as Partial<ClosureState>;
  const bridgeRaw = Array.isArray(item.bridgeOutputs) ? item.bridgeOutputs : [];
  const bridgeOutputs = bridgeRaw
    .map((entry, index) => normalizeBridgeOutput(entry, index))
    .filter((entry): entry is DeviceBridgeOutput => Boolean(entry))
    .slice(0, MAX_BRIDGE_OUTPUTS);

  const e2e = item.e2eBaseline as Partial<ClosureState["e2eBaseline"]> | undefined;
  return {
    bridgeOutputs,
    e2eBaseline: {
      covered: Boolean(e2e?.covered),
      coveredAt: clampString(e2e?.coveredAt, ""),
      note: clampString(e2e?.note, "")
    }
  };
}

function buildDeviceBridgeOutput(
  state: DigitalLifeState,
  trigger: DeviceBridgeOutput["trigger"]
): DeviceBridgeOutput {
  const latestMemory = state.memoryState[0];
  const latestWaitlist = state.waitlistState[0];

  return {
    id: createId("bridge"),
    createdAt: new Date().toISOString(),
    trigger,
    payload: {
      luckyColorHex: state.sheepState.luckyColorHex,
      luckyColorName: state.sheepState.luckyColorName,
      mood: state.sheepState.mood,
      scene: state.sheepState.scene,
      statusLine: state.sheepState.statusLine,
      bondLevel: state.growthState.bondLevel,
      bondTitle: state.growthState.bondTitle,
      memoryCount: state.memoryState.length,
      latestMemoryLine: latestMemory?.line ?? "",
      waitlistStatus: latestWaitlist?.status ?? "none",
      waitlistIntent: latestWaitlist?.intent ?? "",
      waitlistSource: latestWaitlist?.source ?? "none"
    }
  };
}

function withBridgeOutput(state: DigitalLifeState, trigger: DeviceBridgeOutput["trigger"]): DigitalLifeState {
  return {
    ...state,
    closureState: {
      ...state.closureState,
      bridgeOutputs: [buildDeviceBridgeOutput(state, trigger), ...state.closureState.bridgeOutputs].slice(0, MAX_BRIDGE_OUTPUTS)
    }
  };
}

function allClosureStepsReady(checklist: ClosureChecklist): boolean {
  return (
    checklist.luckyColorGenerated &&
    checklist.sheepStateUpdated &&
    checklist.interactionOccurred &&
    checklist.growthWritten &&
    checklist.memorySettled &&
    checklist.waitlistRecorded &&
    checklist.bridgeOutputGenerated
  );
}

function withAutoE2ESeal(state: DigitalLifeState, note: string): DigitalLifeState {
  if (state.closureState.e2eBaseline.covered) return state;
  const checklist = buildClosureChecklist(state);
  if (!allClosureStepsReady(checklist)) return state;
  return {
    ...state,
    closureState: {
      ...state.closureState,
      e2eBaseline: {
        covered: true,
        coveredAt: new Date().toISOString(),
        note
      }
    }
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

function syncLatestBridgeOutput(state: DigitalLifeState): void {
  if (typeof window === "undefined") return;
  const latest = state.closureState.bridgeOutputs[0];
  if (!latest) return;
  const key = "lambroll-isle.bridge.synced-latest-id";
  if (window.sessionStorage.getItem(key) === latest.id) return;
  void (async () => {
    const result = await pushBridgeOutputRemote({
      id: latest.id,
      trigger: latest.trigger,
      payload: latest.payload as Record<string, unknown>,
      createdAt: latest.createdAt
    });
    if (result.ok) {
      window.sessionStorage.setItem(key, latest.id);
    }
  })();
}

function saveWithBridge(state: DigitalLifeState, trigger: DeviceBridgeOutput["trigger"]): DigitalLifeState {
  const next = save(withBridgeOutput(state, trigger));
  syncLatestBridgeOutput(next);
  return next;
}

export function loadLifeState(): DigitalLifeState {
  const raw = safeParse<DigitalLifeState>(localStorage.getItem(LIFE_KEY));
  if (!raw) return defaultLifeState();
  const base = defaultLifeState();
  const waitlistState = Array.isArray(raw.waitlistState)
    ? raw.waitlistState.map((entry, index) => normalizeWaitlistEntry(entry, index)).slice(0, MAX_WAITLIST_ENTRIES)
    : base.waitlistState;

  return {
    sheepState: {
      ...base.sheepState,
      ...raw.sheepState,
      mood: isLifeMood(raw.sheepState?.mood) ? raw.sheepState.mood : base.sheepState.mood,
      scene: isLifeScene(raw.sheepState?.scene) ? raw.sheepState.scene : base.sheepState.scene,
      statusLine: clampString(raw.sheepState?.statusLine, base.sheepState.statusLine),
      lastAwakeAt: clampString(raw.sheepState?.lastAwakeAt, base.sheepState.lastAwakeAt)
    },
    growthState: {
      ...base.growthState,
      ...raw.growthState,
      traits: Array.isArray(raw.growthState?.traits)
        ? raw.growthState.traits.filter((item): item is string => typeof item === "string").slice(0, 10)
        : base.growthState.traits
    },
    memoryState: Array.isArray(raw.memoryState) ? raw.memoryState : base.memoryState,
    waitlistState,
    closureState: normalizeClosureState(raw.closureState)
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
    id: createId("memory"),
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

  return saveWithBridge(next, "ritual");
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
    id: createId("memory"),
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

  return saveWithBridge(next, "interaction");
}

function updateWaitlistEntry(
  state: DigitalLifeState,
  entryId: string,
  updater: (entry: WaitlistEntry) => WaitlistEntry
): DigitalLifeState {
  return {
    ...state,
    waitlistState: state.waitlistState.map((entry) => (entry.id === entryId ? updater(entry) : entry))
  };
}

function insertWaitlistEntry(state: DigitalLifeState, entry: WaitlistEntry): DigitalLifeState {
  return {
    ...state,
    waitlistState: [entry, ...state.waitlistState.filter((item) => item.id !== entry.id)].slice(0, MAX_WAITLIST_ENTRIES)
  };
}

export function createWaitlistFilled(input: {
  id?: string;
  name: string;
  email: string;
  intent: string;
  source?: WaitlistSource;
  status?: WaitlistUploadStatus;
  retryCount?: number;
  failReason?: string;
  followupRequestedAt?: string;
  submittedAt?: string;
  updatedAt?: string;
}): DigitalLifeState {
  const prev = loadLifeState();
  const now = new Date().toISOString();
  const submittedAt = input.submittedAt ?? now;
  const updatedAt = input.updatedAt ?? submittedAt;
  const next = insertWaitlistEntry(prev, {
    id: input.id ?? createId("waitlist"),
    name: input.name,
    email: input.email,
    intent: input.intent,
    source: input.source ?? "unknown",
    status: input.status ?? "filled",
    retryCount: input.retryCount ?? 0,
    failReason: input.failReason,
    followupRequestedAt: input.followupRequestedAt,
    submittedAt,
    updatedAt
  });
  return saveWithBridge(next, "waitlist-filled");
}

export function applyWaitlistSnapshot(input: {
  id: string;
  name: string;
  email: string;
  intent: string;
  source?: WaitlistSource;
  status: WaitlistUploadStatus;
  retryCount?: number;
  failReason?: string;
  followupRequestedAt?: string;
  submittedAt?: string;
  updatedAt?: string;
}): DigitalLifeState {
  const prev = loadLifeState();
  const now = new Date().toISOString();
  const submittedAt = input.submittedAt ?? now;
  const updatedAt = input.updatedAt ?? submittedAt;
  const next = insertWaitlistEntry(prev, {
    id: input.id,
    name: input.name,
    email: input.email,
    intent: input.intent,
    source: input.source ?? "unknown",
    status: input.status,
    retryCount: input.retryCount ?? 0,
    failReason: input.failReason,
    followupRequestedAt: input.followupRequestedAt,
    submittedAt,
    updatedAt
  });
  const trigger =
    input.status === "filled"
      ? "waitlist-filled"
      : input.status === "queued"
        ? "waitlist-queued"
        : input.status === "uploading"
          ? "waitlist-uploading"
          : input.status === "success"
            ? "waitlist-success"
            : "waitlist-failed";
  return saveWithBridge(next, trigger);
}

export function queueWaitlistUpload(entryId: string): DigitalLifeState {
  const prev = loadLifeState();
  const next = updateWaitlistEntry(prev, entryId, (entry) => ({
    ...entry,
    status: "queued",
    failReason: undefined,
    updatedAt: new Date().toISOString()
  }));
  return saveWithBridge(next, "waitlist-queued");
}

export function startWaitlistUpload(entryId: string): DigitalLifeState {
  const prev = loadLifeState();
  const next = updateWaitlistEntry(prev, entryId, (entry) => ({
    ...entry,
    status: "uploading",
    failReason: undefined,
    updatedAt: new Date().toISOString()
  }));
  return saveWithBridge(next, "waitlist-uploading");
}

export function finishWaitlistUpload(input: { entryId: string; success: boolean; failReason?: string }): DigitalLifeState {
  const prev = loadLifeState();
  const next0 = updateWaitlistEntry(prev, input.entryId, (entry) => ({
    ...entry,
    status: input.success ? "success" : "failed",
    failReason: input.success ? undefined : input.failReason ?? "网络有点慢，请再试一次。",
    retryCount: input.success ? entry.retryCount : entry.retryCount + 1,
    updatedAt: new Date().toISOString()
  }));
  const next = input.success ? withAutoE2ESeal(next0, "waitlist-upload-success") : next0;
  return saveWithBridge(next, input.success ? "waitlist-success" : "waitlist-failed");
}

export function retryWaitlistUpload(entryId: string): DigitalLifeState {
  const prev = loadLifeState();
  const next = updateWaitlistEntry(prev, entryId, (entry) => ({
    ...entry,
    status: "queued",
    failReason: undefined,
    updatedAt: new Date().toISOString()
  }));
  return saveWithBridge(next, "waitlist-queued");
}

export function requestWaitlistFollowup(entryId: string): DigitalLifeState {
  const prev = loadLifeState();
  const next = updateWaitlistEntry(prev, entryId, (entry) => ({
    ...entry,
    followupRequestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  return saveWithBridge(next, "waitlist-followup");
}

export function submitWaitlist(input: { name: string; email: string; intent: string; source?: WaitlistSource }): DigitalLifeState {
  const filled = createWaitlistFilled(input);
  const latest = filled.waitlistState[0];
  if (!latest) return filled;
  queueWaitlistUpload(latest.id);
  startWaitlistUpload(latest.id);
  return finishWaitlistUpload({ entryId: latest.id, success: true });
}

export function latestWaitlistEntry(state: DigitalLifeState, source?: WaitlistSource): WaitlistEntry | null {
  if (!source) return state.waitlistState[0] ?? null;
  return state.waitlistState.find((item) => item.source === source) ?? null;
}

export function waitlistStatusLabel(status: WaitlistUploadStatus): string {
  if (status === "filled") return "已填写";
  if (status === "queued") return "待上传";
  if (status === "uploading") return "上传中";
  if (status === "success") return "上传成功";
  return "上传失败";
}

export function markE2EBaselineCovered(note: string): DigitalLifeState {
  const prev = loadLifeState();
  const next: DigitalLifeState = {
    ...prev,
    closureState: {
      ...prev.closureState,
      e2eBaseline: {
        covered: true,
        coveredAt: new Date().toISOString(),
        note
      }
    }
  };
  return saveWithBridge(next, "e2e-covered");
}

export function recordDeviceBridgeOutput(trigger: DeviceBridgeOutput["trigger"] = "manual"): DigitalLifeState {
  const prev = loadLifeState();
  return save(withBridgeOutput(prev, trigger));
}

export function buildClosureChecklist(state: DigitalLifeState): ClosureChecklist {
  const luckyColorGenerated = state.growthState.ritualCount > 0 || state.memoryState.some((item) => item.tag === "ritual");
  const interactionOccurred = state.growthState.interactionCount > 0 || state.memoryState.some((item) => item.tag === "interaction");
  const growthWritten = state.growthState.bondPoints > 0 || state.growthState.bondLevel > 1;
  const memorySettled = state.memoryState.length > 0;
  const waitlistRecorded = state.waitlistState.length > 0;
  const sheepStateUpdated =
    Boolean(state.sheepState.lastAwakeAt) &&
    (state.sheepState.statusLine !== DEFAULT_STATUS_LINE || luckyColorGenerated || interactionOccurred);
  const bridgeOutputGenerated = state.closureState.bridgeOutputs.length > 0;
  const e2eBaselineCovered = state.closureState.e2eBaseline.covered;

  return {
    luckyColorGenerated,
    sheepStateUpdated,
    interactionOccurred,
    growthWritten,
    memorySettled,
    waitlistRecorded,
    bridgeOutputGenerated,
    e2eBaselineCovered
  };
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
