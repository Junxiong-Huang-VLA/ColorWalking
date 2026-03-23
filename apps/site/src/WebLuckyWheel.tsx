import {
  COLOR_PALETTE,
  computeHistoryStats,
  createDrawEngine,
  type DrawResult
} from "@colorwalking/shared";
import { useMemo, useState } from "react";

const HISTORY_KEY = "colorwalking.web.history.v1";
const EXTRA_ROUNDS = 6;

type DrawMode = "random" | "daily";

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

export function WebLuckyWheel() {
  const engine = useMemo(() => createDrawEngine(COLOR_PALETTE), []);
  const [mode, setMode] = useState<DrawMode>("random");
  const [result, setResult] = useState<DrawResult | null>(null);
  const [historyAll, setHistoryAll] = useState<DrawResult[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as DrawResult[];
    } catch {
      return [];
    }
  });
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [shareHint, setShareHint] = useState("");

  const history = historyAll.slice(0, 5);
  const stats = useMemo(() => computeHistoryStats(historyAll), [historyAll]);

  const onSpin = () => {
    if (spinning) return;

    const draw = mode === "daily" ? engine.drawDaily() : engine.draw();
    const sector = 360 / engine.palette.length;
    const targetCenter = draw.index * sector + sector / 2;
    const nextAngle = angle - EXTRA_ROUNDS * 360 - targetCenter;

    setSpinning(true);
    setAngle(nextAngle);

    window.setTimeout(() => {
      setResult(draw);
      const nextHistory = [draw, ...historyAll].slice(0, 100);
      setHistoryAll(nextHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
      setSpinning(false);
    }, 2200);
  };

  const onShare = async () => {
    if (!result) return;
    const text = `我在 ColorWalking 抽到今日幸运色：${result.color.name} ${result.color.hex}。`;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "ColorWalking 幸运色", text, url });
        setShareHint("已打开分享面板");
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareHint("已复制分享文案");
      }
    } catch {
      setShareHint("分享取消或失败");
    }
    window.setTimeout(() => setShareHint(""), 1800);
  };

  return (
    <section id="play" className="section play-card">
      <h2>网页版转盘</h2>
      <p>点击圆盘或中心按钮，立即抽取你的今日幸运色。</p>

      <div className="mode-switch">
        <button
          type="button"
          className={mode === "random" ? "mode-btn active" : "mode-btn"}
          onClick={() => setMode("random")}
        >
          随机模式
        </button>
        <button
          type="button"
          className={mode === "daily" ? "mode-btn active" : "mode-btn"}
          onClick={() => setMode("daily")}
        >
          今日固定
        </button>
      </div>

      <div className="play-layout">
        <div className="wheel-wrap">
          <div className="wheel-pointer" />
          <button
            type="button"
            className="wheel"
            onClick={onSpin}
            style={{
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 2.2s cubic-bezier(0.19, 0.95, 0.2, 1)" : "none",
              background: buildWheelGradient()
            }}
            aria-label="点击转盘抽取幸运色"
          />
          <button type="button" className="wheel-center" onClick={onSpin}>
            {spinning ? "转动中" : "再抽一次"}
          </button>
        </div>

        <div className="play-result">
          <h3>抽取结果</h3>
          {result ? (
            <>
              <div className="result-swatch" style={{ background: result.color.hex }} />
              <b>{result.color.name}</b>
              <small>{result.color.hex}</small>
              <p>{result.color.message}</p>
              <button type="button" className="share-btn" onClick={onShare}>
                分享幸运色
              </button>
              {shareHint ? <p className="share-hint">{shareHint}</p> : null}
            </>
          ) : (
            <p>点击转盘，开始今天的好心情。</p>
          )}

          <h4>数据概览</h4>
          <div className="stats-row">
            <span>累计抽取：{stats.totalDraws}</span>
            <span>连续天数：{stats.streakDays}</span>
            <span>色彩种类：{stats.uniqueColors}</span>
          </div>
          {stats.topColor ? (
            <p>
              高频颜色：{stats.topColor.name}（{stats.topColor.count} 次）
            </p>
          ) : null}

          <h4>最近记录</h4>
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
            <p>还没有记录</p>
          )}
        </div>
      </div>
    </section>
  );
}
