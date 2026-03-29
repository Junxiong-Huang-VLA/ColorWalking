import { buildLuckyShareText, COLOR_PALETTE, type DrawResult } from "@colorwalking/shared";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";

const HISTORY_KEY = "colorwalking.web.history.v1";
const LazyWheel = lazy(() => import("./WebLuckyWheel").then((mod) => ({ default: mod.WebLuckyWheel })));

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function LuckyColorPage() {
  const [history, setHistory] = useState<DrawResult[]>([]);
  const [hint, setHint] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const list = JSON.parse(raw) as DrawResult[];
      setHistory(list.slice(0, 12));
    } catch {
      setHistory([]);
    }

    const onDraw = (e: Event) => {
      const detail = (e as CustomEvent<DrawResult>).detail;
      if (!detail) return;
      setHistory((prev) => [detail, ...prev.filter((x) => x.id !== detail.id)].slice(0, 12));
    };

    window.addEventListener("colorwalking:draw-updated", onDraw as EventListener);
    return () => window.removeEventListener("colorwalking:draw-updated", onDraw as EventListener);
  }, []);

  const shareCandidate = useMemo(() => history[0] ?? null, [history]);

  const onCopyShare = async () => {
    if (!shareCandidate) return;
    const text = buildLuckyShareText(
      shareCandidate.color.name,
      shareCandidate.color.hex,
      shareCandidate.color.message
    );
    const ok = await copyText(`${text}\n${window.location.origin}/lucky-color`);
    setHint(ok ? "已复制分享文案" : "复制失败，请手动复制");
    window.setTimeout(() => setHint(""), 1400);
  };

  return (
    <div className="cw-page-stack">
      <section className="section cw-card">
        <h2>Lucky Color / 幸运色体系</h2>
        <p>这里不只是一个按钮，而是一整套内容系统：颜色库、寄语、moodTag、历史记录与分享。</p>
      </section>

      <section className="section cw-card">
        <h2>颜色库</h2>
        <div className="palette">
          {COLOR_PALETTE.map((item) => (
            <article key={item.id} className="cw-color-card">
              <span style={{ backgroundColor: item.hex }} />
              <b>{item.name}</b>
              <small>{item.hex}</small>
              <p>{item.message}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section cw-card">
        <h2>分享卡片</h2>
        {shareCandidate ? (
          <div className="cw-share-card">
            <div className="cw-share-dot" style={{ backgroundColor: shareCandidate.color.hex }} />
            <div>
              <b>{shareCandidate.color.name}</b>
              <p>{shareCandidate.color.message}</p>
              <small>{shareCandidate.color.hex}</small>
            </div>
            <button type="button" onClick={onCopyShare}>复制分享文案</button>
          </div>
        ) : (
          <p>先抽一次幸运色，就能生成分享文案卡片。</p>
        )}
        {hint ? <p className="cw-share-hint">{hint}</p> : null}
      </section>

      <section className="section cw-card">
        <h2>历史记录回看</h2>
        {history.length ? (
          <ul className="cw-history-list">
            {history.map((item) => (
              <li key={item.id}>
                <span style={{ backgroundColor: item.color.hex }} />
                <b>{item.color.name}</b>
                <small>{item.color.hex}</small>
                <em>{item.dayKey}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p>还没有历史记录，去转盘抽取今天的颜色吧。</p>
        )}
      </section>

      <section className="section play-shell">
        <Suspense
          fallback={
            <div className="play-card loading-card">
              <h2>网页幸运转盘</h2>
              <p>正在准备今天的颜色，请稍等一下。</p>
            </div>
          }
        >
          <LazyWheel />
        </Suspense>
      </section>
    </div>
  );
}
