import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { formatDayKey } from "@colorwalking/shared";

type WheelDetail = {
  color?: { name?: string };
};

type PetMood = "enter" | "idle" | "notice" | "expecting" | "happy" | "comfort";
type FocusSection = "none" | "play" | "pet";

const HISTORY_KEY = "colorwalking.web.history.v1";
const DISCOVER_KEY = "colorwalking.floating-pet.discover.v1";

const IDLE_LINES = [
  "小羊卷在这儿，想陪你看看今天的颜色。",
  "如果有点累，我们先慢一点点。",
  "我会在旁边，不会打扰你。",
  "今天也值得被温柔对待。"
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

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function FloatingSheepPet() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const moodTimerRef = useRef<number | null>(null);
  const proximityRafRef = useRef<number | null>(null);

  const [bubble, setBubble] = useState(IDLE_LINES[0]);
  const [mood, setMood] = useState<PetMood>("enter");
  const [focusSection, setFocusSection] = useState<FocusSection>("none");
  const [discover, setDiscover] = useState(false);
  const [near, setNear] = useState(false);
  const [hasTodayColor, setHasTodayColor] = useState(() => hasTodayDraw());

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
      window.setTimeout(() => setMood("comfort"), 2200);
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
      { threshold: 0.3 }
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
            window.setTimeout(() => setMood((prev) => (prev === "notice" ? "idle" : prev)), 1200);
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
    const timer = window.setInterval(() => {
      const nextHasToday = hasTodayDraw();
      setHasTodayColor(nextHasToday);
      if (!nextHasToday) {
        setBubble("今天的颜色还没抽，我可以陪你去看看转盘。");
      } else if (focusSection === "pet") {
        setBubble("抱抱、摸摸、散步都可以，我在这儿陪你。");
      } else {
        const next = IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)] ?? IDLE_LINES[0];
        setBubble(next);
      }
      setMood((prev) => (prev === "idle" ? "comfort" : prev));
      window.setTimeout(() => setMood((prev) => (prev === "comfort" ? "idle" : prev)), 1800);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [focusSection]);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = hasTodayColor ? "pet" : "play";
    setMood("notice");
    setBubble(target === "play" ? "走吧，我们去抽今天的幸运色。" : "走吧，去看看小羊卷现在的状态。");
    scrollToId(target);
  };

  return (
    <div
      ref={rootRef}
      className={`floating-pet mood-${mood}${discover ? " is-discover" : ""}${near ? " is-near" : ""}`}
      aria-live="polite"
    >
      <div className="floating-pet-label">{ctaLabel}</div>
      <a className="floating-pet-core" href={hasTodayColor ? "#pet" : "#play"} onClick={onClick}>
        <span className="floating-ear left" />
        <span className="floating-ear right" />
        <span className="floating-face">
          <i />
          <i />
          <b />
        </span>
      </a>
      <div className="floating-bubble">{bubble}</div>
    </div>
  );
}
