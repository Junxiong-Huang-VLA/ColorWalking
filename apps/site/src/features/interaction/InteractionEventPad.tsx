import type { DeviceInputEventType } from "@colorwalking/shared";

const EVENT_ITEMS: Array<{ key: DeviceInputEventType; label: string }> = [
  { key: "touch_head", label: "摸头" },
  { key: "hug_pressure", label: "抱抱" },
  { key: "proximity_near", label: "靠近" },
  { key: "laid_down", label: "休息" },
  { key: "touch_body", label: "轻触" },
  { key: "picked_up", label: "抱起" }
];

type InteractionEventPadProps = {
  onTrigger: (eventType: DeviceInputEventType) => void;
};

export function InteractionEventPad({ onTrigger }: InteractionEventPadProps) {
  return (
    <article className="card interaction-event-pad" data-testid="interaction-event-pad">
      <h3>轻互动</h3>
      <p className="muted">点一下，小羊卷就会有回应。</p>
      <div className="quick-actions six">
        {EVENT_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onTrigger(item.key)}
            data-testid={`interaction-event-${item.key}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </article>
  );
}
