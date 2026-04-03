import { useState } from "react";
import type { ChatMessage } from "../../state/types";
import { formatClock } from "../../utils/time";

type ChatPanelProps = {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  scene: "chat" | "comfort" | "bedtime" | "mood" | "color";
  sceneGuide: string;
  maxReplyLength: number;
  compact?: boolean;
};

function scenePlaceholder(scene: ChatPanelProps["scene"]): string {
  if (scene === "comfort") return "比如：今天有点累，想被你安慰一下。";
  if (scene === "bedtime") return "比如：晚安，我们慢慢安静下来。";
  if (scene === "mood") return "比如：我现在有点低落，想和你待一会。";
  if (scene === "color") return "比如：今天这份幸运色让我想到海边。";
  return "比如：今天过得怎么样？";
}

export function ChatPanel({ messages, onSend, scene, sceneGuide, maxReplyLength, compact = false }: ChatPanelProps) {
  const [input, setInput] = useState("");

  const send = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  return (
    <article className="card chat-panel" data-testid="interaction-chat-panel">
      <h3>和小羊卷说句话</h3>
      {compact ? null : <p className="muted">{sceneGuide}</p>}
      <div className="chat-list">
        {messages.slice(-14).map((item) => (
          <div key={item.id} className={item.role === "sheep" ? "chat-item sheep" : "chat-item user"}>
            <b>{item.role === "sheep" ? "小羊卷" : "你"}</b>
            <p>{item.text}</p>
            <small>{formatClock(item.at)}</small>
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          placeholder={scenePlaceholder(scene)}
          data-testid="interaction-chat-input"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              send();
            }
          }}
        />
        <button type="button" className="primary-btn" onClick={send} data-testid="interaction-chat-send">
          发送
        </button>
      </div>
      {compact ? null : (
        <p className="muted" style={{ marginTop: 8 }}>
          当前场景会控制回复气质，回复长度约不超过 {maxReplyLength} 字。
        </p>
      )}
    </article>
  );
}
