import { COLOR_PALETTE, type DrawResult } from "@colorwalking/shared";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildRelationshipNarrative,
  loadLifeState,
  onLifeStateUpdate,
  recordInteraction,
  recordRitual,
  type DigitalLifeState
} from "./digitalLifeState";
import { type LiveAction, LiveXiaoYangJuan, type LiveMood, type LiveRitualPhase, type LiveScene } from "./LiveXiaoYangJuan";
import { ROUTE_PATHS } from "./config/brandWorld";

const HISTORY_KEY = "lambroll-isle.web.history.v1";
const LEGACY_HISTORY_KEY = "colorwalking.web.history.v1";
const DRAW_UPDATED_EVENT = "lambroll-isle:draw-updated";
const LEGACY_DRAW_UPDATED_EVENT = "colorwalking:draw-updated";
const LazyWheel = lazy(() => import("./WebLuckyWheel").then((mod) => ({ default: mod.WebLuckyWheel })));

type ActionKey = "pet" | "cuddle" | "near" | "bedtime";

const ACTION_PRESETS: Record<
  ActionKey,
  { mood: LiveMood; scene: LiveScene; action: LiveAction; line: string }
> = {
  pet: {
    mood: "happy",
    scene: "chat",
    action: "pet",
    line: "它抬头看着你，像在认真接住这次触碰。"
  },
  cuddle: {
    mood: "soft",
    scene: "comfort",
    action: "cuddle",
    line: "小羊卷缩进你怀里，围巾的颜色也慢慢暖了。"
  },
  near: {
    mood: "shy",
    scene: "mood",
    action: "near",
    line: "它先偷看你一眼，再悄悄往你这边靠近。"
  },
  bedtime: {
    mood: "sleepy",
    scene: "bedtime",
    action: "bedtime",
    line: "它的呼吸变慢了，像在陪你把今天轻轻放下。"
  }
};

function defaultLuckyColor() {
  const first = COLOR_PALETTE[0];
  return {
    name: first?.name ?? "云雾蓝",
    hex: first?.hex ?? "#7ea9df"
  };
}

function keywordFromResult(result: DrawResult): string {
  return result.color.moodTag || result.color.message.slice(0, 10) || "今天也值得被温柔对待";
}

function safeMood(input: string): LiveMood {
  if (input === "calm" || input === "soft" || input === "happy" || input === "sleepy" || input === "shy" || input === "sad") return input;
  return "soft";
}

function safeScene(input: string): LiveScene {
  if (input === "chat" || input === "comfort" || input === "bedtime" || input === "mood" || input === "color") return input;
  return "chat";
}

export function LuckyColorPage() {
  const [history, setHistory] = useState<DrawResult[]>([]);
  const [mood, setMood] = useState<LiveMood>("soft");
  const [scene, setScene] = useState<LiveScene>("color");
  const [action, setAction] = useState<LiveAction>("idle");
  const [ritualPhase, setRitualPhase] = useState<LiveRitualPhase>("idle");
  const [statusLine, setStatusLine] = useState("抽一下今天的幸运色，小羊卷会立刻把它围在围巾上。");
  const [keyword, setKeyword] = useState("");
  const [stageColor, setStageColor] = useState(() => defaultLuckyColor());
  const [relationshipLine, setRelationshipLine] = useState("你们的关系正在慢慢升温。\n");
  const [feedbackLine, setFeedbackLine] = useState("点一下抽色，让它在今天醒来。\n");
  const [spinSignal, setSpinSignal] = useState(0);

  const actionTimerRef = useRef<number | null>(null);

  const applyLifeState = useCallback((life: DigitalLifeState) => {
    setStageColor({ name: life.sheepState.luckyColorName, hex: life.sheepState.luckyColorHex });
    setMood(safeMood(life.sheepState.mood));
    setScene(safeScene(life.sheepState.scene));
    setRelationshipLine(buildRelationshipNarrative(life).stageLine);
    if (life.memoryState[0]?.line) setFeedbackLine(life.memoryState[0].line);
  }, []);

  useEffect(() => {
    applyLifeState(loadLifeState());
    return onLifeStateUpdate((state) => applyLifeState(state));
  }, [applyLifeState]);

  useEffect(() => {
    return () => {
      if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
    };
  }, []);

  const runPreset = useCallback((key: ActionKey) => {
    const preset = ACTION_PRESETS[key];
    setMood(preset.mood);
    setScene(preset.scene);
    setAction(preset.action);
    setRitualPhase("idle");
    setStatusLine(preset.line);

    const life = recordInteraction({
      action: key,
      mood: preset.mood,
      scene: preset.scene,
      statusLine: preset.line,
      colorHex: stageColor.hex,
      colorName: stageColor.name
    });

    setRelationshipLine(buildRelationshipNarrative(life).stageLine);
    setFeedbackLine(life.memoryState[0]?.line ?? preset.line);

    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
    actionTimerRef.current = window.setTimeout(() => setAction("idle"), 1500);
  }, [stageColor.hex, stageColor.name]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const fallback = raw ?? localStorage.getItem(LEGACY_HISTORY_KEY);
      if (!fallback) return;
      const list = JSON.parse(fallback) as DrawResult[];
      if (!raw) localStorage.setItem(HISTORY_KEY, fallback);
      setHistory(list.slice(0, 12));
    } catch {
      setHistory([]);
    }

    const onDraw = (e: Event) => {
      const detail = (e as CustomEvent<DrawResult>).detail;
      if (!detail) return;
      setHistory((prev) => [detail, ...prev.filter((x) => x.id !== detail.id)].slice(0, 12));
    };

    window.addEventListener(DRAW_UPDATED_EVENT, onDraw as EventListener);
    window.addEventListener(LEGACY_DRAW_UPDATED_EVENT, onDraw as EventListener);
    return () => {
      window.removeEventListener(DRAW_UPDATED_EVENT, onDraw as EventListener);
      window.removeEventListener(LEGACY_DRAW_UPDATED_EVENT, onDraw as EventListener);
    };
  }, []);

  const latest = useMemo(() => history[0] ?? null, [history]);

  useEffect(() => {
    if (!latest?.color?.hex) return;
    setStageColor({ name: latest.color.name, hex: latest.color.hex });
  }, [latest]);

  const startDrawRitual = () => {
    setSpinSignal((v) => v + 1);
    const target = document.getElementById("play");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onWheelRitualEvent = (event: { phase: "pending" | "reveal" | "idle"; result?: DrawResult }) => {
    if (event.phase === "pending") {
      setRitualPhase("drawing");
      setMood("soft");
      setScene("color");
      setAction("near");
      setStatusLine("幸运色正在靠近，眼睛和围巾都在慢慢变亮。\n");
      return;
    }

    if (event.phase === "reveal" && event.result) {
      const result = event.result;
      const nextKeyword = keywordFromResult(result);
      setRitualPhase("reveal");
      setMood("happy");
      setScene("color");
      setAction("pet");
      setKeyword(nextKeyword);
      setStageColor({ name: result.color.name, hex: result.color.hex });
      setStatusLine(`今天的${result.color.name}已经醒来，它在用眼神回应你。`);

      const life = recordRitual({
        colorHex: result.color.hex,
        colorName: result.color.name,
        keyword: nextKeyword,
        statusLine: `今天的${result.color.name}已经醒来，它在用眼神回应你。`
      });
      setRelationshipLine(buildRelationshipNarrative(life).stageLine);
      setFeedbackLine(life.memoryState[0]?.line ?? `你们一起抽到了${result.color.name}。`);
      return;
    }

    if (event.phase === "idle") {
      setRitualPhase("idle");
      setAction("idle");
    }
  };

  return (
    <div className="brand-shell lucky-stage-page lucky-stage-page-minimal lucky-investor-page">
      <section className={`section lucky-live-stage ritual-${ritualPhase}`}>
        <LiveXiaoYangJuan
          luckyColor={stageColor.hex}
          mood={mood}
          scene={scene}
          action={action}
          ritualPhase={ritualPhase}
          keyword={keyword}
          statusLine={statusLine}
          size={282}
          metaHidden
        />

        <p className="lucky-stage-color-line">
          <span className="lucky-stage-color-dot" style={{ backgroundColor: stageColor.hex }} />
          当前颜色：<b>{stageColor.name}</b>
          <small>{stageColor.hex}</small>
        </p>

        <div className="lucky-main-actions lucky-investor-actions">
          <button type="button" className="cta" onClick={startDrawRitual}>
            {ritualPhase === "drawing" ? "正在揭晓今天的幸运色..." : "抽取今日幸运色"}
          </button>
          <button type="button" onClick={() => runPreset("pet")}>摸摸头</button>
          <button type="button" onClick={() => runPreset("cuddle")}>抱一抱</button>
          <button type="button" className="lucky-desktop-action" onClick={() => runPreset("near")}>靠近</button>
          <button type="button" className="lucky-desktop-action" onClick={() => runPreset("bedtime")}>今晚陪我</button>
          <details className="lucky-mobile-more">
            <summary>更多互动</summary>
            <button type="button" onClick={() => runPreset("near")}>靠近</button>
            <button type="button" onClick={() => runPreset("bedtime")}>今晚陪我</button>
          </details>
        </div>

        <p className="lucky-relationship-line">{relationshipLine}</p>
        <p className="lucky-feedback-line">{feedbackLine}</p>
      </section>

      <section id="play" className="section play-shell lucky-play-shell">
        <Suspense
          fallback={
            <div className="play-card loading-card">
              <h2>网页幸运转盘</h2>
              <p>正在准备今天的颜色，请稍等一下。</p>
            </div>
          }
        >
          <LazyWheel minimal spinSignal={spinSignal} onRitualEvent={onWheelRitualEvent} />
        </Suspense>
      </section>

      <p className="lucky-soft-links">
        <a href={ROUTE_PATHS.future}>去看你们的关系成长</a>
        <span>·</span>
        <a href={ROUTE_PATHS.about}>去看共同记忆</a>
      </p>
    </div>
  );
}
