import { DEVICE_INPUT_EVENT_TYPES, type DeviceInputEventType } from "@colorwalking/shared";
import { useMemo, useState } from "react";
import type { DeviceState } from "../../state/types";

type SensorTestPanelProps = {
  deviceState: DeviceState;
  onTest: (sensor: DeviceInputEventType) => void;
};

type SensorTestErrors = {
  sensor?: string;
  intensity?: string;
  submit?: string;
};

const SENSOR_LABELS: Record<DeviceInputEventType, string> = {
  touch_head: "摸头",
  touch_body: "轻触身体",
  hug_pressure: "抱抱压力",
  proximity_near: "靠近感应",
  picked_up: "抱起感应",
  laid_down: "放下感应"
};

function isSensorType(value: string): value is DeviceInputEventType {
  return DEVICE_INPUT_EVENT_TYPES.includes(value as DeviceInputEventType);
}

function statusLabel(status: DeviceState["sensors"][DeviceInputEventType]): string {
  if (status === "ok") return "通过";
  if (status === "error") return "失败";
  return "未测";
}

export function SensorTestPanel({ deviceState, onTest }: SensorTestPanelProps) {
  const [selectedSensor, setSelectedSensor] = useState<string>("");
  const [intensity, setIntensity] = useState("50");
  const [errors, setErrors] = useState<SensorTestErrors>({});
  const [lastRequested, setLastRequested] = useState<DeviceInputEventType | null>(null);

  const lastResult = useMemo(() => {
    if (!lastRequested) return null;
    return deviceState.sensors[lastRequested];
  }, [deviceState.sensors, lastRequested]);

  const submit = () => {
    const nextErrors: SensorTestErrors = {};
    if (!isSensorType(selectedSensor)) {
      nextErrors.sensor = "请选择要测试的传感器。";
    }

    const parsedIntensity = Number(intensity);
    if (selectedSensor === "hug_pressure") {
      if (!Number.isFinite(parsedIntensity)) {
        nextErrors.intensity = "抱抱压力需要填写 1-100 的整数。";
      } else if (!Number.isInteger(parsedIntensity) || parsedIntensity < 1 || parsedIntensity > 100) {
        nextErrors.intensity = "抱抱压力范围应为 1-100。";
      }
    } else if (intensity.trim()) {
      if (!Number.isFinite(parsedIntensity) || parsedIntensity < 0 || parsedIntensity > 100) {
        nextErrors.intensity = "强度范围应为 0-100。";
      }
    }

    if (!deviceState.connected) {
      nextErrors.submit = "设备未连接，无法执行传感器测试。";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const sensor = selectedSensor as DeviceInputEventType;
    setErrors({});
    setLastRequested(sensor);
    onTest(sensor);
  };

  return (
    <article className="card sensor-test-card">
      <h2>传感器测试</h2>
      <p className="muted">先连接设备，再按传感器逐项测试。</p>

      <div className="sensor-form">
        <label>
          <span>传感器类型</span>
          <select
            value={selectedSensor}
            onChange={(event) => {
              setSelectedSensor(event.target.value);
              if (errors.sensor) setErrors((prev) => ({ ...prev, sensor: undefined }));
            }}
          >
            <option value="">请选择</option>
            {DEVICE_INPUT_EVENT_TYPES.map((sensor) => (
              <option key={sensor} value={sensor}>
                {SENSOR_LABELS[sensor]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>触发强度（抱抱必填）</span>
          <input
            value={intensity}
            inputMode="numeric"
            placeholder="1 - 100"
            onChange={(event) => {
              setIntensity(event.target.value);
              if (errors.intensity) setErrors((prev) => ({ ...prev, intensity: undefined }));
            }}
          />
        </label>

        {errors.sensor ? <p className="form-error">{errors.sensor}</p> : null}
        {errors.intensity ? <p className="form-error">{errors.intensity}</p> : null}
        {errors.submit ? <p className="form-error">{errors.submit}</p> : null}

        <button type="button" className="primary-btn" onClick={submit}>
          执行测试
        </button>

        {lastRequested ? (
          <p className={lastResult === "error" ? "form-error" : "form-success"}>
            最近测试：{SENSOR_LABELS[lastRequested]} · {statusLabel(lastResult ?? "unknown")}
          </p>
        ) : null}
      </div>

      <ul className="event-list sensor-status-list">
        {DEVICE_INPUT_EVENT_TYPES.map((sensor) => (
          <li key={`status-${sensor}`} className={`sensor-status-${deviceState.sensors[sensor]}`}>
            <span>{SENSOR_LABELS[sensor]}</span>
            <small>{statusLabel(deviceState.sensors[sensor])}</small>
          </li>
        ))}
      </ul>
    </article>
  );
}
