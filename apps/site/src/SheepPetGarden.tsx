import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COLOR_PALETTE, formatDayKey } from "@colorwalking/shared";

type PetMemory = {
  id: string;
  at: string;
  icon: string;
  text: string;
};

type WalkTask = {
  status: "idle" | "walking" | "done";
  endsAt: string | null;
  lastDoneDayKey: string;
  souvenirPreview: string;
};

type PetState = {
  name: string;
  level: number;
  xp: number;
  hunger: number;
  energy: number;
  cleanliness: number;
  mood: number;
  favoriteColorId: string;
  lastInteractedAt: string;
  lastPlayAt: string;
  lastGreetDayKey: string;
  memories: PetMemory[];
  souvenirs: string[];
  walkTask: WalkTask;
  lastWheelBlessedId: string;
  lastUpdatedAt: string;
};

type WheelHistoryItem = {
  id?: string;
  dayKey: string;
  color?: { id?: string; name?: string; hex?: string; message?: string };
};

type PetAction = "idle" | "feed" | "play" | "rest" | "groom" | "pet" | "cuddle" | "hop" | "yawn" | "look";
type PetEmotion = "happy" | "needy" | "bored" | "sleepy" | "upset";

const PET_KEY = "colorwalking.pet.v1";
const DRAW_EVENT = "colorwalking:draw-updated";
const LEVEL_XP = 100;
const WALK_SECONDS = 30;
const WALK_SOUVENIRS = ["\u53f6\u5b50\u80f8\u9488", "\u5f69\u8679\u77f3", "\u7ed2\u6bdb\u56e2\u5b50", "\u5c0f\u94c3\u94db", "\u661f\u5149\u7f0e\u5e26"];
const PET_DIALOG = {
  idle: [
    "\u6211\u5728\u8fd9\u91cc\uff0c\u4f60\u6162\u6162\u6765\u5c31\u597d\u3002",
    "\u4f60\u5148\u5fd9\u4f60\u7684\uff0c\u6211\u4f1a\u5728\u65c1\u8fb9\u966a\u7740\u3002",
    "\u4eca\u5929\u4e5f\u6211\u4eec\u4e00\u8d77\u7a33\u7a33\u5730\u8fc7\u3002"
  ],
  click: [
    "\u8fd9\u4e00\u4e0b\u597d\u6e29\u67d4\uff0c\u6211\u8bb0\u4f4f\u4e86\u3002",
    "\u88ab\u4f60\u6478\u6478\uff0c\u6211\u5fc3\u60c5\u53d8\u5f97\u5f88\u5b89\u5b9a\u3002",
    "\u8c22\u8c22\u4f60\u62bd\u7a7a\u7406\u6211\uff0c\u6211\u6709\u88ab\u7167\u987e\u5230\u3002"
  ],
  care: [
    "\u4f60\u7167\u987e\u6211\u7684\u65f6\u5019\uff0c\u6211\u6574\u4e2a\u5fc3\u90fd\u5b89\u5b9a\u4e0b\u6765\u3002",
    "\u6709\u4f60\u5728\uff0c\u6211\u7684\u5c0f\u5fc3\u60c5\u5c31\u4e0d\u4f1a\u4e71\u8dd1\u3002",
    "\u88ab\u4f60\u8fd9\u6837\u653e\u5728\u5fc3\u4e0a\uff0c\u771f\u7684\u5f88\u5e78\u798f\u3002"
  ],
  cuddle: [
    "\u8fd9\u4e2a\u62b1\u62b1\u597d\u6696\uff0c\u6211\u4f1a\u8bb0\u5f88\u4e45\u3002",
    "\u548c\u4f60\u8d34\u8d34\u7684\u65f6\u5019\uff0c\u6211\u89c9\u5f97\u5f88\u5b89\u5fc3\u3002",
    "\u62b1\u62b1\u5b8c\u6210\uff0c\u6211\u53c8\u88ab\u8f7b\u8f7b\u5145\u6ee1\u7535\u4e86\u3002"
  ],
  hover: [
    "\u4f60\u770b\u6211\u7684\u65f6\u5019\uff0c\u6211\u4e5f\u5728\u60a0\u60a0\u5730\u770b\u4f60\u3002",
    "\u6211\u628a\u8033\u6735\u7ad6\u8d77\u6765\u4e86\uff0c\u5728\u542c\u4f60\u7684\u5fc3\u60c5\u3002"
  ],
  luckyBless: [
    "\u8fd9\u4e2a\u989c\u8272\u5f88\u9002\u5408\u4eca\u5929\u7684\u4f60\u3002",
    "\u6211\u5df2\u7ecf\u628a\u8fd9\u4e2a\u5e78\u8fd0\u8272\u8bb0\u4f4f\u4e86\uff0c\u4eca\u5929\u4e00\u8d77\u6162\u6162\u6765\u3002",
    "\u989c\u8272\u5df2\u7ecf\u62bd\u597d\u4e86\uff0c\u540e\u9762\u7684\u8def\u6211\u4e5f\u966a\u4f60\u8d70\u3002"
  ]
} as const;

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function calcMood(hunger: number, energy: number, cleanliness: number, level: number): number {
  const score = 20 + (100 - hunger) * 0.35 + energy * 0.3 + cleanliness * 0.25 + level * 1.2;
  return clamp(Math.round(score));
}

function makeMemory(icon: string, text: string, at = new Date()): PetMemory {
  return {
    id: `${at.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    at: at.toISOString(),
    icon,
    text
  };
}

function pushMemory(state: PetState, icon: string, text: string): PetState {
  const memories = [makeMemory(icon, text), ...state.memories].slice(0, 10);
  return { ...state, memories };
}

function hoursSince(iso: string): number {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return (Date.now() - time) / 3600000;
}

function inferEmotion(state: PetState): PetEmotion {
  if (state.energy < 28) return "sleepy";
  if (state.mood < 35 || state.hunger > 80) return "upset";
  if (hoursSince(state.lastInteractedAt) > 8) return "needy";
  if (hoursSince(state.lastPlayAt) > 4) return "bored";
  return "happy";
}

function emotionLabel(emotion: PetEmotion): string {
  if (emotion === "sleepy") return "\u56f0\u56f0";
  if (emotion === "upset") return "\u59d4\u5c48";
  if (emotion === "needy") return "\u60f3\u4f60";
  if (emotion === "bored") return "\u65e0\u804a";
  return "\u5f00\u5fc3";
}

function emotionVoice(emotion: PetEmotion): string {
  if (emotion === "sleepy") return "\u6211\u6709\u70b9\u56f0\u4e86\uff0c\u60f3\u5728\u4f60\u65c1\u8fb9\u5b89\u9759\u5f85\u4e00\u4f1a\u3002";
  if (emotion === "upset") return "\u6211\u5fc3\u91cc\u6709\u70b9\u4e71\uff0c\u4f60\u5728\u7684\u8bdd\u6211\u4f1a\u597d\u5f88\u591a\u3002";
  if (emotion === "needy") return "\u6211\u521a\u624d\u4e00\u76f4\u5728\u7b49\u4f60\uff0c\u4f60\u6765\u4e86\u6211\u5c31\u653e\u5fc3\u4e86\u3002";
  if (emotion === "bored") return "\u6211\u60f3\u548c\u4f60\u73a9\u4e00\u4f1a\uff0c\u6211\u4eec\u4e00\u8d77\u52a8\u4e00\u52a8\u5427\u3002";
  return "\u6211\u4eca\u5929\u72b6\u6001\u4e0d\u9519\uff0c\u60f3\u597d\u597d\u966a\u5728\u4f60\u8eab\u8fb9\u3002";
}

function defaultPet(): PetState {
  const favorite = COLOR_PALETTE[0]?.id ?? "sunrise-coral";
  const now = new Date();
  const nowIso = now.toISOString();
  return {
    name: "\u5c0f\u7f8a\u5377",
    level: 1,
    xp: 0,
    hunger: 25,
    energy: 75,
    cleanliness: 80,
    mood: 85,
    favoriteColorId: favorite,
    lastInteractedAt: nowIso,
    lastPlayAt: nowIso,
    lastGreetDayKey: formatDayKey(now),
    memories: [makeMemory("\ud83d\udc9b", "\u7b2c\u4e00\u5929\u5165\u4f4f\u5c0f\u7f8a\u5377\u517b\u6210\u8231\uff0c\u5b83\u5f88\u9ad8\u5174\u8ba4\u8bc6\u4f60\u3002", now)],
    souvenirs: [],
    walkTask: { status: "idle", endsAt: null, lastDoneDayKey: "", souvenirPreview: "" },
    lastWheelBlessedId: "",
    lastUpdatedAt: nowIso
  };
}

function normalizePet(state: PetState): PetState {
  const base = defaultPet();
  return {
    ...base,
    ...state,
    memories: Array.isArray(state.memories) ? state.memories : base.memories,
    souvenirs: Array.isArray(state.souvenirs) ? state.souvenirs : [],
    walkTask: state.walkTask
      ? {
          status: state.walkTask.status ?? "idle",
          endsAt: state.walkTask.endsAt ?? null,
          lastDoneDayKey: state.walkTask.lastDoneDayKey ?? "",
          souvenirPreview: state.walkTask.souvenirPreview ?? ""
        }
      : base.walkTask,
    lastWheelBlessedId: state.lastWheelBlessedId ?? ""
  };
}

function applyDecay(state: PetState): PetState {
  const now = Date.now();
  const prev = new Date(state.lastUpdatedAt).getTime();
  if (!Number.isFinite(prev) || prev >= now) return { ...state, lastUpdatedAt: new Date(now).toISOString() };

  const hours = (now - prev) / 3600000;
  if (hours < 0.01) return state;

  const hunger = clamp(state.hunger + hours * 3.4);
  const energy = clamp(state.energy - hours * 2.6);
  const cleanliness = clamp(state.cleanliness - hours * 2.2);
  const mood = calcMood(hunger, energy, cleanliness, state.level);

  return {
    ...state,
    hunger,
    energy,
    cleanliness,
    mood,
    lastUpdatedAt: new Date(now).toISOString()
  };
}

function loadPet(): PetState {
  try {
    const raw = localStorage.getItem(PET_KEY);
    if (!raw) return defaultPet();
    const parsed = JSON.parse(raw) as PetState;
    return applyDecay(normalizePet(parsed));
  } catch {
    return defaultPet();
  }
}

function savePet(state: PetState) {
  localStorage.setItem(PET_KEY, JSON.stringify(state));
}

function gainXp(state: PetState, amount: number): PetState {
  let xp = state.xp + amount;
  let level = state.level;
  while (xp >= LEVEL_XP) {
    xp -= LEVEL_XP;
    level += 1;
  }
  return { ...state, level, xp };
}

function todayLuckyColorId(): string | null {
  try {
    const raw = localStorage.getItem("colorwalking.web.history.v1");
    if (!raw) return null;
    const list = JSON.parse(raw) as WheelHistoryItem[];
    const today = formatDayKey(new Date());
    const item = list.find((x) => x?.dayKey === today);
    return item?.color?.id ?? null;
  } catch {
    return null;
  }
}

function moodText(mood: number): string {
  if (mood >= 85) return "\u4eca\u5929\u7f8a\u5377\u5f88\u8f7b\u5feb\uff0c\u60f3\u966a\u4f60\u591a\u8d70\u4e00\u4f1a\u3002";
  if (mood >= 65) return "\u72b6\u6001\u5f88\u5e73\u7a33\uff0c\u5c31\u8fd9\u6837\u6162\u6162\u4fdd\u6301\u5c31\u597d\u3002";
  if (mood >= 40) return "\u7f8a\u5377\u6709\u70b9\u6ca1\u7cbe\u795e\uff0c\u60f3\u88ab\u4f60\u518d\u7167\u987e\u4e00\u4e0b\u3002";
  return "\u7f8a\u5377\u6b63\u5728\u4f4e\u843d\u671f\uff0c\u6478\u6478\u5b83\u6216\u966a\u5b83\u73a9\u4e00\u4e0b\u5427\u3002";
}

function reactionByAction(action: PetAction): string {
  if (action === "feed") return "\ud83c\udf3f";
  if (action === "play") return "\ud83c\udf89";
  if (action === "rest") return "\ud83d\udca4";
  if (action === "groom") return "\u2728";
  if (action === "cuddle") return "\ud83e\udd17";
  if (action === "hop") return "\ud83d\udc83";
  if (action === "yawn") return "\ud83d\ude2a";
  if (action === "look") return "\ud83d\udc40";
  return "\ud83d\udc95";
}

function linesByAction(action: PetAction): readonly string[] {
  if (action === "cuddle") return PET_DIALOG.cuddle;
  if (action === "pet") return PET_DIALOG.click;
  if (action === "look") return PET_DIALOG.hover;
  if (action === "feed" || action === "play" || action === "rest" || action === "groom") return PET_DIALOG.care;
  return PET_DIALOG.idle;
}

function pickIdleAction(emotion: PetEmotion): { action: PetAction; hint: string } {
  if (emotion === "sleepy") {
    return Math.random() > 0.45
      ? { action: "yawn", hint: "\u7f8a\u5377\u6253\u4e86\u4e2a\u54c8\u6b20\uff0c\u6162\u6162\u5730\u9760\u8fd1\u4f60\u3002" }
      : { action: "look", hint: "\u7f8a\u5377\u773c\u795e\u8f6f\u8f6f\u7684\uff0c\u50cf\u5728\u5bfb\u627e\u4e00\u70b9\u5b89\u5fc3\u611f\u3002" };
  }
  if (emotion === "upset") {
    return Math.random() > 0.5
      ? { action: "look", hint: "\u7f8a\u5377\u60c5\u7eea\u6709\u70b9\u4f4e\uff0c\u6b63\u5728\u7b49\u4f60\u6478\u6478\u5b83\u3002" }
      : { action: "yawn", hint: "\u7f8a\u5377\u5c0f\u58f0\u54fc\u4e86\u4e00\u4e0b\uff0c\u50cf\u5728\u5411\u4f60\u8981\u5b89\u6170\u3002" };
  }
  if (emotion === "needy") {
    return Math.random() > 0.45
      ? { action: "look", hint: "\u7f8a\u5377\u542c\u5230\u4f60\u7684\u52a8\u9759\uff0c\u7acb\u523b\u671b\u8fc7\u6765\u4e86\u3002" }
      : { action: "hop", hint: "\u7f8a\u5377\u5728\u539f\u5730\u8df3\u4e86\u4e00\u4e0b\uff0c\u50cf\u5728\u8bf4\u201c\u6211\u5728\u8fd9\u91cc\u201d\u3002" };
  }
  if (emotion === "bored") {
    return Math.random() > 0.4
      ? { action: "hop", hint: "\u7f8a\u5377\u60f3\u627e\u70b9\u4e50\u5b50\uff0c\u5728\u7b49\u4f60\u548c\u5b83\u4e00\u8d77\u73a9\u3002" }
      : { action: "look", hint: "\u7f8a\u5377\u5230\u5904\u770b\u4e86\u770b\uff0c\u597d\u50cf\u60f3\u51fa\u53bb\u8d70\u8d70\u3002" };
  }
  return Math.random() > 0.5
    ? { action: "hop", hint: "\u7f8a\u5377\u5fc3\u60c5\u4e0d\u9519\uff0c\u60f3\u5728\u4f60\u8eab\u8fb9\u591a\u505c\u7559\u4e00\u4f1a\u3002" }
    : { action: "look", hint: "\u7f8a\u5377\u6b6a\u5934\u770b\u4f60\uff0c\u773c\u795e\u91cc\u6709\u5f88\u591a\u4f9d\u8d56\u3002" };
}

function dailyGreeting(name: string): string {
  const pool = [
    `\u65b0\u7684\u4e00\u5929\u5f00\u59cb\u4e86\uff0c${name}\u5df2\u7ecf\u5728\u8fd9\u91cc\u7b49\u4f60\u3002`,
    `\u4eca\u5929\u4e5f\u8bf7\u597d\u597d\u7167\u987e\u81ea\u5df1\uff0c${name}\u4f1a\u4e00\u76f4\u966a\u7740\u4f60\u3002`,
    `\u4f60\u4e00\u51fa\u73b0\uff0c${name}\u6574\u4e2a\u5fc3\u60c5\u90fd\u4eae\u4e86\u4e00\u70b9\u3002`
  ];
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
}

function formatTimeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

function latestWheelDraw(): WheelHistoryItem | null {
  try {
    const raw = localStorage.getItem("colorwalking.web.history.v1");
    if (!raw) return null;
    const list = JSON.parse(raw) as WheelHistoryItem[];
    return list[0] ?? null;
  } catch {
    return null;
  }
}

function pickLine(lines: readonly string[], lastLine: string): string {
  if (!lines.length) return "";
  if (lines.length === 1) return lines[0] ?? "";
  const pool = lines.filter((x) => x !== lastLine);
  const list = pool.length ? pool : lines;
  return list[Math.floor(Math.random() * list.length)] ?? list[0] ?? "";
}

export function SheepPetGarden() {
  const [pet, setPet] = useState<PetState>(() => loadPet());
  const [hint, setHint] = useState("\u6b22\u8fce\u6765\u5230\u5c0f\u7f8a\u5377\u7684\u5c0f\u5c4b\uff0c\u6bcf\u5929\u6765\u770b\u5b83\u4e00\u6b21\uff0c\u5b83\u4f1a\u6162\u6162\u66f4\u4f9d\u8d56\u4f60\u3002");
  const [bubbleText, setBubbleText] = useState("\u6211\u5728\u8fd9\u91cc\uff0c\u6162\u6162\u966a\u7740\u4f60\u3002");
  const [bubbleTick, setBubbleTick] = useState(0);
  const [petAction, setPetAction] = useState<PetAction>("idle");
  const [reaction, setReaction] = useState("");
  const [walkCountdown, setWalkCountdown] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdTriggeredRef = useRef(false);
  const lastLineRef = useRef("");
  const hoverAtRef = useRef(0);

  const favoriteColor = useMemo(
    () => COLOR_PALETTE.find((c) => c.id === pet.favoriteColorId) ?? COLOR_PALETTE[0],
    [pet.favoriteColorId]
  );
  const emotion = useMemo(() => inferEmotion(pet), [pet]);
  const xpPercent = Math.round((pet.xp / LEVEL_XP) * 100);
  const hungerValue = Math.round(pet.hunger);
  const energyValue = Math.round(pet.energy);
  const cleanValue = Math.round(pet.cleanliness);
  const eyesClosed = pet.energy < 22;
  const smileWide = pet.mood >= 70;

  const triggerAction = useCallback((action: PetAction) => {
    setPetAction(action);
    setReaction(reactionByAction(action));
    window.setTimeout(() => setPetAction("idle"), 900);
    window.setTimeout(() => setReaction(""), 1100);
  }, []);

  const speak = useCallback((lines: readonly string[]) => {
    const line = pickLine(lines, lastLineRef.current);
    if (!line) return "";
    lastLineRef.current = line;
    setBubbleText(line);
    setBubbleTick((x) => x + 1);
    return line;
  }, []);

  useEffect(() => {
    const today = formatDayKey(new Date());
    setPet((prev) => {
      if (prev.lastGreetDayKey === today) return prev;
      const next = pushMemory(
        {
          ...prev,
          mood: clamp(prev.mood + 3),
          lastGreetDayKey: today,
          lastUpdatedAt: new Date().toISOString()
        },
        "\ud83c\udf1e",
        "\u4eca\u65e5\u95ee\u5019\uff1a\u4f60\u4e00\u51fa\u73b0\uff0c\u5b83\u5c31\u6162\u6162\u5b89\u5fc3\u4e86\u3002"
      );
      savePet(next);
      setHint(dailyGreeting(prev.name));
      speak(PET_DIALOG.idle);
      return next;
    });
  }, [speak]);

  useEffect(() => {
    const delay = 6000 + Math.floor(Math.random() * 6000);
    const timer = window.setTimeout(() => {
      const auto = pickIdleAction(inferEmotion(pet));
      triggerAction(auto.action);
      setHint(auto.hint);
      speak(PET_DIALOG.idle);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [pet, triggerAction, speak]);

  useEffect(() => {
    if (pet.walkTask.status !== "walking" || !pet.walkTask.endsAt) {
      setWalkCountdown(0);
      return;
    }
    const tick = () => {
      const remain = Math.max(0, Math.ceil((new Date(pet.walkTask.endsAt ?? 0).getTime() - Date.now()) / 1000));
      setWalkCountdown(remain);
      if (remain > 0) return;
      const souvenir = WALK_SOUVENIRS[Math.floor(Math.random() * WALK_SOUVENIRS.length)] ?? WALK_SOUVENIRS[0];
      triggerAction("hop");
      setPet((prev) => {
        if (prev.walkTask.status !== "walking") return prev;
        const today = formatDayKey(new Date());
        const base = gainXp(
          {
            ...prev,
            walkTask: {
              status: "done",
              endsAt: null,
              lastDoneDayKey: today,
              souvenirPreview: souvenir
            },
            souvenirs: [souvenir, ...prev.souvenirs].slice(0, 6),
            mood: clamp(prev.mood + 10),
            energy: clamp(prev.energy - 8),
            hunger: clamp(prev.hunger + 10)
          },
          16
        );
        const mood = calcMood(base.hunger, base.energy, base.cleanliness, base.level);
        const done = pushMemory(
          {
            ...base,
            mood,
            lastInteractedAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString()
          },
          "\ud83c\udf81",
          `\u6563\u6b65\u5b8c\u6210\uff0c\u5e26\u56de\u4e86${souvenir}\u3002`
        );
        savePet(done);
        return done;
      });
      setHint(`\u6563\u6b65\u56de\u6765\u4e86\uff0c\u5b83\u60f3\u628a${souvenir}\u9001\u7ed9\u4f60\u3002`);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [pet.walkTask.status, pet.walkTask.endsAt, triggerAction]);

  const blessFromDraw = useCallback((draw: WheelHistoryItem | null) => {
    if (!draw?.id || !draw.color?.id) return;
    setPet((prev) => {
      if (prev.lastWheelBlessedId === draw.id) return prev;
      const blessedLine = speak(PET_DIALOG.luckyBless);
      const base = gainXp(
        {
          ...prev,
          favoriteColorId: draw.color.id ?? prev.favoriteColorId,
          mood: clamp(prev.mood + 6),
          lastWheelBlessedId: draw.id
        },
        8
      );
      const mood = calcMood(base.hunger, base.energy, base.cleanliness, base.level);
      const next = pushMemory(
        {
          ...base,
          mood,
          lastInteractedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        },
        "\ud83c\udf08",
        `\u4f60\u62bd\u5230\u4e86${draw.color.name ?? "\u5e78\u8fd0\u8272"}\uff0c\u7f8a\u5377\u4e3a\u4f60\u8bb0\u4e0b\u4e86\u4eca\u5929\u7684\u8fd9\u4efd\u989c\u8272\u3002`
      );
      savePet(next);
      if (blessedLine) {
        setHint(blessedLine);
      }
      triggerAction("pet");
      return next;
    });
  }, [speak, triggerAction]);

  useEffect(() => {
    blessFromDraw(latestWheelDraw());
  }, [blessFromDraw]);

  useEffect(() => {
    const onDrawUpdate = (e: Event) => {
      const detail = (e as CustomEvent<WheelHistoryItem>).detail;
      blessFromDraw(detail ?? latestWheelDraw());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "colorwalking.web.history.v1") {
        blessFromDraw(latestWheelDraw());
      }
    };
    window.addEventListener(DRAW_EVENT, onDrawUpdate as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DRAW_EVENT, onDrawUpdate as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, [blessFromDraw]);

  const runAction = (action: PetAction, updater: (state: PetState) => PetState, message: string, memory?: { icon: string; text: string }) => {
    triggerAction(action);
    speak(linesByAction(action));
    setPet((prev) => {
      const decayed = applyDecay(prev);
      const nextBase = updater(decayed);
      const mood = calcMood(nextBase.hunger, nextBase.energy, nextBase.cleanliness, nextBase.level);
      const nowIso = new Date().toISOString();
      const next0 = {
        ...nextBase,
        mood,
        lastInteractedAt: nowIso,
        lastPlayAt: action === "play" ? nowIso : nextBase.lastPlayAt,
        lastUpdatedAt: nowIso
      };
      const next = memory ? pushMemory(next0, memory.icon, memory.text) : next0;
      savePet(next);
      return next;
    });
    setHint(message);
  };

  const feed = () =>
    runAction(
      "feed",
      (s) => gainXp({ ...s, hunger: clamp(s.hunger - 24), energy: clamp(s.energy + 4) }, 14),
      "\u4f60\u5582\u4e86\u4e00\u70b9\u5c0f\u70b9\u5fc3\uff0c\u5c0f\u7f8a\u5377\u72b6\u6001\u597d\u4e86\u8bb8\u591a\u3002",
      { icon: "\ud83c\udf3f", text: "\u4f60\u4eec\u5206\u4eab\u4e86\u4e00\u6b21\u8f7b\u677e\u7684\u5c0f\u70b9\u5fc3\u65f6\u95f4\u3002" }
    );

  const play = () =>
    runAction(
      "play",
      (s) =>
        gainXp(
          {
            ...s,
            hunger: clamp(s.hunger + 8),
            energy: clamp(s.energy - 14),
            cleanliness: clamp(s.cleanliness - 6)
          },
          20
        ),
      "\u4f60\u966a\u5b83\u8dd1\u5708\u73a9\u7403\uff0c\u6bdb\u5377\u98de\u8d77\u6765\u4e86\u3002",
      { icon: "\ud83c\udf89", text: "\u4f60\u4eec\u4e00\u8d77\u73a9\u5f97\u5f88\u5f00\u5fc3\uff0c\u5fc3\u60c5\u4e5f\u6d3b\u8dc3\u4e86\u4e00\u70b9\u3002" }
    );

  const rest = () =>
    runAction(
      "rest",
      (s) => gainXp({ ...s, energy: clamp(s.energy + 26), hunger: clamp(s.hunger + 4) }, 10),
      "\u5c0f\u7f8a\u5377\u6253\u4e86\u4e2a\u5c0f\u76f9\uff0c\u6162\u6162\u56de\u590d\u4e86\u7cbe\u795e\u3002",
      { icon: "\ud83d\udca4", text: "\u5b83\u5728\u4f60\u8eab\u8fb9\u5b89\u5fc3\u5730\u4f11\u606f\u4e86\u4e00\u4f1a\u513f\u3002" }
    );

  const groom = () =>
    runAction(
      "groom",
      (s) => gainXp({ ...s, cleanliness: clamp(s.cleanliness + 24), mood: clamp(s.mood + 8) }, 12),
      "\u4f60\u5e2e\u5b83\u68b3\u4e86\u6bdb\uff0c\u5b83\u770b\u8d77\u6765\u66f4\u8212\u670d\u4e86\u3002",
      { icon: "\u2728", text: "\u5c0f\u7f8a\u5377\u88ab\u4f60\u6253\u7406\u5f97\u5f88\u5e72\u51c0\uff0c\u7cbe\u795e\u4e5f\u597d\u4e86\u8d77\u6765\u3002" }
    );

  const petHead = () =>
    runAction(
      "pet",
      (s) => gainXp({ ...s, mood: clamp(s.mood + 6), energy: clamp(s.energy + 2) }, 6),
      "\u5c0f\u7f8a\u5377\u88ab\u4f60\u6478\u5f97\u5f88\u5f00\u5fc3\uff0c\u6574\u4e2a\u4eba\u90fd\u8f6f\u4e0b\u6765\u4e86\u3002",
      { icon: "\ud83d\udc95", text: "\u4f60\u6478\u4e86\u6478\u5b83\uff0c\u5b83\u7528\u4f9d\u8d56\u56de\u5e94\u4e86\u4f60\u3002" }
    );

  const cuddle = () =>
    runAction(
      "cuddle",
      (s) => gainXp({ ...s, mood: clamp(s.mood + 12), energy: clamp(s.energy + 6) }, 10),
      "\u4f60\u62b1\u4e86\u62b1\u5b83\uff0c\u7f8a\u5377\u6162\u6162\u653e\u677e\u4e0b\u6765\uff0c\u4f60\u4e5f\u53ef\u4ee5\u4f11\u606f\u4e00\u4e0b\u4e86\u3002",
      { icon: "\ud83e\udd17", text: "\u4f60\u4eec\u5206\u4eab\u4e86\u4e00\u4e2a\u62b1\u62b1\uff0c\u5fc3\u60c5\u90fd\u53d8\u67d4\u548c\u4e86\u3002" }
    );

  const startHold = () => {
    holdTriggeredRef.current = false;
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      holdTriggeredRef.current = true;
      cuddle();
    }, 600);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const onAvatarClick = () => {
    if (holdTriggeredRef.current) {
      holdTriggeredRef.current = false;
      return;
    }
    petHead();
  };

  const onAvatarHover = () => {
    const now = Date.now();
    if (now - hoverAtRef.current < 2200) return;
    hoverAtRef.current = now;
    triggerAction("look");
    speak(PET_DIALOG.hover);
  };

  const startWalkTask = () => {
    const nowMs = Date.now();
    const today = formatDayKey(new Date());
    const remainSec = pet.walkTask.endsAt ? Math.max(0, Math.ceil((new Date(pet.walkTask.endsAt).getTime() - nowMs) / 1000)) : 0;
    if (pet.walkTask.status === "walking" && remainSec > 0) {
      setHint(`\u5b83\u6b63\u5728\u6563\u6b65\uff0c\u8fd8\u6709 ${remainSec}s \u5c31\u56de\u6765\u966a\u4f60\u3002`);
      return;
    }
    if (pet.walkTask.lastDoneDayKey === today) {
      setHint("\u4eca\u5929\u7684\u6563\u6b65\u4efb\u52a1\u5df2\u7ecf\u5b8c\u6210\u4e86\uff0c\u660e\u5929\u6211\u4eec\u518d\u6162\u6162\u51fa\u53d1\u3002");
      return;
    }
    runAction(
      "play",
      (s) =>
        gainXp(
          {
            ...s,
            walkTask: {
              ...s.walkTask,
              status: "walking",
              endsAt: new Date(Date.now() + WALK_SECONDS * 1000).toISOString(),
              souvenirPreview: ""
            }
          },
          6
        ),
      "\u5c0f\u7f8a\u5377\u51fa\u53d1\u53bb\u6563\u6b65\u4e86\uff0c30\u79d2\u540e\u4f1a\u5e26\u4e00\u4efd\u5c0f\u793c\u7269\u56de\u6765\u3002",
      { icon: "\ud83d\udeb6", text: "\u4f60\u4eec\u5f00\u59cb\u4e86\u4e00\u6b21\u8f7b\u8f7b\u7684\u6563\u6b65\u4efb\u52a1\u3002" }
    );
    setWalkCountdown(WALK_SECONDS);
  };

  const syncLuckyColor = () => {
    const colorId = todayLuckyColorId();
    if (!colorId) {
      setHint("\u4eca\u5929\u8fd8\u6ca1\u6709\u62bd\u989c\u8272\uff0c\u53ef\u4ee5\u5148\u53bb\u8f6c\u76d8\u770b\u770b\u3002");
      return;
    }

    runAction(
      "pet",
      (s) => gainXp({ ...s, favoriteColorId: colorId, mood: clamp(s.mood + 12) }, 18),
      "\u5c0f\u7f8a\u5377\u6362\u4e0a\u4e86\u4eca\u5929\u7684\u989c\u8272\u56f4\u5dfe\uff0c\u770b\u8d77\u6765\u5f88\u5f00\u5fc3\u3002",
      { icon: "\ud83c\udf08", text: "\u4f60\u4eec\u5b8c\u6210\u4e86\u4eca\u65e5\u989c\u8272\u7684\u5c0f\u5c0f\u540c\u6b65\u3002" }
    );
  };

  const walkStatusText =
    pet.walkTask.status === "walking"
      ? `\u6563\u6b65\u4e2d... ${walkCountdown}s`
      : pet.walkTask.lastDoneDayKey === formatDayKey(new Date())
        ? "\u4eca\u65e5\u5df2\u5b8c\u6210"
        : "\u672a\u5f00\u59cb";
  const walkProgress =
    pet.walkTask.status === "walking"
      ? Math.round(((WALK_SECONDS - Math.max(0, walkCountdown)) / WALK_SECONDS) * 100)
      : pet.walkTask.lastDoneDayKey === formatDayKey(new Date())
        ? 100
        : 0;

  return (
    <section id="pet" className="section pet-card">
      <h2>{"\u5c0f\u7f8a\u5377\u517b\u6210\u8231"}</h2>
      <p className="pet-desc">
        {"\u6bcf\u5929\u6765\u770b\u770b\u5c0f\u7f8a\u5377\uff0c\u5b83\u4f1a\u5728\u4f60\u7684\u966a\u4f34\u91cc\u6162\u6162\u957f\u5927\u3002\u70b9\u51fb\u53ef\u4ee5\u6478\u5934\uff0c\u957f\u6309\u53ef\u4ee5\u62b1\u62b1\u3002"}
      </p>

      <div className="pet-layout">
        <div className="pet-avatar-box">
          <p className="pet-presence"><i />{"\u5c0f\u7f8a\u5377\u5728\u8fd9\u91cc\u966a\u4f60"}</p>
          <div key={bubbleTick} className="pet-bubble pet-bubble-live">{bubbleText}</div>
          <button
            type="button"
            className={`pet-avatar pet-${petAction}`}
            style={{ ["--accent" as string]: favoriteColor?.hex ?? "#ffd93d" }}
            onMouseEnter={onAvatarHover}
            onFocus={onAvatarHover}
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            onClick={onAvatarClick}
            aria-label={"\u6478\u6478\u5c0f\u7f8a\u5377"}
          >
            {reaction ? <span className="pet-reaction">{reaction}</span> : null}
            <svg viewBox="0 0 240 190" role="img" aria-label="sheep-roll">
              <ellipse cx="120" cy="108" rx="84" ry="62" fill="#fff" stroke="#e5ecf7" strokeWidth="4" />
              <circle cx="78" cy="78" r="16" fill="#f7f1e8" className="pet-ear pet-ear-left" />
              <circle cx="162" cy="78" r="16" fill="#f7f1e8" className="pet-ear pet-ear-right" />
              <circle cx="120" cy="108" r="42" fill="#fdfbf7" stroke="#edf2fb" strokeWidth="3" />
              {eyesClosed ? (
                <>
                  <path d="M101 102 L111 102" stroke="#1f2a44" strokeWidth="3" strokeLinecap="round" />
                  <path d="M129 102 L139 102" stroke="#1f2a44" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="106" cy="102" r="4" fill="#1f2a44" className="pet-eye" />
                  <circle cx="134" cy="102" r="4" fill="#1f2a44" className="pet-eye" />
                </>
              )}
              {smileWide ? (
                <path d="M102 120 Q120 142 138 120" fill="none" stroke="#1f2a44" strokeWidth="4" strokeLinecap="round" className="pet-mouth" />
              ) : (
                <path d="M106 124 Q120 132 134 124" fill="none" stroke="#1f2a44" strokeWidth="4" strokeLinecap="round" className="pet-mouth" />
              )}
              <path d="M63 52 C90 24, 150 24, 177 52" fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" />
              <path d="M95 56 C104 47, 113 47, 122 56" fill="none" stroke="#7db5ff" strokeWidth="5" strokeLinecap="round" />
              <path d="M118 58 C127 49, 136 49, 145 58" fill="none" stroke="#ffd76f" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </button>
          <p className="pet-name">{pet.name} · Lv.{pet.level}</p>
          <p className="pet-status">
            <b>{emotionLabel(emotion)}</b> · {emotionVoice(emotion)}
          </p>
          <p className="pet-mood">{moodText(pet.mood)}</p>
        </div>

        <div className="pet-panel">
          <div className="pet-meter">
            <span>{"\u7ecf\u9a8c"}</span>
            <div><i style={{ width: `${xpPercent}%` }} /></div>
            <b>{pet.xp}/{LEVEL_XP}</b>
          </div>
          <div className="pet-meter">
            <span>{"\u5fc3\u60c5"}</span>
            <div><i style={{ width: `${pet.mood}%` }} /></div>
            <b>{pet.mood}</b>
          </div>
          <div className="pet-meter">
            <span>{"\u9965\u997f"}</span>
            <div><i style={{ width: `${hungerValue}%` }} /></div>
            <b>{hungerValue}</b>
          </div>
          <div className="pet-meter">
            <span>{"\u7cbe\u529b"}</span>
            <div><i style={{ width: `${energyValue}%` }} /></div>
            <b>{energyValue}</b>
          </div>
          <div className="pet-meter">
            <span>{"\u6f54\u51c0"}</span>
            <div><i style={{ width: `${cleanValue}%` }} /></div>
            <b>{cleanValue}</b>
          </div>

          <div className="pet-actions">
            <button type="button" onClick={feed}>{"\u5582\u98df"}</button>
            <button type="button" onClick={play}>{"\u966a\u5b83\u73a9"}</button>
            <button type="button" onClick={rest}>{"\u4f11\u606f"}</button>
            <button type="button" onClick={groom}>{"\u68b3\u6bdb"}</button>
            <button type="button" onClick={startWalkTask}>{"\u53bb\u6563\u4e2a\u6b65"}</button>
            <button type="button" className="pet-lucky" onClick={syncLuckyColor}>{"\u540c\u6b65\u4eca\u65e5\u989c\u8272"}</button>
          </div>

          <div className="pet-walk-row">
            <b>{"\u4efb\u52a1\u72b6\u6001"}</b>
            <span>{walkStatusText}</span>
          </div>
          <div className="pet-walk-progress">
            <i style={{ width: `${walkProgress}%` }} />
          </div>

          {pet.souvenirs.length > 0 ? (
            <div className="pet-souvenirs">
              <b>{"\u5c0f\u7eaa\u5ff5\u54c1"}</b>
              <div>
                {pet.souvenirs.map((item, idx) => (
                  <span key={`${item}-${idx}`}>{item}</span>
                ))}
              </div>
            </div>
          ) : null}

          <p className="pet-hint">{hint}</p>

          <div className="pet-timeline">
            <b>{"\u4eca\u65e5\u56de\u5fc6"}</b>
            <ul>
              {pet.memories.slice(0, 5).map((m) => (
                <li key={m.id}>
                  <em>{m.icon}</em>
                  <span>{m.text}</span>
                  <code>{formatTimeLabel(m.at)}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}




