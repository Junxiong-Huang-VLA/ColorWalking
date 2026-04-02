import { COLOR_PALETTE, formatDayKey } from "@colorwalking/shared";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

type Props = {
  WheelSection: ReactNode;
};

type WheelHistoryItem = {
  dayKey?: string;
  color?: { id?: string; name?: string; hex?: string };
};

type StageColor = {
  id: string;
  name: string;
  hex: string;
};

type ActionKey = "pet" | "cuddle" | "near" | "bedtime";
type PremiereCue = {
  timecode: string;
  line: string;
};

const HISTORY_KEY = "lambroll-isle.web.history.v1";
const LEGACY_HISTORY_KEY = "colorwalking.web.history.v1";

const ACTION_PRESETS: Record<
  ActionKey,
  { mood: LiveMood; scene: LiveScene; action: LiveAction; line: string }
> = {
  pet: {
    mood: "happy",
    scene: "chat",
    action: "pet",
    line: "小羊卷抬眼看着你，像在说：我听见你啦。"
  },
  cuddle: {
    mood: "soft",
    scene: "comfort",
    action: "cuddle",
    line: "它把呼吸慢下来，把这次拥抱稳稳接住。"
  },
  near: {
    mood: "shy",
    scene: "mood",
    action: "near",
    line: "你靠近时，它先偷看你一眼，再悄悄靠过来。"
  },
  bedtime: {
    mood: "sleepy",
    scene: "bedtime",
    action: "bedtime",
    line: "它的眼神变得更软了，像在陪你收好今天。"
  }
};

const COLOR_KEYWORD_MAP: Record<string, string> = {
  "#ff8da1": "被温柔接住",
  "#7ea9df": "慢慢呼吸",
  "#ffb870": "今天也有光",
  "#8bd5c4": "心里变轻一点",
  "#c39bff": "允许自己柔软",
  "#ffd96b": "把好运穿在身上"
};

const PREMIERE_COPY_CUES: PremiereCue[] = [
  { timecode: "00:00", line: "打开首页，镜头先给到舞台中央呼吸着的小羊卷。" },
  { timecode: "00:01", line: "点击「抽取今日幸运色」，让它开始今天的唤醒仪式。" },
  { timecode: "00:03", line: "颜色流动中，围巾与眼神同步亮起来。" },
  { timecode: "00:05", line: "幸运色揭晓后，立刻触发一次温柔互动回应。" },
  { timecode: "00:08", line: "展示关系沉淀：今天的陪伴已写进共同记忆。" }
];

function defaultColor(): StageColor {
  const first = COLOR_PALETTE[0];
  return {
    id: first?.id ?? "cloud-sky",
    name: first?.name ?? "云雾蓝",
    hex: first?.hex ?? "#7ea9df"
  };
}

function readTodayLuckyColor(): StageColor {
  const fallback = defaultColor();
  try {
    const raw = localStorage.getItem(HISTORY_KEY) ?? localStorage.getItem(LEGACY_HISTORY_KEY);
    if (!raw) return fallback;
    if (!localStorage.getItem(HISTORY_KEY)) localStorage.setItem(HISTORY_KEY, raw);
    const list = JSON.parse(raw) as WheelHistoryItem[];
    const today = formatDayKey(new Date());
    const hit = list.find((item) => item?.dayKey === today && item?.color?.hex);
    if (!hit?.color?.hex) return fallback;
    return {
      id: hit.color.id ?? fallback.id,
      name: hit.color.name ?? fallback.name,
      hex: hit.color.hex
    };
  } catch {
    return fallback;
  }
}

function randomPaletteColor(): StageColor {
  const item = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)] ?? COLOR_PALETTE[0];
  return {
    id: item?.id ?? defaultColor().id,
    name: item?.name ?? defaultColor().name,
    hex: item?.hex ?? defaultColor().hex
  };
}

function keywordByColor(hex: string): string {
  return COLOR_KEYWORD_MAP[hex.toLowerCase()] ?? "今天也值得被好好陪伴";
}

function safeMood(input: string): LiveMood {
  if (input === "calm" || input === "soft" || input === "happy" || input === "sleepy" || input === "shy" || input === "sad") {
    return input;
  }
  return "soft";
}

function safeScene(input: string): LiveScene {
  if (input === "chat" || input === "comfort" || input === "bedtime" || input === "mood" || input === "color") {
    return input;
  }
  return "chat";
}

export function HomePage({ WheelSection: _WheelSection }: Props) {
  const [luckyColor, setLuckyColor] = useState<StageColor>(() => readTodayLuckyColor());
  const [mood, setMood] = useState<LiveMood>("soft");
  const [scene, setScene] = useState<LiveScene>("color");
  const [action, setAction] = useState<LiveAction>("idle");
  const [ritualPhase, setRitualPhase] = useState<LiveRitualPhase>("idle");
  const [statusLine, setStatusLine] = useState("小羊卷在舞台中央等你，今天先从一个温柔动作开始。");
  const [keyword, setKeyword] = useState("");
  const [responseLine, setResponseLine] = useState("你们的今天还没开始，先抽一次幸运色。");
  const [relationshipLine, setRelationshipLine] = useState("你们正在建立第一层信任。\n");
  const [premiereTrackLine, setPremiereTrackLine] = useState("");
  const [premiereRunning, setPremiereRunning] = useState(false);

  const isPremiereMode = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    return q.get("premiere") === "1" || q.get("demo") === "1";
  }, []);

  const actionTimerRef = useRef<number | null>(null);
  const ritualTimerRef = useRef<number[]>([]);
  const premiereTimerRef = useRef<number[]>([]);
  const premiereRunningRef = useRef(false);
  const premiereAutoStartedRef = useRef(false);
  const runPremiereScriptRef = useRef<() => void>(() => undefined);

  const applyLifeState = useCallback((life: DigitalLifeState) => {
    setLuckyColor((prev) => ({
      id: prev.id,
      name: life.sheepState.luckyColorName || prev.name,
      hex: life.sheepState.luckyColorHex || prev.hex
    }));
    setMood(safeMood(life.sheepState.mood));
    setScene(safeScene(life.sheepState.scene));
    setRelationshipLine(buildRelationshipNarrative(life).stageLine);
    if (life.memoryState[0]?.line) setResponseLine(life.memoryState[0].line);
  }, []);

  useEffect(() => {
    applyLifeState(loadLifeState());
    return onLifeStateUpdate((state) => applyLifeState(state));
  }, [applyLifeState]);

  const clearRitualTimers = useCallback(() => {
    ritualTimerRef.current.forEach((id) => window.clearTimeout(id));
    ritualTimerRef.current = [];
  }, []);

  const clearPremiereTimers = useCallback(() => {
    premiereTimerRef.current.forEach((id) => window.clearTimeout(id));
    premiereTimerRef.current = [];
    premiereRunningRef.current = false;
    setPremiereRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
      clearRitualTimers();
      clearPremiereTimers();
    };
  }, [clearPremiereTimers, clearRitualTimers]);

  const runPreset = useCallback((key: ActionKey) => {
    const preset = ACTION_PRESETS[key];
    setMood(preset.mood);
    setScene(preset.scene);
    setAction(preset.action);
    setStatusLine(preset.line);
    setRitualPhase("idle");

    const life = recordInteraction({
      action: key,
      mood: preset.mood,
      scene: preset.scene,
      statusLine: preset.line,
      colorHex: luckyColor.hex,
      colorName: luckyColor.name
    });
    setRelationshipLine(buildRelationshipNarrative(life).stageLine);
    setResponseLine(life.memoryState[0]?.line ?? preset.line);

    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
    actionTimerRef.current = window.setTimeout(() => setAction("idle"), 1500);
  }, [luckyColor.hex, luckyColor.name]);

  const runLuckyRitual = useCallback(() => {
    if (ritualPhase !== "idle") return;
    clearRitualTimers();

    setRitualPhase("prepare");
    setMood("calm");
    setScene("color");
    setAction("near");
    setStatusLine("闭上眼三秒，小羊卷正在收集今天的颜色。\n");

    const t1 = window.setTimeout(() => {
      setRitualPhase("drawing");
      setAction("near");
      setMood("soft");
      setStatusLine("颜色正在靠近，围巾和眼睛都在慢慢亮起来。\n");
    }, 760);

    const t2 = window.setTimeout(() => {
      const picked = randomPaletteColor();
      const nextKeyword = keywordByColor(picked.hex);
      setLuckyColor(picked);
      setKeyword(nextKeyword);
      setRitualPhase("reveal");
      setMood("happy");
      setScene("color");
      setAction("pet");
      setStatusLine(`今天的${picked.name}醒来了，它已经在围巾和眼神里回应你。`);

      const life = recordRitual({
        colorHex: picked.hex,
        colorName: picked.name,
        keyword: nextKeyword,
        statusLine: `今天的${picked.name}醒来了，它已经在围巾和眼神里回应你。`
      });

      setRelationshipLine(buildRelationshipNarrative(life).stageLine);
      setResponseLine(life.memoryState[0]?.line ?? `你们一起抽到了${picked.name}。`);
    }, 2150);

    const t3 = window.setTimeout(() => {
      setRitualPhase("idle");
      setAction("idle");
    }, 3950);

    ritualTimerRef.current = [t1, t2, t3];
  }, [clearRitualTimers, ritualPhase]);

  const runPremiereScript = useCallback(() => {
    if (premiereRunningRef.current) return;
    clearPremiereTimers();
    clearRitualTimers();
    setRitualPhase("idle");
    setAction("idle");
    premiereRunningRef.current = true;
    setPremiereRunning(true);
    setPremiereTrackLine("首演脚本已启动：小羊卷正在进入今天的舞台。");

    const t1 = window.setTimeout(() => runLuckyRitual(), 420);
    const t2 = window.setTimeout(() => {
      setPremiereTrackLine("首演脚本：展示「摸摸头」回应。");
      runPreset("pet");
    }, 5200);
    const t3 = window.setTimeout(() => {
      setPremiereTrackLine("首演脚本：展示「抱一抱」回应。");
      runPreset("cuddle");
    }, 7400);
    const t4 = window.setTimeout(() => {
      const life = loadLifeState();
      setPremiereTrackLine(`首演脚本完成：${buildRelationshipNarrative(life).stageLine}。`);
      premiereRunningRef.current = false;
      setPremiereRunning(false);
    }, 9800);

    premiereTimerRef.current = [t1, t2, t3, t4];
  }, [clearPremiereTimers, clearRitualTimers, runLuckyRitual, runPreset]);

  useEffect(() => {
    runPremiereScriptRef.current = runPremiereScript;
  }, [runPremiereScript]);

  const buildPremiereCopy = useCallback(() => {
    const life = loadLifeState();
    const stage = buildRelationshipNarrative(life);
    const todayKeyword = keyword || "今天也值得被好好陪伴";
    const header = [
      "小羊卷数字生命人｜首演录屏文案",
      `日期：${formatDayKey(new Date())}`,
      `今日幸运色：${luckyColor.name} ${luckyColor.hex}`,
      `今日关键词：${todayKeyword}`,
      `关系阶段：${stage.stageLine}`,
      ""
    ];
    const body = PREMIERE_COPY_CUES.map((cue) => `[${cue.timecode}] ${cue.line}`);
    const outro = [
      "",
      "收尾旁白：",
      `“今天的小羊卷已经醒来。我们把这次陪伴写进了共同记忆，下一次见面，它会更早看向你。”`
    ];
    return [...header, ...body, ...outro].join("\n");
  }, [keyword, luckyColor.hex, luckyColor.name]);

  const exportPremiereCopy = useCallback(async () => {
    const copy = buildPremiereCopy();
    const filename = `xiaoyangjuan-premiere-script-${formatDayKey(new Date())}.txt`;
    let copied = false;
    try {
      await navigator.clipboard.writeText(copy);
      copied = true;
    } catch {
      copied = false;
    }

    const blob = new Blob([copy], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setPremiereTrackLine(copied ? "录屏文案已导出，并复制到剪贴板。" : "录屏文案已导出。");
  }, [buildPremiereCopy]);

  useEffect(() => {
    if (!isPremiereMode || premiereAutoStartedRef.current) return;
    premiereAutoStartedRef.current = true;
    setPremiereTrackLine("首演模式已启动，点击下方按钮可一键完整演示。");
    const t = window.setTimeout(() => runPremiereScriptRef.current(), 620);
    premiereTimerRef.current = [t];
    return () => clearPremiereTimers();
  }, [clearPremiereTimers, isPremiereMode]);

  const stageClass = `section home-life-stage investor-hero ritual-${ritualPhase}${isPremiereMode ? " is-premiere" : ""}`;

  return (
    <div className="brand-shell home-life-page home-life-page-minimal investor-home">
      <section className={stageClass} id="hero-stage">
        {isPremiereMode ? <p className="premiere-mode-pill">首演模式 / Premiere</p> : null}

        <LiveXiaoYangJuan
          luckyColor={luckyColor.hex}
          mood={mood}
          scene={scene}
          action={action}
          ritualPhase={ritualPhase}
          keyword={keyword}
          statusLine={statusLine}
          size={318}
          metaHidden
        />

        <p className="home-life-color-line">
          <span className="home-life-color-dot" style={{ backgroundColor: luckyColor.hex }} />
          今日幸运色：<b>{luckyColor.name}</b>
          <small>{luckyColor.hex}</small>
        </p>

        <div className="home-life-primary-actions home-investor-primary">
          <button type="button" className="cta home-life-draw" onClick={runLuckyRitual}>
            {ritualPhase === "drawing" ? "正在唤醒今日幸运色..." : "抽取今日幸运色"}
          </button>
          <a className="cta home-life-start" href={ROUTE_PATHS.lucky}>
            开始今天的陪伴
          </a>
        </div>

        <div className="home-life-secondary-actions" aria-label="首屏快速互动">
          <button type="button" onClick={() => runPreset("pet")}>摸摸头</button>
          <button type="button" onClick={() => runPreset("cuddle")}>抱一抱</button>
          <button type="button" className="home-life-desktop-only" onClick={() => runPreset("near")}>靠近</button>
          <button type="button" className="home-life-desktop-only" onClick={() => runPreset("bedtime")}>今晚陪我</button>

          <details className="home-life-mobile-more">
            <summary>更多互动</summary>
            <button type="button" onClick={() => runPreset("near")}>靠近</button>
            <button type="button" onClick={() => runPreset("bedtime")}>今晚陪我</button>
          </details>
        </div>

        <p className="home-stage-relationship">{relationshipLine}</p>
        <p className="home-stage-memory">{responseLine}</p>

        {isPremiereMode ? (
          <div className="home-premiere-controls">
            <button type="button" onClick={runPremiereScript} disabled={premiereRunning}>
              {premiereRunning ? "首演脚本执行中..." : "一键首演脚本"}
            </button>
            <button type="button" onClick={exportPremiereCopy}>
              导出录屏文案
            </button>
          </div>
        ) : null}

        {isPremiereMode ? <p className="home-premiere-track">{premiereTrackLine}</p> : null}
      </section>
    </div>
  );
}
