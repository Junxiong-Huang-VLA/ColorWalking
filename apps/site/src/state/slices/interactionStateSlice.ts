import type { InteractionState } from "../types";

export function createInitialInteractionState(nowIso: string): InteractionState {
  return {
    lastEventType: null,
    lastEventAt: null,
    activeScene: "chat",
    contextSnapshot: null,
    lastFeedback: null,
    messages: [
      {
        id: `chat-${Date.now()}`,
        role: "sheep",
        text: "这份颜色，送给今天的你。",
        at: nowIso,
        channel: "text"
      }
    ]
  };
}
