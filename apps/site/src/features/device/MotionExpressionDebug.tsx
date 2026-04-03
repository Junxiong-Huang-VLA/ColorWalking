import type { DeviceOutputState } from "@colorwalking/shared";
import { useMemo, useState } from "react";
import { softenColor } from "../../utils/color";

type MotionExpressionDebugProps = {
  output: DeviceOutputState | null;
  dailyColorHex: string;
  deviceConnected: boolean;
  eyeSoftness: number;
  onEyeSoftnessChange: (value: number) => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function MotionExpressionDebug({
  output,
  dailyColorHex,
  deviceConnected,
  eyeSoftness,
  onEyeSoftnessChange
}: MotionExpressionDebugProps) {
  const [input, setInput] = useState(eyeSoftness.toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parsedValue = useMemo(() => {
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : null;
  }, [input]);

  const previewEyeHex = softenColor(dailyColorHex, clamp(parsedValue ?? eyeSoftness, 0.2, 0.8));

  const submit = () => {
    setSuccess(null);
    const parsed = Number(input);
    if (!Number.isFinite(parsed)) {
      setError("请输入 0.20 到 0.80 的数字。");
      return;
    }
    if (parsed < 0.2 || parsed > 0.8) {
      setError("柔化系数超出范围，请保持在 0.20 - 0.80。");
      return;
    }
    if (!deviceConnected) {
      setError("设备未连接，暂时无法下发颜色校准。");
      return;
    }
    setError(null);
    onEyeSoftnessChange(parsed);
    setSuccess("校准已提交，等待设备同步。");
  };

  return (
    <article className="card calibration-card">
      <h2>颜色校准</h2>
      <p className="muted">围巾跟随今日幸运色，眼睛使用柔化后的颜色。</p>

      <div className="calibration-preview">
        <div>
          <small>围巾（幸运色）</small>
          <span style={{ backgroundColor: dailyColorHex }} />
          <b>{dailyColorHex}</b>
        </div>
        <div>
          <small>眼睛（柔化后）</small>
          <span style={{ backgroundColor: previewEyeHex }} />
          <b>{previewEyeHex}</b>
        </div>
      </div>

      <div className="calibration-form">
        <label>
          <span>眼睛柔化系数 (0.20 - 0.80)</span>
          <input
            value={input}
            inputMode="decimal"
            placeholder="0.45"
            onChange={(event) => {
              setInput(event.target.value);
              if (error) setError(null);
            }}
          />
        </label>

        <label className="range-row">
          <span>拖动微调：{(parsedValue ?? eyeSoftness).toFixed(2)}</span>
          <input
            type="range"
            min={0.2}
            max={0.8}
            step={0.01}
            value={clamp(parsedValue ?? eyeSoftness, 0.2, 0.8)}
            onChange={(event) => setInput(Number(event.target.value).toFixed(2))}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}
        {success ? <p className="form-success">{success}</p> : null}

        <button type="button" className="primary-btn" onClick={submit}>
          提交校准
        </button>
      </div>

      <h3>表情与动作输出</h3>
      <pre className="json-box">{JSON.stringify(output, null, 2)}</pre>
    </article>
  );
}
