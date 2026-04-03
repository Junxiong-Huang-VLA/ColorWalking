import { useEffect, useMemo, useRef, useState } from "react";
import { FAQ_ITEMS, ROUTE_PATHS, SUPPORT_CHANNELS } from "./config/brandWorld";
import { loadLifeState, onLifeStateUpdate, type DigitalLifeState } from "./digitalLifeState";
import { LiveXiaoYangJuan } from "./LiveXiaoYangJuan";
import { buildDemoHref, readDemoFlags } from "./demoMode";
import { DemoPathBar } from "./components/DemoPathBar";
import { LifeContinuityStrip } from "./components/LifeContinuityStrip";

function formatMemoryTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "--";
  }
}

export function AboutPage() {
  const [life, setLife] = useState<DigitalLifeState>(() => loadLifeState());
  const [demoTrack, setDemoTrack] = useState("");
  const demoFlags = useMemo(() => readDemoFlags(window.location.search), []);
  const isDemoMode = demoFlags.isDemoMode;
  const isAutoplayMode = demoFlags.isAutoplay;
  const autoStartedRef = useRef(false);
  const autoTimerRef = useRef<number[]>([]);
  const latest = life.memoryState[0];

  useEffect(() => onLifeStateUpdate((state) => setLife(state)), []);

  useEffect(() => {
    return () => {
      autoTimerRef.current.forEach((id) => window.clearTimeout(id));
      autoTimerRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isDemoMode || !isAutoplayMode || autoStartedRef.current) return;
    if (demoFlags.step !== "memory") return;
    autoStartedRef.current = true;
    setDemoTrack("步骤 7/8：共同记忆展示中。");

    const t1 = window.setTimeout(() => {
      setDemoTrack("步骤 8/8：回到候补承接区。");
    }, 2000);
    const t2 = window.setTimeout(() => {
      window.location.href = `${buildDemoHref(ROUTE_PATHS.future, "waitlist", {
        autoplay: true,
        internal: demoFlags.isInternal
      })}#waitlist-conversion`;
    }, 3300);
    autoTimerRef.current = [t1, t2];
  }, [demoFlags.isInternal, demoFlags.step, isAutoplayMode, isDemoMode]);

  const homeHref = isDemoMode
    ? buildDemoHref(ROUTE_PATHS.home, "home", { autoplay: false, internal: demoFlags.isInternal })
    : ROUTE_PATHS.home;
  const luckyHref = isDemoMode
    ? buildDemoHref(ROUTE_PATHS.lucky, "interaction", { autoplay: false, internal: demoFlags.isInternal })
    : ROUTE_PATHS.lucky;
  const waitlistHref = isDemoMode
    ? `${buildDemoHref(ROUTE_PATHS.future, "waitlist", { autoplay: false, internal: demoFlags.isInternal })}#waitlist-conversion`
    : `${ROUTE_PATHS.future}#waitlist-conversion`;

  return (
    <div className="brand-shell memory-page">
      <section className="section memory-stage">
        {isDemoMode ? <DemoPathBar activeStep="memory" autoplay={isAutoplayMode} /> : null}
        <LiveXiaoYangJuan
          luckyColor={latest?.colorHex ?? life.sheepState.luckyColorHex}
          mood={latest?.mood ?? life.sheepState.mood}
          scene={latest?.scene ?? life.sheepState.scene}
          statusLine={latest?.line ?? "你们的共同记忆，会从今天的幸运色开始。"}
          keyword={latest?.keyword ?? "共同记忆"}
          size={226}
          metaHidden
        />

        <p className="memory-stage-line">
          {life.memoryState.length > 0
            ? `你们已经沉淀了 ${life.memoryState.length} 段共同经历。`
            : "你们还没有共同记忆，先去完成一次抽色和一次互动。"}
        </p>

        <LifeContinuityStrip life={life} />
        {isDemoMode ? <p className="memory-demo-track">{demoTrack}</p> : null}
      </section>

      <section className="section memory-timeline-shell">
        <h2>共同经历时间线</h2>
        {life.memoryState.length ? (
          <ul className="memory-timeline">
            {life.memoryState.slice(0, 12).map((item) => (
              <li key={item.id}>
                <span className="memory-color-dot" style={{ backgroundColor: item.colorHex }} />
                <div>
                  <p>{item.line}</p>
                  <small>{formatMemoryTime(item.at)} · {item.keyword}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="memory-empty">先去首页抽取今日幸运色，小羊卷才会把你们的第一段记忆写下来。</p>
        )}
      </section>

      <section className="section memory-next-action">
        <p>这段记忆想继续吗？下一次见面可以留在候补承接里。</p>
        <a href={waitlistHref}>去候补名单 / 预约验证</a>
      </section>

      <details className="section memory-fold" id="faq">
        <summary>支持与 FAQ（下沉）</summary>
        <div className="memory-support-grid">
          {SUPPORT_CHANNELS.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <code>{item.contact}</code>
            </article>
          ))}
        </div>
        <div className="memory-faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="cw-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </details>

      <p className="memory-soft-links">
        <a href={homeHref}>回到生命舞台</a>
        <span>·</span>
        <a href={luckyHref}>继续今天的陪伴</a>
        <span>·</span>
        <a href={waitlistHref}>候补承接</a>
      </p>
    </div>
  );
}
