import { useEffect, useMemo, useRef, useState } from "react";
import { buildRelationshipNarrative, loadLifeState, onLifeStateUpdate, type DigitalLifeState } from "./digitalLifeState";
import { LiveXiaoYangJuan } from "./LiveXiaoYangJuan";
import { ROUTE_PATHS } from "./config/brandWorld";
import { buildDemoHref, readDemoFlags } from "./demoMode";
import { ClosureReadinessPanel } from "./components/ClosureReadinessPanel";
import { DemoPathBar } from "./components/DemoPathBar";
import { LifeContinuityStrip } from "./components/LifeContinuityStrip";
import { WaitlistConversionCard } from "./components/WaitlistConversionCard";

export function FuturePage() {
  const [life, setLife] = useState<DigitalLifeState>(() => loadLifeState());
  const [demoTrack, setDemoTrack] = useState("");
  const demoFlags = useMemo(() => readDemoFlags(window.location.search), []);
  const isDemoMode = demoFlags.isDemoMode;
  const isAutoplayMode = demoFlags.isAutoplay;
  const autoStartedRef = useRef(false);
  const autoTimerRef = useRef<number[]>([]);

  const narrative = useMemo(() => buildRelationshipNarrative(life), [life]);
  const latest = life.memoryState[0];
  const isWaitlistStep = demoFlags.step === "waitlist";

  useEffect(() => onLifeStateUpdate((state) => setLife(state)), []);

  useEffect(() => {
    return () => {
      autoTimerRef.current.forEach((id) => window.clearTimeout(id));
      autoTimerRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isDemoMode || !isAutoplayMode || autoStartedRef.current) return;
    if (demoFlags.step !== "growth") return;
    autoStartedRef.current = true;
    setDemoTrack("步骤 6/8：关系成长展示中。");

    const t1 = window.setTimeout(() => {
      setDemoTrack("步骤 7/8：进入共同记忆页。");
    }, 2400);
    const t2 = window.setTimeout(() => {
      window.location.href = buildDemoHref(ROUTE_PATHS.about, "memory", {
        autoplay: true,
        internal: demoFlags.isInternal
      });
    }, 3600);
    autoTimerRef.current = [t1, t2];
  }, [demoFlags.isInternal, demoFlags.step, isAutoplayMode, isDemoMode]);

  const homeHref = isDemoMode
    ? buildDemoHref(ROUTE_PATHS.home, "home", { autoplay: false, internal: demoFlags.isInternal })
    : ROUTE_PATHS.home;
  const memoryHref = isDemoMode
    ? buildDemoHref(ROUTE_PATHS.about, "memory", { autoplay: false, internal: demoFlags.isInternal })
    : ROUTE_PATHS.about;
  const premiereHref = buildDemoHref(ROUTE_PATHS.home, "home", { autoplay: true, internal: demoFlags.isInternal });

  return (
    <div className="brand-shell growth-page">
      <section className="section growth-stage">
        {isDemoMode ? <DemoPathBar activeStep={isWaitlistStep ? "waitlist" : "growth"} autoplay={isAutoplayMode} /> : null}
        <LiveXiaoYangJuan
          luckyColor={life.sheepState.luckyColorHex}
          mood={life.sheepState.mood}
          scene={life.sheepState.scene}
          statusLine={`${narrative.stageLine}。${narrative.nextLine}`}
          keyword={latest?.keyword ?? "陪伴持续发生"}
          size={228}
          metaHidden
        />
        <p className="growth-stage-line">{narrative.stageLine}</p>
        <p className="growth-next-line">{narrative.nextLine}</p>

        <div className="growth-traits">
          {life.growthState.traits.slice(0, 4).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <p className="growth-memory-anchor">
          {latest ? `最近一次共同经历：${latest.line}` : "你们还没有记忆沉淀，先从一次抽色开始。"}
        </p>
        <LifeContinuityStrip life={life} />
        {isDemoMode ? <p className="growth-demo-track">{demoTrack}</p> : null}
      </section>

      <WaitlistConversionCard
        life={life}
        source={isDemoMode ? "premiere" : "future"}
        onLifeChange={(next) => setLife(next)}
        autoDemoSubmit={isDemoMode && isAutoplayMode && isWaitlistStep}
        showDataOps={demoFlags.isInternal}
      />

      {isDemoMode || demoFlags.isInternal ? (
        <ClosureReadinessPanel life={life} onLifeChange={(next) => setLife(next)} open={isDemoMode} />
      ) : null}

      <p className="growth-soft-links">
        <a href={homeHref}>回到生命舞台</a>
        {isDemoMode || demoFlags.isInternal ? (
          <>
            <span>·</span>
            <a href={premiereHref}>一键投资人首演</a>
          </>
        ) : null}
        <span>·</span>
        <a href={memoryHref} data-testid="growth-to-memory-link">查看共同记忆</a>
      </p>
    </div>
  );
}
