import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { formatDayKey } from "@colorwalking/shared";
import { PixelSheepSprite } from "./PixelSheepSprite";

type WheelDetail = {
  color?: { name?: string };
};

type PetMood = "enter" | "idle" | "notice" | "expecting" | "happy" | "comfort";
type FocusSection = "none" | "play" | "pet";

const HISTORY_KEY = "colorwalking.web.history.v1";
const DISCOVER_KEY = "colorwalking.floating-pet.discover.v2";

const IDLE_LINES = [
  "小羊卷在这儿，想陪你看看今天的颜色。",
  "如果有点累，我们先慢一点点。",
  "我会在旁边，不会打扰你。",
  "今天也值得被温柔对待。"
] as const;

const COMFORT_LINES = [
  "你已经很努力了，先让自己松一口气。",
  "慢慢来也没关系，我会一直在。",
  "先照顾好自己，别的可以晚一点。",
  "如果心里有点乱，先和我一起呼吸。"
] as const;

function hasTodayDraw(): boolean {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw) as Array<{ dayKey?: string }>;
    const today = formatDayKey(new Date());
    return list.some((x) => x?.dayKey === today);
  } catch {
    return false;
  }
}

function readTodayScarfColor(): string {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return "#7ea9df";
    const list = JSON.parse(raw) as Array<{ dayKey?: string; color?: { hex?: string } }>;
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

export function FloatingSheepPet() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const moodTimerRef = useRef<number | null>(null);
  const proximityRafRef = useRef<number | null>(null);
  const driftTimerRef = useRef<number | null>(null);
  const talkTimerRef = useRef<number | null>(null);
  const clickAtRef = useRef(0);

  const [bubble, setBubble] = useState(IDLE_LINES[0]);
  const [mood, setMood] = useState<PetMood>("enter");
  const [focusSection, setFocusSection] = useState<FocusSection>("none");
  const [discover, setDiscover] = useState(false);
  const [near, setNear] = useState(false);
  const [hasTodayColor, setHasTodayColor] = useState(() => hasTodayDraw());
  const [scarfColor, setScarfColor] = useState(() => readTodayScarfColor());
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hop, setHop] = useState(false);

  const ctaLabel = useMemo(() => (hasTodayColor ? "去看看小羊卷" : "去抽今日幸运色"), [hasTodayColor]);

  useEffect(() => {
    const today = formatDayKey(new Date());
    const seen = localStorage.getItem(DISCOVER_KEY);
    if (seen !== today) {
      localStorage.setItem(DISCOVER_KEY, today);
      setDiscover(true);
      window.setTimeout(() => setDiscover(false), 15000);
    }
    moodTimerRef.current = window.setTimeout(() => setMood("idle"), 1200);
    return () => {
      if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onPending = () => {
      setMood("expecting");
      setBubble("我在看着转盘，等你揭晓。");
    };
    const onDraw = (e: Event) => {
      const detail = (e as CustomEvent<WheelDetail>).detail;
      const name = detail?.color?.name ?? "幸运色";
      setMood("happy");
      setBubble(`抽到了「${name}」，这份颜色真适合今天。`);
      setHasTodayColor(true);
      setScarfColor(readTodayScarfColor());
      setHop(true);
      window.setTimeout(() => setHop(false), 1000);
      window.setTimeout(() => setMood("comfort"), 2200);
      window.setTimeout(() => setMood("idle"), 4500);
    };
    window.addEventListener("colorwalking:draw-pending", onPending);
    window.addEventListener("colorwalking:draw-updated", onDraw as EventListener);
    return () => {
      window.removeEventListener("colorwalking:draw-pending", onPending);
      window.removeEventListener("colorwalking:draw-updated", onDraw as EventListener);
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
            setBubble(hasTodayColor ? "今天的颜色在这里，点一下可以再看一次揭晓。" : "要不要现在抽一下今日幸运色？");
          } else if (entry.target.id === "pet") {
            setFocusSection("pet");
            setBubble("我在这里，陪你慢慢照顾小羊卷。");
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
            setBubble("我看到你啦，今天也辛苦了。");
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
    const tick = () => {
      if (!near) {
        setOffset({ x: randomRange(-24, 18), y: randomRange(-14, 10) });
      }
      const nextDelay = randomRange(4200, 6800);
      driftTimerRef.current = window.setTimeout(tick, nextDelay);
    };
    tick();
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
        setBubble("今天的颜色还没抽，我可以陪你去看看转盘。");
      } else if (focusSection === "pet") {
        setBubble("抱抱、摸摸、散步都可以，我在这儿陪你。");
      } else {
        const pool = Math.random() > 0.45 ? COMFORT_LINES : IDLE_LINES;
        const line = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
        setBubble(line);
      }
      setMood("comfort");
      window.setTimeout(() => setMood("idle"), 2000);
      const nextDelay = randomRange(22000, 36000);
      talkTimerRef.current = window.setTimeout(speakSlowly, nextDelay);
    };

    talkTimerRef.current = window.setTimeout(speakSlowly, randomRange(24000, 36000));
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
    setBubble(target === "play" ? "走吧，我们去抽今天的幸运色。" : "走吧，去看看小羊卷现在的状态。");
    scrollToId(target);
  };

  return (
    <div
      ref={rootRef}
      className={`floating-pet mood-${mood}${discover ? " is-discover" : ""}${near ? " is-near" : ""}${hop ? " is-hop" : ""}`}
      style={{ ["--fx" as string]: `${offset.x}px`, ["--fy" as string]: `${offset.y}px` }}
      aria-live="polite"
    >
      <div className="floating-pet-label">{ctaLabel}</div>
      <a className="floating-pet-core" href={hasTodayColor ? "#pet" : "#play"} onClick={onClick}>
        <PixelSheepSprite mood={mood} scarfColor={scarfColor} />
      </a>
      <div className="floating-bubble">{bubble}</div>
    </div>
  );
}
