import { sceneProfileOf } from "../../domain/interactionScenes";
import type { InteractionScene } from "../../state/types";

type SceneModeSwitchProps = {
  value: InteractionScene;
  onChange: (scene: InteractionScene) => void;
};

const MODE_ITEMS: Array<{ key: InteractionScene; label: string }> = [
  { key: "chat", label: "聊天" },
  { key: "comfort", label: "安抚" },
  { key: "bedtime", label: "睡前" },
  { key: "mood", label: "心情" },
  { key: "color", label: "幸运色" }
];

export function SceneModeSwitch({ value, onChange }: SceneModeSwitchProps) {
  return (
    <article className="card scene-mode-card">
      <h3>陪伴场景</h3>
      <p className="muted">{sceneProfileOf(value).guide}</p>
      <div className="scene-mode-list">
        {MODE_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`scene-mode-item${value === item.key ? " active" : ""}`}
            onClick={() => onChange(item.key)}
          >
            <b>{item.label}</b>
            <small>{sceneProfileOf(item.key).style}</small>
          </button>
        ))}
      </div>
    </article>
  );
}
