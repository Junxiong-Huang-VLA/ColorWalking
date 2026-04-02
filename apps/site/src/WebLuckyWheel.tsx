import {
  buildLuckyShareText,
  COLOR_PALETTE,
  computeHistoryStats,
  createDrawEngine,
  formatDayKey,
  luckyReminderByColorId,
  MODE_RITUAL_LINE,
  RITUAL_LINES,
  type DrawResult
} from "@colorwalking/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { DOWNLOAD_PAGE_PATH } from "./config/experience";

const HISTORY_KEY = "lambroll-isle.web.history.v1";
const LEGACY_HISTORY_KEY = "colorwalking.web.history.v1";
const RITUAL_KEY = "lambroll-isle.web.ritual.v1";
const LEGACY_RITUAL_KEY = "colorwalking.web.ritual.v1";
const DRAW_PENDING_EVENT = "lambroll-isle:draw-pending";
const DRAW_UPDATED_EVENT = "lambroll-isle:draw-updated";
const LEGACY_DRAW_PENDING_EVENT = "colorwalking:draw-pending";
const LEGACY_DRAW_UPDATED_EVENT = "colorwalking:draw-updated";

const WEB_BASE_ROUNDS = 9;
const WEB_EXTRA_ROUNDS = 4;
const WEB_BASE_DURATION = 3600;
const WEB_EXTRA_DURATION = 1100;

type DrawMode = "random" | "daily";
type RitualState = "idle" | "spinning" | "revealing";

type RitualStore = {
  dayKey: string;
  result: DrawResult;
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

const WHEEL_GRADIENT = buildWheelGradient();

function loadRitual(): RitualStore | null {
  try {
    const raw = localStorage.getItem(RITUAL_KEY);
    if (raw) return JSON.parse(raw) as RitualStore;
    const legacy = localStorage.getItem(LEGACY_RITUAL_KEY);
    if (!legacy) return null;
    const parsed = JSON.parse(legacy) as RitualStore;
    localStorage.setItem(RITUAL_KEY, JSON.stringify(parsed));
    return parsed;
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
    if (raw) return JSON.parse(raw) as DrawResult[];
    const legacy = localStorage.getItem(LEGACY_HISTORY_KEY);
    if (!legacy) return [];
    const parsed = JSON.parse(legacy) as DrawResult[];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(list: DrawResult[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function reminderByColor(result: DrawResult | null): string {
  return luckyReminderByColorId(result?.color.id);
}

function loadTodayRitualResult(): DrawResult | null {
  const todayKey = formatDayKey(new Date());
  const ritual = loadRitual();
  if (!ritual || ritual.dayKey !== todayKey) return null;
  return ritual.result;
}

async function copyTextFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

type Props = {
  minimal?: boolean;
  spinSignal?: number;
  onRitualEvent?: (event: { phase: "pending" | "reveal" | "idle"; result?: DrawResult }) => void;
};

export function WebLuckyWheel({ minimal = false, spinSignal, onRitualEvent }: Props) {
  const engine = useMemo(() => createDrawEngine(COLOR_PALETTE), []);
  const [mode, setMode] = useState<DrawMode>("daily");
  const [result, setResult] = useState<DrawResult | null>(() => loadTodayRitualResult());
  const [historyAll, setHistoryAll] = useState<DrawResult[]>(() => loadHistory());
  const [angle, setAngle] = useState(0);
  const [spinMs, setSpinMs] = useState(4300);
  const [shareHint, setShareHint] = useState("");
  const [ritualState, setRitualState] = useState<RitualState>("idle");
  const [ritualLine, setRitualLine] = useState(
    result ? "今天的颜色已经准备好了，点一下再看一次揭晓。" : "准备好就点一下，我们开始今天的小仪式。"
  );
  const [todayCached, setTodayCached] = useState(() => Boolean(loadTodayRitualResult()));
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [isNewResult, setIsNewResult] = useState(false);
  const rotationRef = useRef(0);
  const lastSpinSignalRef = useRef<number | null>(null);

  const spinning = ritualState === "spinning";
  const history = historyExpanded ? historyAll : historyAll.slice(0, 5);
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
      const rounds = WEB_BASE_ROUNDS + Math.floor(Math.random() * WEB_EXTRA_ROUNDS);
      const duration = WEB_BASE_DURATION + Math.floor(Math.random() * WEB_EXTRA_DURATION);
      const nextAngle = rotationRef.current - rounds * 360 - targetCenter;

      setRitualState("spinning");
      setSpinMs(duration);
      setRitualLine("小羊卷在等你，马上揭晓今天的颜色。\n");
      setShareHint("");
      onRitualEvent?.({ phase: "pending" });
      window.dispatchEvent(new CustomEvent(DRAW_PENDING_EVENT));
      window.dispatchEvent(new CustomEvent(LEGACY_DRAW_PENDING_EVENT));

      window.requestAnimationFrame(() => {
        setAngle(nextAngle);
      });

      window.setTimeout(() => {
        rotationRef.current = nextAngle;
        setRitualState("revealing");
        setRitualLine("结果出来了，收下这份属于今天的温柔。\n");
        setResult(draw);
        onRitualEvent?.({ phase: "reveal", result: draw });
        setIsNewResult(true);
        window.setTimeout(() => setIsNewResult(false), 900);

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
        window.dispatchEvent(new CustomEvent(DRAW_UPDATED_EVENT, { detail: draw }));
        window.dispatchEvent(new CustomEvent(LEGACY_DRAW_UPDATED_EVENT, { detail: draw }));

        window.setTimeout(() => {
          setRitualState("idle");
          onRitualEvent?.({ phase: "idle" });
          const line = RITUAL_LINES[Math.floor(Math.random() * RITUAL_LINES.length)] ?? RITUAL_LINES[0];
          setRitualLine(line);
        }, 520);
      }, duration);
    } catch {
      setRitualState("idle");
      setRitualLine("这次没转起来，我们再轻轻试一次。\n");
    }
  };

  useEffect(() => {
    if (spinSignal == null) return;
    if (lastSpinSignalRef.current === spinSignal) return;
    lastSpinSignalRef.current = spinSignal;
    window.setTimeout(() => onSpin(), 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinSignal]);

  const onShare = async () => {
    if (!result) return;
    const text = buildLuckyShareText(result.color.name, result.color.hex, result.color.message);
    const url = window.location.href;
    const merged = `${text}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "羊卷岛今日幸运色", text, url });
        setShareHint("已打开分享面板");
      } else {
        const ok = await copyTextFallback(merged);
        setShareHint(ok ? "已复制分享文案" : "复制失败，请手动复制");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setShareHint("你取消了分享，没关系");
      } else {
        const ok = await copyTextFallback(merged);
        setShareHint(ok ? "已复制分享文案" : "这次先不分享也没关系");
      }
    }
    window.setTimeout(() => setShareHint(""), 2200);
  };

  const centerLabel =
    ritualState === "spinning" ? "揭晓中" : mode === "daily" && todayCached ? "再看今日色" : "开始抽色";

  return (
    <section className="play-card">
      <h2>网页幸运转盘</h2>
      <p>点一下圆盘，抽取今天的幸运色和一条温柔提醒。</p>
      <p className="draw-ritual">{ritualLine}</p>

      {!minimal ? (
        <div className="mode-switch">
          <button
            type="button"
            className={mode === "daily" ? "mode-btn active" : "mode-btn"}
            onClick={() => {
              setMode("daily");
              if (ritualState === "idle") setRitualLine(MODE_RITUAL_LINE.daily(todayCached));
            }}
          >
            今日模式
          </button>
          <button
            type="button"
            className={mode === "random" ? "mode-btn active" : "mode-btn"}
            onClick={() => {
              setMode("random");
              if (ritualState === "idle") setRitualLine(MODE_RITUAL_LINE.random());
            }}
          >
            随机模式
          </button>
        </div>
      ) : null}
      {!minimal ? (
        <button type="button" className="ghost-btn draw-helper-btn" onClick={onSpin} disabled={spinning}>
          {spinning ? "正在揭晓..." : "点这里也能抽色"}
        </button>
      ) : null}

      <div className="play-layout">
        <div className={spinning ? "wheel-wrap is-disabled" : "wheel-wrap"}>
          <div className="wheel-pointer" />
          <div className={spinning ? "wheel-orbit is-spinning" : "wheel-orbit"}>
            <i />
          </div>
          <button
            type="button"
            className="wheel-hit"
            onClick={onSpin}
            aria-label="点击转盘区域抽取幸运色"
            disabled={spinning}
          />
          <div
            className="wheel"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: spinning ? `transform ${spinMs}ms cubic-bezier(0.08, 0.86, 0.14, 1)` : "none",
              background: WHEEL_GRADIENT
            }}
            aria-hidden="true"
          />
          <button type="button" className="wheel-center" onClick={onSpin} disabled={spinning}>
            {centerLabel}
          </button>
        </div>

        <div className="play-result">
          <h3>今日幸运色</h3>
          {result ? (
            <div className={isNewResult ? "result-reveal" : ""}>
              <div className={`result-swatch${isNewResult ? " is-new" : ""}`} style={{ background: result.color.hex }} />
              <b>{result.color.name}</b>
              <small>{result.color.hex}</small>
              {result.color.moodTag ? <p className="result-mood-tag">情绪关键词：{result.color.moodTag}</p> : null}
              <p className="result-reminder">{reminderByColor(result)}</p>
              <p className="result-message">{result.color.message}</p>
              <button type="button" className="share-btn" onClick={onShare}>
                分享这份颜色
              </button>
              <a className="ghost-btn history-toggle-btn" href={DOWNLOAD_PAGE_PATH}>
                下载 App 继续陪伴
              </a>
              {shareHint ? <p className="share-hint">{shareHint}</p> : null}
            </div>
          ) : (
            <p>还没抽取。点一下转盘，收下今天的第一份温柔提示。</p>
          )}

          {!minimal ? (
            <>
              <h4>陪伴记录</h4>
              <div className="stats-row">
                <span>累计抽取：{stats.totalDraws}</span>
                <span>连续天数：{stats.streakDays}</span>
                <span>颜色种类：{stats.uniqueColors}</span>
              </div>
              {stats.topColor ? <p>你最常抽到：{stats.topColor.name}（{stats.topColor.count} 次）</p> : null}

              <h4>最近结果</h4>
              {history.length ? (
                <>
                  <ul className="history-list">
                    {history.map((item) => (
                      <li key={item.id}>
                        <span style={{ background: item.color.hex }} />
                        <em>{item.color.name}</em>
                        <code>{item.color.hex}</code>
                      </li>
                    ))}
                  </ul>
                  {historyAll.length > 5 && (
                    <button type="button" className="ghost-btn history-toggle-btn" onClick={() => setHistoryExpanded((v) => !v)}>
                      {historyExpanded ? "收起" : `查看全部 ${historyAll.length} 条记录`}
                    </button>
                  )}
                </>
              ) : (
                <p>这里还空着，等你点亮第一条记录。</p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}




