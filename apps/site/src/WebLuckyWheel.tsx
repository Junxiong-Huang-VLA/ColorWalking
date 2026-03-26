import {
  COLOR_PALETTE,
  computeHistoryStats,
  createDrawEngine,
  formatDayKey,
  type DrawResult
} from "@colorwalking/shared";
import { useMemo, useState } from "react";

const HISTORY_KEY = "colorwalking.web.history.v1";
const RITUAL_KEY = "colorwalking.web.ritual.v1";
const EXTRA_ROUNDS = 6;

type DrawMode = "random" | "daily";
type RitualState = "idle" | "spinning" | "revealing";

type RitualStore = {
  dayKey: string;
  result: DrawResult;
};

const RITUAL_LINES = [
  "把今天交给一点颜色，也交给自己一点松弛。",
  "慢一点没关系，先让心情有个落点。",
  "这不是答案，只是一份轻轻的提醒。"
] as const;

const COLOR_CARE: Record<string, string> = {
  "sunrise-coral": "今天适合先照顾自己的情绪，再照顾效率。",
  "golden-spark": "把注意力放在一件小事上，就已经很了不起。",
  "mint-breath": "记得让呼吸慢下来，你不用一直绷着。",
  "river-blue": "遇到着急的事，先稳住节奏再做决定。",
  "grape-night": "把担心写下来，心里会慢慢空出位置。",
  "peach-mist": "对自己说话时，可以再温柔一点点。",
  "sky-foam": "做一点轻盈的小尝试，不需要一开始就完美。",
  "rose-dawn": "今天也值得被喜欢，哪怕只是一个瞬间。"
};

function buildWheelGradient(): string {
  const sector = 360 / COLOR_PALETTE.length;
  const parts: string[] = [];
  COLOR_PALETTE.forEach((c, i) => {
    const from = i * sector;
    const to = (i + 1) * sector;
    parts.push(`${c.hex} ${from}deg ${to}deg`);
  });
  return `conic-gradient(from 0deg, ${parts.join(", ")})`;
}

function loadRitual(): RitualStore | null {
  try {
    const raw = localStorage.getItem(RITUAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RitualStore;
  } catch {
    return null;
  }
}

function saveRitual(data: RitualStore): boolean {
  try {
    localStorage.setItem(RITUAL_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function loadHistory(): DrawResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DrawResult[];
  } catch {
    return [];
  }
}

function saveHistory(list: DrawResult[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function reminderByColor(result: DrawResult | null): string {
  if (!result) return "今天不用急着变好，先给自己一点好心情。";
  return COLOR_CARE[result.color.id] ?? "今天也请你温柔地和自己站在同一边。";
}

function loadTodayRitualResult(): DrawResult | null {
  const todayKey = formatDayKey(new Date());
  const ritual = loadRitual();
  if (!ritual || ritual.dayKey !== todayKey) return null;
  return ritual.result;
}

export function WebLuckyWheel() {
  const engine = useMemo(() => createDrawEngine(COLOR_PALETTE), []);
  const [mode, setMode] = useState<DrawMode>("daily");
  const [result, setResult] = useState<DrawResult | null>(() => loadTodayRitualResult());
  const [historyAll, setHistoryAll] = useState<DrawResult[]>(() => loadHistory());
  const [angle, setAngle] = useState(0);
  const [shareHint, setShareHint] = useState("");
  const [ritualState, setRitualState] = useState<RitualState>("idle");
  const [ritualLine, setRitualLine] = useState(
    result ? "今天的颜色已经为你留好，点一下就能再次查看。" : "准备好就点一下，我们开始今天的小仪式。"
  );
  const [todayCached, setTodayCached] = useState(() => Boolean(loadTodayRitualResult()));

  const spinning = ritualState === "spinning";
  const history = historyAll.slice(0, 5);
  const stats = useMemo(() => computeHistoryStats(historyAll), [historyAll]);

  const onSpin = () => {
    if (spinning) return;

    try {
      const todayKey = formatDayKey(new Date());
      const ritual = loadRitual();
      const draw =
        mode === "daily"
          ? ritual?.dayKey === todayKey
            ? ritual.result
            : engine.drawDaily()
          : engine.draw();

      if (mode === "daily" && (!ritual || ritual.dayKey !== todayKey)) {
        const saved = saveRitual({ dayKey: todayKey, result: draw });
        if (saved) setTodayCached(true);
      }

      const sector = 360 / engine.palette.length;
      const targetCenter = draw.index * sector + sector / 2;
      const nextAngle = angle - EXTRA_ROUNDS * 360 - targetCenter;

      setRitualState("spinning");
      setRitualLine("小羊卷在转盘旁边等你，一起揭晓今天的颜色。");
      setAngle(nextAngle);
      setShareHint("");

      window.setTimeout(() => {
        setRitualState("revealing");
        setRitualLine("结果出来啦，先收下这份只属于今天的温柔。");
        setResult(draw);

        const existingTodayIndex = historyAll.findIndex((x) => x.dayKey === draw.dayKey);
        let nextHistory = [...historyAll];
        if (existingTodayIndex >= 0 && mode === "daily") {
          nextHistory[existingTodayIndex] = draw;
        } else {
          nextHistory = [draw, ...nextHistory];
        }
        nextHistory = nextHistory.slice(0, 100);
        setHistoryAll(nextHistory);
        saveHistory(nextHistory);
        window.dispatchEvent(new CustomEvent("colorwalking:draw-updated", { detail: draw }));

        window.setTimeout(() => {
          setRitualState("idle");
          const randomLine = RITUAL_LINES[Math.floor(Math.random() * RITUAL_LINES.length)] ?? RITUAL_LINES[0];
          setRitualLine(randomLine);
        }, 460);
      }, 2200);
    } catch {
      setRitualState("idle");
      setRitualLine("这次没转起来，再点一下试试，我会陪着你。");
    }
  };

  const onShare = async () => {
    if (!result) return;
    const text = `我在 ColorWalking 抽到今日幸运色：${result.color.name} ${result.color.hex}。`;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "ColorWalking 今日颜色", text, url });
        setShareHint("已打开分享面板");
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareHint("已复制分享文案");
      }
    } catch {
      setShareHint("这次先不分享也没关系");
    }
    window.setTimeout(() => setShareHint(""), 1800);
  };

  const centerLabel =
    ritualState === "spinning" ? "揭晓中" : mode === "daily" && todayCached ? "查看今日色" : "开始抽色";

  return (
    <section className="play-card">
      <h2>网页转盘</h2>
      <p>点一下圆盘，抽取今天的幸运色和一句温柔提醒。</p>
      <p className="draw-ritual">{ritualLine}</p>

      <div className="mode-switch">
        <button
          type="button"
          className={mode === "daily" ? "mode-btn active" : "mode-btn"}
          onClick={() => setMode("daily")}
        >
          今日模式
        </button>
        <button
          type="button"
          className={mode === "random" ? "mode-btn active" : "mode-btn"}
          onClick={() => setMode("random")}
        >
          随机模式
        </button>
      </div>
      <button type="button" className="ghost-btn draw-helper-btn" onClick={onSpin} disabled={spinning}>
        {spinning ? "正在揭晓..." : "点这里也能抽色"}
      </button>

      <div className="play-layout">
        <div className={spinning ? "wheel-wrap is-disabled" : "wheel-wrap"}>
          <div className="wheel-pointer" />
          <button
            type="button"
            className="wheel-hit"
            onClick={onSpin}
            aria-label="点击转盘区域抽取幸运色"
            disabled={spinning}
          />
          <button
            type="button"
            className="wheel"
            onClick={(e) => {
              e.preventDefault();
              onSpin();
            }}
            style={{
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 2.2s cubic-bezier(0.19, 0.95, 0.2, 1)" : "none",
              background: buildWheelGradient()
            }}
            aria-label="点击转盘抽取幸运色"
            disabled={spinning}
          />
          <button
            type="button"
            className="wheel-center"
            onClick={(e) => {
              e.stopPropagation();
              onSpin();
            }}
            disabled={spinning}
          >
            {centerLabel}
          </button>
        </div>

        <div className="play-result">
          <h3>今日幸运色</h3>
          {result ? (
            <>
              <div className="result-swatch" style={{ background: result.color.hex }} />
              <b>{result.color.name}</b>
              <small>{result.color.hex}</small>
              <p className="result-reminder">{reminderByColor(result)}</p>
              <p className="result-message">{result.color.message}</p>
              <button type="button" className="share-btn" onClick={onShare}>
                分享这份颜色
              </button>
              {shareHint ? <p className="share-hint">{shareHint}</p> : null}
            </>
          ) : (
            <p>还没抽取。点一下转盘，收下今天的第一份温柔提示。</p>
          )}

          <h4>陪伴记录</h4>
          <div className="stats-row">
            <span>累计抽取：{stats.totalDraws}</span>
            <span>连续天数：{stats.streakDays}</span>
            <span>颜色种类：{stats.uniqueColors}</span>
          </div>
          {stats.topColor ? <p>你最常抽到：{stats.topColor.name}（{stats.topColor.count} 次）</p> : null}

          <h4>最近结果</h4>
          {history.length ? (
            <ul className="history-list">
              {history.map((item) => (
                <li key={item.id}>
                  <span style={{ background: item.color.hex }} />
                  <em>{item.color.name}</em>
                  <code>{item.color.hex}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p>这里还空着，等你来点亮第一条记录。</p>
          )}
        </div>
      </div>
    </section>
  );
}
