import type { BuiltinBridgeTransport } from "../../services/device/HardwareBridgeRuntime";
import type { DeviceBridgeDiagnostics } from "../../services/device/MockDeviceBridge";

type BridgeDiagnosticsCardProps = {
  diagnostics: DeviceBridgeDiagnostics;
};

function formatHeartbeat(iso: string | null): string {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      hour12: false,
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return iso;
  }
}

function transportLabel(transport: BuiltinBridgeTransport): string {
  if (transport === "auto") return "自动选择（auto）";
  if (transport === "mock") return "Mock 通道";
  if (transport === "runtime") return "外部 Runtime 注入";
  if (transport === "api") return "HTTP API 桥接";
  if (transport === "serial") return "Web Serial（串口）";
  return "Web Bluetooth（蓝牙）";
}

function handshakeLabel(status: DeviceBridgeDiagnostics["handshake"]["status"]): string {
  if (status === "ready") return "握手就绪";
  if (status === "stale") return "心跳超时";
  if (status === "error") return "握手异常";
  return "等待连接";
}

export function BridgeDiagnosticsCard({ diagnostics }: BridgeDiagnosticsCardProps) {
  const selectedTransport = transportLabel(diagnostics.selectedTransport);
  const availableTransports = diagnostics.availableTransports.length
    ? diagnostics.availableTransports.map((item) => transportLabel(item)).join(" / ")
    : "--";
  const capabilities = diagnostics.handshake.capabilities.length ? diagnostics.handshake.capabilities.join(" / ") : "--";

  return (
    <article className="card bridge-diagnostics-card">
      <h2>桥接诊断</h2>
      <p className="muted">用于确认设备桥接通道、握手状态与能力协商结果。</p>
      <div className="device-meta">
        <p>
          桥接模式：
          <b className={`bridge-mode-${diagnostics.mode}`}>{diagnostics.mode}</b>
        </p>
        <p>运行时 ID：{diagnostics.runtimeId}</p>
        <p>当前通道：{selectedTransport}</p>
        <p>可用通道：{availableTransports}</p>
        <p>说明：{diagnostics.hint}</p>
      </div>
      <div className="device-meta">
        <p>握手状态：{handshakeLabel(diagnostics.handshake.status)}</p>
        <p>协议版本：{diagnostics.handshake.protocolVersion}</p>
        <p>能力集：{capabilities}</p>
        <p>最后心跳：{formatHeartbeat(diagnostics.handshake.lastHeartbeatAt)}</p>
        {diagnostics.unsupportedOutputs.length ? (
          <p>降级输出：{diagnostics.unsupportedOutputs.join(" / ")}</p>
        ) : (
          <p>降级输出：无</p>
        )}
      </div>
    </article>
  );
}
