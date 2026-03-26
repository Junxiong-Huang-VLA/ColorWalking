import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COLOR_PALETTE, formatDayKey } from "@colorwalking/shared";
import { createMessagePicker } from "./pet/messages";
import { nextPresenceState, presenceStateDurationMs } from "./pet/stateMachine";
import { canTrigger, randomInRange } from "./pet/timing";
import type { MessageBucket, PetPresenceEvent, PetPresenceState } from "./pet/types";
import { usePetPresence } from "./pet/usePetPresence";
import { PixelSheepSprite, type PixelSheepFrame } from "./PixelSheepSprite";

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
const DRAW_PENDING_EVENT = "colorwalking:draw-pending";
const LEVEL_XP = 100;
const WALK_SECONDS = 30;
const IDLE_FRAME_LOOP: readonly PixelSheepFrame[] = [
  "idle_a",
  "idle_b",
  "idle_a",
  "idle_b",
  "blink_a",
  "idle_b",
  "idle_a",
  "idle_b",
  "idle_a",
  "idle_b",
  "blink_b",
  "idle_b"
];
const FAREWELL_FRAME_LOOP: readonly PixelSheepFrame[] = ["back_a", "back_a", "back_look", "back_a"];
const WALK_SOUVENIRS = ["叶子胸针", "彩虹石", "绒毛团子", "小铃铛", "星光缎带"];

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
  if (emotion === "sleepy") return "困困";
  if (emotion === "upset") return "委屈";
  if (emotion === "needy") return "想你";
  if (emotion === "bored") return "无聊";
  return "开心";
}

function emotionVoice(emotion: PetEmotion): string {
  if (emotion === "sleepy") return "我有点困了，想在你旁边安静待一会。";
  if (emotion === "upset") return "我心里有点乱，你在的话我会好很多。";
  if (emotion === "needy") return "刚才一直在等你，你来了我就放心了。";
  if (emotion === "bored") return "想和你玩一会，我们一起动一动吧。";
  return "我今天状态不错，想好好陪在你身边。";
}

function defaultPet(): PetState {
  const favorite = COLOR_PALETTE[0]?.id ?? "sunrise-coral";
  const now = new Date();
  const nowIso = now.toISOString();
  return {
    name: "小羊卷",
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
    memories: [makeMemory("💛", "第一天入住小羊卷养成舱，它很高兴认识你。", now)],
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
  if (mood >= 85) return "今天羊卷很轻快，想陪你多走一会。";
  if (mood >= 65) return "状态很平稳，就这样慢慢保持就好。";
  if (mood >= 40) return "羊卷有点没精神，想被你再照顾一下。";
  return "羊卷正在低落期，摸摸它或陪它玩一下吧。";
}

function reactionByAction(action: PetAction): string {
  if (action === "feed") return "🌿";
  if (action === "play") return "🎉";
  if (action === "rest") return "💤";
  if (action === "groom") return "✨";
  if (action === "cuddle") return "🤗";
  if (action === "hop") return "💃";
  if (action === "yawn") return "😪";
  if (action === "look") return "👀";
  return "💕";
}

function actionMessageBucket(action: PetAction): MessageBucket {
  if (action === "pet" || action === "cuddle") return "clickMessages";
  if (action === "look") return "noticeMessages";
  if (action === "hop") return "curiousMessages";
  if (action === "yawn") return "sleepyMessages";
  if (action === "feed" || action === "play" || action === "rest" || action === "groom") return "comfortMessages";
  return "repeatVisitMessages";
}

function pickIdleAction(emotion: PetEmotion): { action: PetAction; hint: string } {
  if (emotion === "sleepy") {
    return Math.random() > 0.45
      ? { action: "yawn", hint: "羊卷打了个哈欠，慢慢地靠近你。" }
      : { action: "look", hint: "羊卷眼神软软的，像在寻找一点安心感。" };
  }
  if (emotion === "upset") {
    return Math.random() > 0.5
      ? { action: "look", hint: "羊卷情绪有点低，正在等你摸摸它。" }
      : { action: "yawn", hint: "羊卷小声哼了一下，像在向你要安慰。" };
  }
  if (emotion === "needy") {
    return Math.random() > 0.45
      ? { action: "look", hint: "羊卷听到你的动静，立刻望过来了。" }
      : { action: "hop", hint: "羊卷在原地跳了一下，像在说“我在这里”。" };
  }
  if (emotion === "bored") {
    return Math.random() > 0.4
      ? { action: "hop", hint: "羊卷想找点乐子，在等你和它一起玩。" }
      : { action: "look", hint: "羊卷到处看了看，好像想出去走走。" };
  }
  return Math.random() > 0.5
    ? { action: "hop", hint: "羊卷心情不错，想在你身边多停留一会。" }
    : { action: "look", hint: "羊卷歪头看你，眼神里有很多依赖。" };
}

function dailyGreeting(name: string): string {
  const pool = [
    `新的一天开始了，${name}已经在这里等你。`,
    `今天也请好好照顾自己，${name}会一直陪着你。`,
    `你一出现，${name}的心情就亮了一点。`
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

function frameByGardenState(action: PetAction, presence: PetPresenceState, emotion: PetEmotion, tick: number): PixelSheepFrame {
  if (action === "feed") return tick % 2 === 0 ? "notice_a" : "notice_b";
  if (action === "play") return ["jump_a", "jump_b", "jump_c"][tick % 3] as PixelSheepFrame;
  if (action === "rest") return tick % 2 === 0 ? "sleepy_a" : "sleepy_b";
  if (action === "groom") return tick % 2 === 0 ? "idle_a" : "blink_a";
  if (action === "pet") return tick % 2 === 0 ? "happy_a" : "happy_b";
  if (action === "cuddle") return "comfort_a";
  if (action === "hop") return ["jump_a", "jump_b", "jump_c"][tick % 3] as PixelSheepFrame;
  if (action === "yawn") return tick % 2 === 0 ? "sleepy_a" : "sleepy_b";
  if (action === "look") return tick % 2 === 0 ? "turn_left" : "turn_right";

  if (presence === "enter") return tick % 2 === 0 ? "notice_a" : "notice_b";
  if (presence === "notice") return tick % 2 === 0 ? "notice_a" : "notice_b";
  if (presence === "curious") return "curious_a";
  if (presence === "happy") return tick % 2 === 0 ? "happy_a" : "happy_b";
  if (presence === "sleepy") return tick % 2 === 0 ? "sleepy_a" : "sleepy_b";
  if (presence === "comfort") return "comfort_a";
  if (presence === "farewell") return FAREWELL_FRAME_LOOP[tick % FAREWELL_FRAME_LOOP.length] ?? "back_a";

  if (emotion === "sleepy") return tick % 2 === 0 ? "sleepy_a" : "sleepy_b";
  if (emotion === "upset") return "comfort_a";
  if (emotion === "needy") return tick % 2 === 0 ? "turn_left" : "turn_right";
  if (emotion === "bored") return tick % 2 === 0 ? "curious_a" : "turn_right";
  return IDLE_FRAME_LOOP[tick % IDLE_FRAME_LOOP.length] ?? "idle_a";
}

export function SheepPetGarden() {
  const [pet, setPet] = useState<PetState>(() => loadPet());
  const [hint, setHint] = useState("欢迎来到小羊卷的小屋，每天来看看它一次，它会慢慢更依赖你。");
  const [bubbleText, setBubbleText] = useState("我在这里，慢慢陪着你。");
  const [bubbleTick, setBubbleTick] = useState(0);
  const [petAction, setPetAction] = useState<PetAction>("idle");
  const [reaction, setReaction] = useState("");
  const [walkCountdown, setWalkCountdown] = useState(0);
  const [walkDoneToast, setWalkDoneToast] = useState<string>("");
  const [presenceState, setPresenceState] = useState<PetPresenceState>("enter");
  const [spriteTick, setSpriteTick] = useState(0);

  const petPresenceRef = useRef<PetPresenceState>("enter");
  const messagePickerRef = useRef(createMessagePicker(6));
  const holdTimerRef = useRef<number | null>(null);
  const holdTriggeredRef = useRef(false);
  const stateTimerRef = useRef<number | null>(null);
  const proactiveTimerRef = useRef<number | null>(null);
  const lastStateChangeAtRef = useRef(0);
  const lastClickFeedbackAtRef = useRef(0);
  const lastProactiveSpeechAtRef = useRef(0);
  const proactiveCooldownRef = useRef(randomInRange(20000, 40000));
  const avatarBoxRef = useRef<HTMLDivElement | null>(null);

  const favoriteColor = useMemo(
    () => COLOR_PALETTE.find((c) => c.id === pet.favoriteColorId) ?? COLOR_PALETTE[0],
    [pet.favoriteColorId]
  );
  const emotion = useMemo(() => inferEmotion(pet), [pet]);
  const xpPercent = Math.round((pet.xp / LEVEL_XP) * 100);
  const hungerValue = Math.round(pet.hunger);
  const energyValue = Math.round(pet.energy);
  const cleanValue = Math.round(pet.cleanliness);
  const petFrame = useMemo(
    () => frameByGardenState(petAction, presenceState, emotion, spriteTick),
    [petAction, presenceState, emotion, spriteTick]
  );

  const speak = useCallback(
    (bucket: MessageBucket, options?: { force?: boolean; setHintText?: boolean }): string => {
      const force = Boolean(options?.force);
      if (!force) {
        const now = Date.now();
        if (!canTrigger(lastProactiveSpeechAtRef.current, proactiveCooldownRef.current, now)) return "";
        lastProactiveSpeechAtRef.current = now;
        proactiveCooldownRef.current = randomInRange(20000, 40000);
      }
      const line = messagePickerRef.current(bucket);
      if (!line) return "";
      setBubbleText(line);
      setBubbleTick((x) => x + 1);
      if (options?.setHintText) setHint(line);
      return line;
    },
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => setSpriteTick((v) => v + 1), 500);
    return () => window.clearInterval(timer);
  }, []);

  const triggerAction = useCallback((action: PetAction) => {
    setPetAction(action);
    setReaction(reactionByAction(action));
    window.setTimeout(() => setPetAction("idle"), 900);
    window.setTimeout(() => setReaction(""), 1100);
  }, []);

  const dispatchPresence = useCallback((event: PetPresenceEvent) => {
    const now = Date.now();
    const forceEvent = event === "BOOT" || event === "ENTER_DONE" || event === "DRAW_SUCCESS" || event === "DRAW_PENDING";
    if (!forceEvent && !canTrigger(lastStateChangeAtRef.current, 220, now)) return;

    const current = petPresenceRef.current;
    const next = nextPresenceState(current, event, { hasDrawToday: Boolean(todayLuckyColorId()) });
    if (next === current) return;
    lastStateChangeAtRef.current = now;
    petPresenceRef.current = next;
    setPresenceState(next);
  }, []);

  const lookOffset = usePetPresence({
    zoneRef: avatarBoxRef,
    onEvent: dispatchPresence
  });

  useEffect(() => {
    dispatchPresence("BOOT");
  }, [dispatchPresence]);

  useEffect(() => {
    if (stateTimerRef.current) window.clearTimeout(stateTimerRef.current);
    const life = presenceStateDurationMs(presenceState);
    if (life) {
      const timeoutEvent: PetPresenceEvent = presenceState === "enter" ? "ENTER_DONE" : "STATE_TIMEOUT";
      stateTimerRef.current = window.setTimeout(() => dispatchPresence(timeoutEvent), life);
    }

    if (presenceState === "enter") {
      speak("enterMessages", { force: true });
    } else if (presenceState === "notice") {
      speak("noticeMessages");
    } else if (presenceState === "curious") {
      speak("curiousMessages");
    } else if (presenceState === "happy") {
      speak("happyMessages", { force: true, setHintText: true });
    } else if (presenceState === "comfort") {
      speak("comfortMessages");
    } else if (presenceState === "sleepy") {
      speak("sleepyMessages");
    } else if (presenceState === "farewell") {
      speak("farewellMessages", { force: true });
    }

    return () => {
      if (stateTimerRef.current) window.clearTimeout(stateTimerRef.current);
    };
  }, [presenceState, dispatchPresence, speak]);

  useEffect(() => {
    if (proactiveTimerRef.current) window.clearTimeout(proactiveTimerRef.current);
    const delay = randomInRange(26000, 42000);
    proactiveTimerRef.current = window.setTimeout(() => {
      if (petPresenceRef.current === "comfort") speak("comfortMessages");
      if (petPresenceRef.current === "idle") speak("repeatVisitMessages");
    }, delay);
    return () => {
      if (proactiveTimerRef.current) window.clearTimeout(proactiveTimerRef.current);
    };
  }, [presenceState, speak]);

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
        "🌤",
        "今日问候：你一出现，它就慢慢安心了。"
      );
      savePet(next);
      setHint(dailyGreeting(prev.name));
      speak("repeatVisitMessages", { force: true });
      return next;
    });
  }, [speak]);

  useEffect(() => {
    const delay = 6000 + Math.floor(Math.random() * 7000);
    const timer = window.setTimeout(() => {
      const auto = pickIdleAction(inferEmotion(pet));
      triggerAction(auto.action);
      setHint(auto.hint);
      speak(actionMessageBucket(auto.action));
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
      // 散步完成 Toast 通知
      setWalkDoneToast(`小羊卷散步回来了，带回了「${souvenir}」✨`);
      window.setTimeout(() => setWalkDoneToast(""), 4000);
      triggerAction("hop");
      dispatchPresence("DRAW_SUCCESS");
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
          "🎁",
          `散步完成，带回了${souvenir}。`
        );
        savePet(done);
        return done;
      });
      setHint(`散步回来啦，它想把${souvenir}送给你。`);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [pet.walkTask.status, pet.walkTask.endsAt, triggerAction, dispatchPresence]);

  const blessFromDraw = useCallback(
    (draw: WheelHistoryItem | null) => {
      if (!draw?.id || !draw?.color) return;
      // 固定引用，避免 TypeScript 在 setPet 闭包内对可选字段的类型收窄失效
      const drawId = draw.id;
      const drawColor = draw.color;
      setPet((prev) => {
        if (prev.lastWheelBlessedId === drawId) return prev;
        const blessedLine = speak("luckyColorMessages", { force: true, setHintText: true });
        const base = gainXp(
          {
            ...prev,
            favoriteColorId: drawColor.id ?? prev.favoriteColorId,
            mood: clamp(prev.mood + 6),
            lastWheelBlessedId: drawId
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
          "🌈",
          `你抽到了${drawColor.name ?? "幸运色"}，羊卷为你记下了今天的这份颜色。`
        );
        savePet(next);
        if (blessedLine) setHint(blessedLine);
        triggerAction("pet");
        dispatchPresence("DRAW_SUCCESS");
        return next;
      });
    },
    [speak, triggerAction, dispatchPresence]
  );

  useEffect(() => {
    blessFromDraw(latestWheelDraw());
  }, [blessFromDraw]);

  useEffect(() => {
    const onDrawUpdate = (e: Event) => {
      const detail = (e as CustomEvent<WheelHistoryItem>).detail;
      blessFromDraw(detail ?? latestWheelDraw());
    };
    const onDrawPending = () => {
      dispatchPresence("DRAW_PENDING");
      triggerAction("look");
      speak("noticeMessages", { force: true });
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "colorwalking.web.history.v1") blessFromDraw(latestWheelDraw());
    };
    window.addEventListener(DRAW_EVENT, onDrawUpdate as EventListener);
    window.addEventListener(DRAW_PENDING_EVENT, onDrawPending);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DRAW_EVENT, onDrawUpdate as EventListener);
      window.removeEventListener(DRAW_PENDING_EVENT, onDrawPending);
      window.removeEventListener("storage", onStorage);
    };
  }, [blessFromDraw, dispatchPresence, triggerAction, speak]);

  const runAction = (
    action: PetAction,
    updater: (state: PetState) => PetState,
    message: string,
    memory?: { icon: string; text: string }
  ) => {
    triggerAction(action);
    speak(actionMessageBucket(action), { force: true });
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
      "你喂了一点小点心，小羊卷状态好了许多。",
      { icon: "🌿", text: "你们分享了一次轻松的小点心时间。" }
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
      "你陪它跑圈玩球，毛卷飞起来了。",
      { icon: "🎉", text: "你们一起玩得很开心，心情也活跃了一点。" }
    );

  const rest = () =>
    runAction(
      "rest",
      (s) => gainXp({ ...s, energy: clamp(s.energy + 26), hunger: clamp(s.hunger + 4) }, 10),
      "小羊卷打了个小盹，慢慢恢复了精神。",
      { icon: "💤", text: "它在你身边安心地休息了一会儿。" }
    );

  const groom = () =>
    runAction(
      "groom",
      (s) => gainXp({ ...s, cleanliness: clamp(s.cleanliness + 24), mood: clamp(s.mood + 8) }, 12),
      "你帮它梳了毛，它看起来更舒服了。",
      { icon: "✨", text: "小羊卷被你打理得很干净，精神也好了起来。" }
    );

  const petHead = () =>
    runAction(
      "pet",
      (s) => gainXp({ ...s, mood: clamp(s.mood + 6), energy: clamp(s.energy + 2) }, 6),
      "小羊卷被你摸得很开心，整个人都软下来啦。",
      { icon: "💕", text: "你摸了摸它，它用依赖回应了你。" }
    );

  const cuddle = () =>
    runAction(
      "cuddle",
      (s) => gainXp({ ...s, mood: clamp(s.mood + 12), energy: clamp(s.energy + 6) }, 10),
      "你抱了抱它，羊卷慢慢放松下来，你也可以休息一下了。",
      { icon: "🤗", text: "你们分享了一个抱抱，心情都变柔和了。" }
    );

  const startHold = () => {
    holdTriggeredRef.current = false;
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      holdTriggeredRef.current = true;
      cuddle();
    }, 650);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const onAvatarClick = () => {
    dispatchPresence("POINTER_CLICK");
    if (holdTriggeredRef.current) {
      holdTriggeredRef.current = false;
      return;
    }
    const now = Date.now();
    if (!canTrigger(lastClickFeedbackAtRef.current, 420, now)) return;
    lastClickFeedbackAtRef.current = now;
    petHead();
  };

  const onAvatarHover = () => {
    dispatchPresence("POINTER_NEAR");
    triggerAction("look");
    speak("noticeMessages");
  };

  const startWalkTask = () => {
    const nowMs = Date.now();
    const today = formatDayKey(new Date());
    const remainSec = pet.walkTask.endsAt ? Math.max(0, Math.ceil((new Date(pet.walkTask.endsAt).getTime() - nowMs) / 1000)) : 0;
    if (pet.walkTask.status === "walking" && remainSec > 0) {
      setHint(`它正在散步，还有 ${remainSec}s 就回来陪你。`);
      return;
    }
    if (pet.walkTask.lastDoneDayKey === today) {
      setHint("今天的散步任务已经完成了，明天我们再慢慢出发。");
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
      "小羊卷出发去散步了，30 秒后会带一份小礼物回来。",
      { icon: "🚶", text: "你们开始了一次轻轻的散步任务。" }
    );
    setWalkCountdown(WALK_SECONDS);
  };

  const syncLuckyColor = () => {
    const colorId = todayLuckyColorId();
    if (!colorId) {
      setHint("今天还没有抽颜色，可以先去转盘看看。");
      return;
    }

    runAction(
      "pet",
      (s) => gainXp({ ...s, favoriteColorId: colorId, mood: clamp(s.mood + 12) }, 18),
      "小羊卷换上了今天的颜色围巾，看起来很开心。",
      { icon: "🌈", text: "你们完成了今日颜色的小小同步。" }
    );
  };

  const walkStatusText =
    pet.walkTask.status === "walking"
      ? `散步中... ${walkCountdown}s`
      : pet.walkTask.lastDoneDayKey === formatDayKey(new Date())
        ? "今日已完成"
        : "未开始";
  const walkProgress =
    pet.walkTask.status === "walking"
      ? Math.round(((WALK_SECONDS - Math.max(0, walkCountdown)) / WALK_SECONDS) * 100)
      : pet.walkTask.lastDoneDayKey === formatDayKey(new Date())
        ? 100
        : 0;

  return (
    <section id="pet" className="section pet-card">
      <h2>小羊卷养成舱</h2>
      <p className="pet-desc">每天来看看小羊卷，它会在你的陪伴里慢慢长大。点击可以摸头，长按可以抱抱。</p>

      <div className="pet-layout">
        <div ref={avatarBoxRef} className="pet-avatar-box">
          <p className="pet-presence"><i />小羊卷在这里陪你</p>
          <div key={bubbleTick} className="pet-bubble pet-bubble-live">{bubbleText}</div>
          <button
            type="button"
            className={`pet-avatar pet-${petAction} pet-state-${presenceState}`}
            style={{
              ["--accent" as string]: favoriteColor?.hex ?? "#ffd93d",
              ["--look-x" as string]: `${lookOffset.x}`,
              ["--look-y" as string]: `${lookOffset.y}`
            }}
            onMouseEnter={onAvatarHover}
            onFocus={onAvatarHover}
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={() => {
              cancelHold();
              dispatchPresence("POINTER_LEAVE");
            }}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            onClick={onAvatarClick}
            aria-label="摸摸小羊卷"
          >
            {reaction ? <span className="pet-reaction">{reaction}</span> : null}
            <PixelSheepSprite frame={petFrame} scarfColor={favoriteColor?.hex ?? "#7ea9df"} size={176} className="pet-main-sprite" />
          </button>
          <p className="pet-name">{pet.name} · Lv.{pet.level}</p>
          <p className="pet-status">
            <b>{emotionLabel(emotion)}</b> · {emotionVoice(emotion)}
          </p>
          <p className="pet-mood">{moodText(pet.mood)}</p>
        </div>

        <div className="pet-panel">
          {walkDoneToast && (
            <div className="walk-done-toast" role="status" aria-live="polite">
              {walkDoneToast}
            </div>
          )}
          <div className="pet-meter">
            <span>经验</span>
            <div><i style={{ width: `${xpPercent}%` }} /></div>
            <b>{pet.xp}/{LEVEL_XP}</b>
          </div>
          <div className="pet-meter">
            <span>心情</span>
            <div><i style={{ width: `${pet.mood}%` }} /></div>
            <b>{pet.mood}</b>
          </div>
          <div className="pet-meter">
            <span>饥饿</span>
            <div><i style={{ width: `${hungerValue}%` }} /></div>
            <b>{hungerValue}</b>
          </div>
          <div className="pet-meter">
            <span>精力</span>
            <div><i style={{ width: `${energyValue}%` }} /></div>
            <b>{energyValue}</b>
          </div>
          <div className="pet-meter">
            <span>洁净</span>
            <div><i style={{ width: `${cleanValue}%` }} /></div>
            <b>{cleanValue}</b>
          </div>

          <div className="pet-actions">
            <button type="button" onClick={feed}>喂食</button>
            <button type="button" onClick={play}>陪它玩</button>
            <button type="button" onClick={rest}>休息</button>
            <button type="button" onClick={groom}>梳毛</button>
            <button type="button" onClick={startWalkTask}>去散个步</button>
            <button type="button" className="pet-lucky" onClick={syncLuckyColor}>同步今日颜色</button>
          </div>

          <div className="pet-walk-row">
            <b>任务状态</b>
            <span>{walkStatusText}</span>
          </div>
          <div className="pet-walk-progress">
            <i style={{ width: `${walkProgress}%` }} />
          </div>

          {pet.souvenirs.length > 0 ? (
            <div className="pet-souvenirs">
              <b>小纪念品</b>
              <div>
                {pet.souvenirs.map((item, idx) => (
                  <span key={`${item}-${idx}`}>{item}</span>
                ))}
              </div>
            </div>
          ) : null}

          <p className="pet-hint">{hint}</p>

          <div className="pet-timeline">
            <b>今日回忆</b>
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
