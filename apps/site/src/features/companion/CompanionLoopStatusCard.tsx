import type { BondState, DailyColorState, DeviceState, GrowthState, MemoryState, UserProfileState } from "../../state/types";

type CompanionLoopStatusCardProps = {
  dailyColorState: DailyColorState;
  bondState: BondState;
  growthState: GrowthState;
  memoryState: MemoryState;
  deviceState: DeviceState;
  userProfile: UserProfileState;
  onGoLuckyColor: () => void;
  onGoInteraction: () => void;
  onGoGrowth: () => void;
  onGoMemory: () => void;
  onGoDevice: () => void;
  onGoValidation: () => void;
};

type LoopCheckpoint = {
  id: string;
  label: string;
  done: boolean;
  actionLabel: string;
  onAction: () => void;
};

function resolveCheckpoints(props: CompanionLoopStatusCardProps): LoopCheckpoint[] {
  return [
    {
      id: "lucky_color",
      label: "今日幸运色已抽取",
      done: Boolean(props.dailyColorState.colorId),
      actionLabel: "去抽色",
      onAction: props.onGoLuckyColor
    },
    {
      id: "interaction",
      label: "今日已发生陪伴互动",
      done: props.bondState.todayInteractCount > 0,
      actionLabel: "去互动",
      onAction: props.onGoInteraction
    },
    {
      id: "growth",
      label: "关系成长已推进",
      done: props.bondState.level > 1 || props.growthState.completedTaskIds.length > 0,
      actionLabel: "去成长",
      onAction: props.onGoGrowth
    },
    {
      id: "memory",
      label: "共同经历已沉淀",
      done: props.memoryState.sharedMoments.length > 0 || props.memoryState.interactionSummaries.length > 0,
      actionLabel: "去记忆",
      onAction: props.onGoMemory
    },
    {
      id: "device",
      label: "设备桥接输出已生成",
      done: Boolean(props.deviceState.lastOutput),
      actionLabel: "去设备",
      onAction: props.onGoDevice
    },
    {
      id: "waitlist",
      label: "候补留资已提交",
      done: props.userProfile.surveySubmissions.length > 0,
      actionLabel: "去候补",
      onAction: props.onGoValidation
    }
  ];
}

export function CompanionLoopStatusCard(props: CompanionLoopStatusCardProps) {
  const checkpoints = resolveCheckpoints(props);
  const doneCount = checkpoints.filter((item) => item.done).length;
  const progress = Math.round((doneCount / checkpoints.length) * 100);
  const nextPending = checkpoints.find((item) => !item.done) ?? null;

  return (
    <section className="companion-loop-card" aria-label="小羊卷软件闭环状态">
      <div className="companion-loop-head">
        <p className="kicker">数字生命体闭环状态</p>
        <b>
          今日闭环进度 {doneCount}/{checkpoints.length}
        </b>
        <small>从抽色、互动、成长、记忆到桥接和候补，所有状态写入同一主状态树。</small>
      </div>

      <div className="companion-loop-progress">
        <i style={{ width: `${progress}%` }} />
      </div>

      <ul className="companion-loop-list">
        {checkpoints.map((item) => (
          <li key={item.id} className={item.done ? "done" : "pending"}>
            <span>{item.label}</span>
            {item.done ? (
              <b>已完成</b>
            ) : (
              <button type="button" onClick={item.onAction}>
                {item.actionLabel}
              </button>
            )}
          </li>
        ))}
      </ul>

      {nextPending ? (
        <p className="companion-loop-next">
          下一步建议：<b>{nextPending.label}</b>
        </p>
      ) : (
        <p className="companion-loop-next">
          今日闭环已跑通，可直接进入录制模式进行对外演示。
        </p>
      )}
    </section>
  );
}
