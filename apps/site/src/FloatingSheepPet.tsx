import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { formatDayKey } from "@colorwalking/shared";
import { PixelSheepSprite, type PixelSheepFrame } from "./PixelSheepSprite";

type WheelDetail = {
  color?: { name?: string };
};

type PetMood = "enter" | "idle" | "notice" | "expecting" | "happy" | "comfort";
type FocusSection = "none" | "play" | "pet";

const HISTORY_KEY = "lambroll-isle.web.history.v1";
const LEGACY_HISTORY_KEY = "colorwalking.web.history.v1";
const DISCOVER_KEY = "lambroll-isle.floating-pet.discover.v2";
const LEGACY_DISCOVER_KEY = "colorwalking.floating-pet.discover.v2";
const DRAW_PENDING_EVENT = "lambroll-isle:draw-pending";
const DRAW_UPDATED_EVENT = "lambroll-isle:draw-updated";
const LEGACY_DRAW_PENDING_EVENT = "colorwalking:draw-pending";
const LEGACY_DRAW_UPDATED_EVENT = "colorwalking:draw-updated";

const IDLE_LINES = [
  "小羊卷在这儿，想陪你看看今天的颜色。",
  "如果有点累，我们先慢一点。",
  "我会在旁边，不会打扰你。",
  "今天也值得被温柔对待。"
] as const;

const COMFORT_LINES = [
  "你已经很努力了，先让自己松一口气。",
  "慢慢来也没关系，我会一直在。",
  "先照顾好自己，别的可以晚一点。",
  "如果心里有点乱，先和我一起呼吸。"
] as const;

function loadWheelHistory(): Array<{ dayKey?: string; color?: { hex?: string } }> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as Array<{ dayKey?: string; color?: { hex?: string } }>;
    const legacy = localStorage.getItem(LEGACY_HISTORY_KEY);
    if (!legacy) return [];
    localStorage.setItem(HISTORY_KEY, legacy);
    return JSON.parse(legacy) as Array<{ dayKey?: string; color?: { hex?: string } }>;
  } catch {
    return [];
  }
}

function hasTodayDraw(): boolean {
  try {
    const list = loadWheelHistory();
    const today = formatDayKey(new Date());
    return list.some((x) => x?.dayKey === today);
  } catch {
    return false;
  }
}

function readTodayScarfColor(): string {
  try {
    const list = loadWheelHistory();
    if (!list.length) return "#7ea9df";
    const today = formatDayKey(new Date());
    const hit = list.find((x) => x?.dayKey === today);
    return hit?.color?.hex ?? "#7ea9df";
  } catch {
    return "#7ea9df";
  }
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function randomRange(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

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

export function FloatingSheepPet() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const moodTimerRef = useRef<number | null>(null);
  const proximityRafRef = useRef<number | null>(null);
  const driftTimerRef = useRef<number | null>(null);
  const talkTimerRef = useRef<number | null>(null);
  const clickAtRef = useRef(0);

  const [bubble, setBubble] = useState<string>(IDLE_LINES[0]);
  const [mood, setMood] = useState<PetMood>("enter");
  const [focusSection, setFocusSection] = useState<FocusSection>("none");
  const [discover, setDiscover] = useState(false);
  const [near, setNear] = useState(false);
  const [hasTodayColor, setHasTodayColor] = useState(() => hasTodayDraw());
  const [scarfColor, setScarfColor] = useState(() => readTodayScarfColor());
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hop, setHop] = useState(false);
  const [tick, setTick] = useState(0);

  const ctaLabel = useMemo(() => (hasTodayColor ? "去看看小羊卷" : "去抽今日幸运色"), [hasTodayColor]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((v) => v + 1), 480);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const today = formatDayKey(new Date());
    const seen = localStorage.getItem(DISCOVER_KEY) ?? localStorage.getItem(LEGACY_DISCOVER_KEY);
    if (seen !== today) {
      localStorage.setItem(DISCOVER_KEY, today);
      setDiscover(true);
      window.setTimeout(() => setDiscover(false), 15000);
    }
    moodTimerRef.current = window.setTimeout(() => {
      setMood("idle");
      window.setTimeout(() => {
        const pool = hasTodayDraw() ? COMFORT_LINES : IDLE_LINES;
        const line = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
        setBubble(line as string);
      }, randomRange(3000, 5000));
    }, 1200);
    return () => {
      if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onPending = () => {
      setMood("expecting");
      setBubble("我在看着转盘，等你揭晓。\n");
    };
    const onDraw = (e: Event) => {
      const detail = (e as CustomEvent<WheelDetail>).detail;
      const name = detail?.color?.name ?? "幸运色";
      setMood("happy");
      setBubble(`抽到了「${name}」，这份颜色很适合今天。`);
      setHasTodayColor(true);
      setScarfColor(readTodayScarfColor());
      setHop(true);
      window.setTimeout(() => setHop(false), 1000);
      window.setTimeout(() => setMood("comfort"), 2200);
      window.setTimeout(() => setMood("idle"), 4500);
    };
    window.addEventListener(DRAW_PENDING_EVENT, onPending);
    window.addEventListener(DRAW_UPDATED_EVENT, onDraw as EventListener);
    window.addEventListener(LEGACY_DRAW_PENDING_EVENT, onPending);
    window.addEventListener(LEGACY_DRAW_UPDATED_EVENT, onDraw as EventListener);
    return () => {
      window.removeEventListener(DRAW_PENDING_EVENT, onPending);
      window.removeEventListener(DRAW_UPDATED_EVENT, onDraw as EventListener);
      window.removeEventListener(LEGACY_DRAW_PENDING_EVENT, onPending);
      window.removeEventListener(LEGACY_DRAW_UPDATED_EVENT, onDraw as EventListener);
    };
  }, []);

  useEffect(() => {
    const play = document.getElementById("play");
    const pet = document.getElementById("pet");
    if (!play && !pet) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entry.target.id === "play") {
            setFocusSection("play");
            setBubble(hasTodayColor ? "今天的颜色在这里，点一下可以再看一次揭晓。" : "要不要现在抽一下今天的幸运色？");
          } else if (entry.target.id === "pet") {
            setFocusSection("pet");
            setBubble("我在这里，陪你慢慢照顾小羊卷。\n");
          }
        });
      },
      { threshold: 0.32 }
    );
    if (play) io.observe(play);
    if (pet) io.observe(pet);
    return () => io.disconnect();
  }, [hasTodayColor]);

  useEffect(() => {
    const onPointerMove = (evt: PointerEvent) => {
      if (proximityRafRef.current) return;
      proximityRafRef.current = window.requestAnimationFrame(() => {
        proximityRafRef.current = null;
        const root = rootRef.current;
        if (!root) return;
        const rect = root.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const distance = Math.hypot(evt.clientX - cx, evt.clientY - cy);
        const nextNear = distance < 180;
        if (nextNear !== near) {
          setNear(nextNear);
          if (nextNear) {
            setMood("notice");
            setBubble("我看到你啦，今天也辛苦了。\n");
            window.setTimeout(() => setMood((prev) => (prev === "notice" ? "idle" : prev)), 1300);
          }
        }
      });
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (proximityRafRef.current) window.cancelAnimationFrame(proximityRafRef.current);
    };
  }, [near]);

  useEffect(() => {
    const drift = () => {
      if (!near) setOffset({ x: randomRange(-24, 18), y: randomRange(-14, 10) });
      driftTimerRef.current = window.setTimeout(drift, randomRange(4200, 6800));
    };
    drift();
    return () => {
      if (driftTimerRef.current) window.clearTimeout(driftTimerRef.current);
    };
  }, [near]);

  useEffect(() => {
    const speakSlowly = () => {
      const nextHasToday = hasTodayDraw();
      setHasTodayColor(nextHasToday);
      setScarfColor(readTodayScarfColor());
      if (!nextHasToday) {
        setBubble("今天的颜色还没抽，我可以陪你去转盘看看。\n");
      } else if (focusSection === "pet") {
        setBubble("抱抱、摸摸、散步都可以，我在这儿陪你。\n");
      } else {
        const pool = Math.random() > 0.45 ? COMFORT_LINES : IDLE_LINES;
        const line = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
        setBubble(line);
      }
      setMood("comfort");
      window.setTimeout(() => setMood("idle"), 2000);
      talkTimerRef.current = window.setTimeout(speakSlowly, randomRange(22000, 36000));
    };

    talkTimerRef.current = window.setTimeout(speakSlowly, randomRange(8000, 14000));
    return () => {
      if (talkTimerRef.current) window.clearTimeout(talkTimerRef.current);
    };
  }, [focusSection]);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const now = Date.now();
    if (now - clickAtRef.current < 360) return;
    clickAtRef.current = now;
    const target = hasTodayColor ? "pet" : "play";
    setMood("notice");
    setHop(true);
    window.setTimeout(() => setHop(false), 900);
    setBubble(target === "play" ? "走吧，我们去抽今天的幸运色。" : "走吧，去看看小羊卷现在的状态。\n");
    scrollToId(target);
  };

  const frame: PixelSheepFrame = useMemo(() => {
    if (hop) {
      const jump = ["jump_a", "jump_b", "jump_c"] as const;
      return jump[tick % jump.length];
    }
    if (mood === "enter") return tick % 2 === 0 ? "notice_a" : "notice_b";
    if (mood === "expecting") return tick % 2 === 0 ? "expecting_a" : "expecting_b";
    if (mood === "happy") return tick % 2 === 0 ? "happy_a" : "happy_b";
    if (mood === "comfort") return tick % 2 === 0 ? "comfort_a" : "sleepy_a";
    if (mood === "notice") return tick % 2 === 0 ? "notice_a" : "notice_b";
    if (near) return tick % 2 === 0 ? "curious_a" : "turn_right";
    return IDLE_FRAME_LOOP[tick % IDLE_FRAME_LOOP.length] ?? "idle_a";
  }, [mood, tick, near, hop]);

  return (
    <div
      ref={rootRef}
      className={`floating-pet mood-${mood}${discover ? " is-discover" : ""}${near ? " is-near" : ""}${hop ? " is-hop" : ""}`}
      style={{ ["--fx" as string]: `${offset.x}px`, ["--fy" as string]: `${offset.y}px` }}
      aria-live="polite"
    >
      <div className="floating-pet-label">{ctaLabel}</div>
      <a className="floating-pet-core" href={hasTodayColor ? "#pet" : "#play"} onClick={onClick}>
        <PixelSheepSprite frame={frame} scarfColor={scarfColor} />
      </a>
      <div className="floating-bubble">{bubble}</div>
    </div>
  );
}
