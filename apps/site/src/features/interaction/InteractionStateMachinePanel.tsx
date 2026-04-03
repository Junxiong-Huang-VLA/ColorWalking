import { COMPANION_EVENT_LABEL } from "../../domain/companionEvents";
import { getEmotionMapConfig } from "../../lib";
import type { CompanionEventType, SheepEmotionState, SheepVisualState } from "../../state/types";
import { formatClock } from "../../utils/time";
import { emotionLabel, expressionLabel, eyeStateLabel, motionLabel } from "../sheep/stateLabels";

const EVENT_ORDER: CompanionEventType[] = [
  "daily_color_drawn",
  "touch_head",
  "touch_body",
  "hug_pressure",
  "proximity_near",
  "picked_up",
  "laid_down",
  "chat_started",
  "bedtime_mode_started"
];

const EVENT_RULES = getEmotionMapConfig().eventOffsets;

type InteractionStateMachinePanelProps = {
  sheepEmotionState: SheepEmotionState;
  sheepVisualState: SheepVisualState;
  lastEventType: CompanionEventType | null;
  lastEventAt: string | null;
};

function toShortEventTag(eventType: CompanionEventType): string {
  if (eventType === "chat_started") return "chat";
  if (eventType === "bedtime_mode_started") return "bedtime";
  return eventType;
}

export function InteractionStateMachinePanel({
  sheepEmotionState,
  sheepVisualState,
  lastEventType,
  lastEventAt
}: InteractionStateMachinePanelProps) {
  return (
    <article className="card state-machine-card">
      <div className="state-machine-head">
        <h3>反馈状态机</h3>
        <small>{lastEventType ? `${COMPANION_EVENT_LABEL[lastEventType]} · ${lastEventAt ? formatClock(lastEventAt) : "--:--"}` : "等待互动"}</small>
      </div>

      <div className="state-chip-row">
        <span>情绪：{emotionLabel(sheepEmotionState.emotion)}</span>
        <span>强度：{Math.round(sheepEmotionState.emotionLevel)}</span>
        <span>眼睛：{eyeStateLabel(sheepVisualState.eyeState)}</span>
        <span>表情：{expressionLabel(sheepVisualState.expression)}</span>
        <span>动作：{motionLabel(sheepVisualState.motionTemplate)}</span>
      </div>

      <div className="state-machine-rows">
        {EVENT_ORDER.map((eventType) => {
          const rule = EVENT_RULES[eventType];
          if (!rule) return null;
          const active = eventType === lastEventType;
          return (
            <div key={eventType} className={`state-machine-row${active ? " active" : ""}`}>
              <div className="machine-event">
                <b>{COMPANION_EVENT_LABEL[eventType]}</b>
                <small>{toShortEventTag(eventType)}</small>
              </div>
              <div className="machine-arrow" aria-hidden>
                →
              </div>
              <div className="machine-next">
                <span>{emotionLabel(rule.targetEmotion)}</span>
                <span>强度 {rule.levelDelta > 0 ? "+" : ""}{rule.levelDelta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
