import type { AppTabKey, BondState, DailyColorState, MemoryState } from "../../state/types";

type CompanionJourneyProgressProps = {
  activeTab: AppTabKey;
  bondState: BondState;
  dailyColorState: DailyColorState;
  memoryState: MemoryState;
  onGoHome: () => void;
  onGoInteraction: () => void;
  onGoGrowth: () => void;
  onGoMemory: () => void;
};

type JourneyStep = {
  key: "home" | "interaction" | "growth" | "memory";
  label: string;
  desc: string;
};

const JOURNEY_STEPS: JourneyStep[] = [
  { key: "home", label: "抽取幸运色", desc: "确定今日陪伴主色" },
  { key: "interaction", label: "陪伴互动", desc: "和小羊卷完成轻互动" },
  { key: "growth", label: "关系成长", desc: "将互动转为关系进展" },
  { key: "memory", label: "共同经历", desc: "沉淀可回看的记忆" }
];

function resolveJourneyStage(props: Pick<CompanionJourneyProgressProps, "dailyColorState" | "bondState" | "memoryState">): number {
  if (!props.dailyColorState.colorId) return 0;
  if (props.bondState.todayInteractCount <= 0) return 1;
  if (props.bondState.level <= 1 && props.bondState.bondPoints < 20) return 2;
  if (!props.memoryState.sharedMoments.length && !props.memoryState.interactionSummaries.length) return 2;
  return 3;
}

export function CompanionJourneyProgress({
  activeTab,
  bondState,
  dailyColorState,
  memoryState,
  onGoHome,
  onGoInteraction,
  onGoGrowth,
  onGoMemory
}: CompanionJourneyProgressProps) {
  const stageIndex = resolveJourneyStage({ bondState, dailyColorState, memoryState });
  const activeStage = JOURNEY_STEPS[stageIndex] ?? JOURNEY_STEPS[0];
  const progress = Math.round(((stageIndex + 1) / JOURNEY_STEPS.length) * 100);

  const handlers: Record<JourneyStep["key"], () => void> = {
    home: onGoHome,
    interaction: onGoInteraction,
    growth: onGoGrowth,
    memory: onGoMemory
  };

  return (
    <section className="companion-journey" aria-label="当日陪伴阶段条">
      <div className="companion-journey-head">
        <p className="kicker">当日陪伴阶段条</p>
        <b>
          当前阶段：{stageIndex + 1}/4 · {activeStage.label}
        </b>
        <small>{activeStage.desc}</small>
      </div>
      <div className="companion-journey-progress">
        <i style={{ width: `${progress}%` }} />
      </div>
      <ol className="companion-journey-steps">
        {JOURNEY_STEPS.map((step, index) => {
          const done = index <= stageIndex;
          const isCurrentTab = activeTab === step.key;
          return (
            <li key={step.key} className={done ? "done" : ""}>
              <button
                type="button"
                className={isCurrentTab ? "journey-step active" : "journey-step"}
                onClick={handlers[step.key]}
              >
                <span className="journey-step-index">{index + 1}</span>
                <span>{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
