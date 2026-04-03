import type { DeviceInputEventType, DeviceOutputState } from "@colorwalking/shared";
import { BridgeDiagnosticsCard } from "../../features/device/BridgeDiagnosticsCard";
import { DeviceConnectionCard } from "../../features/device/DeviceConnectionCard";
import { HardwareBridgeGuideCard } from "../../features/device/HardwareBridgeGuideCard";
import { DeviceSyncDiffCard } from "../../features/device/DeviceSyncDiffCard";
import { MotionExpressionDebug } from "../../features/device/MotionExpressionDebug";
import { SensorTestPanel } from "../../features/device/SensorTestPanel";
import type { BuiltinBridgeTransport } from "../../services/device/HardwareBridgeRuntime";
import type { DeviceBridgeDiagnostics } from "../../services/device/MockDeviceBridge";
import type { DeviceState } from "../../state/types";

type DevicePageProps = {
  deviceState: DeviceState;
  bridgeDiagnostics: DeviceBridgeDiagnostics;
  dailyColorHex: string;
  dailyColorName: string;
  eyeSoftness: number;
  output: DeviceOutputState | null;
  currentOutput: DeviceOutputState;
  onTransportChange: (transport: BuiltinBridgeTransport) => void;
  onToggleConnection: (connected: boolean) => void;
  onSyncModeChange: (mode: DeviceState["syncMode"]) => void;
  onRetrySync: () => void;
  onClearPendingCommands: () => void;
  onSensorTest: (sensor: DeviceInputEventType) => void;
  onEyeSoftnessChange: (value: number) => void;
  onGoInteraction: () => void;
};

export function DevicePage(props: DevicePageProps) {
  return (
    <section className="page-grid">
      <article className="card demo-page-intro-card">
        <h2>设备桥接（真实联调）</h2>
        <p className="muted">
          设备页负责桥接通道、握手诊断与同步联调，不喧宾夺主。当前围绕“{props.dailyColorName}”校验输出映射。
        </p>
        <div className="state-chip-row">
          <span>角色主链路：互动 / 关系 / 记忆</span>
          <span>设备定位：桥接与验证</span>
          <span>状态：{props.deviceState.connected ? "在线" : "离线"}</span>
        </div>
        <button type="button" className="ghost-btn" onClick={props.onGoInteraction}>
          返回互动主体验
        </button>
      </article>

      <DeviceConnectionCard
        deviceState={props.deviceState}
        selectedTransport={props.bridgeDiagnostics.selectedTransport}
        availableTransports={props.bridgeDiagnostics.availableTransports}
        onTransportChange={props.onTransportChange}
        onToggleConnection={props.onToggleConnection}
        onSyncModeChange={props.onSyncModeChange}
        onRetrySync={props.onRetrySync}
        onClearPendingCommands={props.onClearPendingCommands}
      />
      <BridgeDiagnosticsCard diagnostics={props.bridgeDiagnostics} />
      <DeviceSyncDiffCard
        currentOutput={props.currentOutput}
        lastSuccessfulSync={props.deviceState.lastSuccessfulSync}
      />
      <HardwareBridgeGuideCard />
      <SensorTestPanel deviceState={props.deviceState} onTest={props.onSensorTest} />
      <MotionExpressionDebug
        output={props.output}
        dailyColorHex={props.dailyColorHex}
        deviceConnected={props.deviceState.connected}
        eyeSoftness={props.eyeSoftness}
        onEyeSoftnessChange={props.onEyeSoftnessChange}
      />
    </section>
  );
}
