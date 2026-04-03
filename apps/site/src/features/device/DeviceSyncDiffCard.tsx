import type { DeviceOutputState } from "@colorwalking/shared";
import type { DeviceState } from "../../state/types";

type DeviceSyncDiffCardProps = {
  currentOutput: DeviceOutputState;
  lastSuccessfulSync: DeviceState["lastSuccessfulSync"];
};

type DiffKey =
  | "emotion"
  | "emotion_level"
  | "eye_state"
  | "eye_color_hex"
  | "scarf_color_hex"
  | "motion_template"
  | "voice_style";

const FIELD_LABEL: Record<DiffKey, string> = {
  emotion: "情绪",
  emotion_level: "情绪强度",
  eye_state: "眼睛状态",
  eye_color_hex: "眼睛颜色",
  scarf_color_hex: "围巾颜色",
  motion_template: "动作模板",
  voice_style: "语音风格"
};

function normalizedValue(output: DeviceOutputState, key: DiffKey): string {
  if (key === "scarf_color_hex") return output.scarf_color_hex ?? output.scarf_color ?? "--";
  const value = output[key];
  if (typeof value === "number") return String(value);
  return value ?? "--";
}

export function DeviceSyncDiffCard({ currentOutput, lastSuccessfulSync }: DeviceSyncDiffCardProps) {
  const keys: DiffKey[] = [
    "emotion",
    "emotion_level",
    "eye_state",
    "eye_color_hex",
    "scarf_color_hex",
    "motion_template",
    "voice_style"
  ];

  return (
    <article className="card device-sync-diff-card">
      <h2>同步快照差异</h2>
      <p className="muted">当前状态 vs 最近成功同步，便于快速定位未下发变化。</p>
      {lastSuccessfulSync ? (
        <>
          <p className="muted">
            最近成功时间：
            {new Date(lastSuccessfulSync.at).toLocaleString("zh-CN", { hour12: false })}
          </p>
          <div className="diff-table">
            {keys.map((key) => {
              const current = normalizedValue(currentOutput, key);
              const previous = normalizedValue(lastSuccessfulSync.output, key);
              const changed = current !== previous;
              return (
                <div key={key} className={`diff-row${changed ? " changed" : ""}`}>
                  <b>{FIELD_LABEL[key]}</b>
                  <span>{previous}</span>
                  <i>→</i>
                  <span>{current}</span>
                  <small>{changed ? "已变化" : "一致"}</small>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="muted">还没有成功同步记录，先连接设备并完成一次同步。</p>
      )}
    </article>
  );
}

