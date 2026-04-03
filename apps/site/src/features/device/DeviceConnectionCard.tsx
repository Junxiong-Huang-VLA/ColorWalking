import { useEffect, useState } from "react";
import type { ApiBridgeConfig, BuiltinBridgeTransport } from "../../services/device/HardwareBridgeRuntime";
import { loadApiBridgeConfig, saveApiBridgeConfig } from "../../services/device/HardwareBridgeRuntime";
import type { DeviceState } from "../../state/types";

type DeviceConnectionCardProps = {
  deviceState: DeviceState;
  selectedTransport: BuiltinBridgeTransport;
  availableTransports: BuiltinBridgeTransport[];
  onTransportChange: (transport: BuiltinBridgeTransport) => void;
  onToggleConnection: (nextConnected: boolean) => void;
  onSyncModeChange: (mode: DeviceState["syncMode"]) => void;
  onRetrySync: () => void;
  onClearPendingCommands: () => void;
};

function transportLabel(transport: BuiltinBridgeTransport): string {
  if (transport === "auto") return "自动选择（auto）";
  if (transport === "mock") return "Mock 通道";
  if (transport === "runtime") return "外部 Runtime 注入";
  if (transport === "api") return "HTTP API 桥接";
  if (transport === "serial") return "Web Serial（串口）";
  return "Web Bluetooth（蓝牙）";
}

export function DeviceConnectionCard({
  deviceState,
  selectedTransport,
  availableTransports,
  onTransportChange,
  onToggleConnection,
  onSyncModeChange,
  onRetrySync,
  onClearPendingCommands
}: DeviceConnectionCardProps) {
  const [apiConfig, setApiConfig] = useState<ApiBridgeConfig>(() => loadApiBridgeConfig());
  const [apiSavedAt, setApiSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTransport !== "api") return;
    setApiConfig(loadApiBridgeConfig());
  }, [selectedTransport]);

  const hasPendingCommands = deviceState.pendingCommands.length > 0;
  const canRetrySync = deviceState.connected && hasPendingCommands && deviceState.syncState === "error";
  const lastSyncAgeSec = deviceState.lastSuccessfulSync?.at
    ? Math.floor((Date.now() - new Date(deviceState.lastSuccessfulSync.at).getTime()) / 1000)
    : null;
  const hasSnapshotWarning = deviceState.connected && deviceState.syncState === "ok" && !deviceState.lastSuccessfulSync;
  const heartbeatWarning = deviceState.connected && lastSyncAgeSec !== null && lastSyncAgeSec > 180;

  return (
    <article className="card">
      <h2>硬件连接</h2>
      <p className="muted">连接后可同步围巾与眼睛颜色，并验证真实设备桥接链路。</p>
      <div className="device-meta">
        <p>连接：{deviceState.connected ? "已连接" : "未连接"}</p>
        <p>设备 ID：{deviceState.deviceId ?? "--"}</p>
        <p>电量：{deviceState.battery ?? "--"}</p>
        <p>固件：{deviceState.firmware ?? "--"}</p>
        <p>同步状态：{deviceState.syncState}</p>
        <p>同步模式：{deviceState.syncMode}</p>
        <p>待发送命令：{deviceState.pendingCommands.length}</p>
        {deviceState.lastSyncError ? <p>最近错误：{deviceState.lastSyncError}</p> : null}
        <p>
          最近成功同步：
          {deviceState.lastSuccessfulSync?.at
            ? new Date(deviceState.lastSuccessfulSync.at).toLocaleString("zh-CN", { hour12: false })
            : "--"}
        </p>
      </div>

      <label style={{ display: "grid", gap: 6, marginTop: 10, marginBottom: 10 }}>
        <span className="muted">桥接通道</span>
        <select
          value={selectedTransport}
          onChange={(event) => onTransportChange(event.target.value as BuiltinBridgeTransport)}
        >
          {availableTransports.map((transport) => (
            <option key={transport} value={transport}>
              {transportLabel(transport)}
            </option>
          ))}
        </select>
      </label>

      {selectedTransport === "api" ? (
        <div className="device-meta" style={{ marginTop: 8 }}>
          <p>API 桥接配置</p>
          <label style={{ display: "grid", gap: 6, marginTop: 6 }}>
            <span className="muted">API Base URL</span>
            <input
              type="text"
              value={apiConfig.baseUrl}
              onChange={(event) => setApiConfig((prev) => ({ ...prev, baseUrl: event.target.value }))}
              placeholder="https://your-api-host/device-bridge"
            />
          </label>
          <label style={{ display: "grid", gap: 6, marginTop: 8 }}>
            <span className="muted">Bearer Token（可选）</span>
            <input
              type="password"
              value={apiConfig.bearerToken ?? ""}
              onChange={(event) => setApiConfig((prev) => ({ ...prev, bearerToken: event.target.value }))}
              placeholder="留空表示不带 Authorization"
            />
          </label>
          <button
            type="button"
            style={{ marginTop: 8 }}
            onClick={() => {
              const next = saveApiBridgeConfig({
                baseUrl: apiConfig.baseUrl,
                bearerToken: apiConfig.bearerToken || null
              });
              setApiConfig(next);
              setApiSavedAt(new Date().toISOString());
            }}
          >
            保存 API 桥接配置
          </button>
          <p className="muted" style={{ marginTop: 6 }}>
            {apiSavedAt
              ? `最近保存：${new Date(apiSavedAt).toLocaleTimeString("zh-CN", { hour12: false })}`
              : "保存后重新连接设备生效。"}
          </p>
        </div>
      ) : null}

      <label style={{ display: "grid", gap: 6, marginTop: 10, marginBottom: 10 }}>
        <span className="muted">同步模式</span>
        <select
          value={deviceState.syncMode}
          onChange={(event) => onSyncModeChange(event.target.value as DeviceState["syncMode"])}
        >
          <option value="app_master">app_master（App 主脑）</option>
          <option value="device_follow">device_follow（设备跟随）</option>
        </select>
      </label>

      <button
        type="button"
        className="primary-btn"
        onClick={() => onToggleConnection(!deviceState.connected)}
      >
        {deviceState.connected ? "断开连接" : "连接设备"}
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
        <button type="button" onClick={onRetrySync} disabled={!canRetrySync}>
          重试同步
        </button>
        <button type="button" onClick={onClearPendingCommands} disabled={!hasPendingCommands}>
          清空待发送
        </button>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        {canRetrySync
          ? "同步失败后可重试。"
          : hasPendingCommands
            ? "当前有待发送命令。"
            : "当前无待发送命令。"}
      </p>
      <p className="muted" style={{ marginTop: 4 }}>
        切换桥接通道后，需要重新连接设备以重新握手。
      </p>
      {hasSnapshotWarning ? <p className="muted">设备在线，但还没有最近成功同步快照。</p> : null}
      {heartbeatWarning ? <p className="muted">最近同步已超过 3 分钟，可以轻轻重试一次。</p> : null}

      <div className="device-meta" style={{ marginTop: 8 }}>
        <p>最近设备事件</p>
        {deviceState.recentEventLogs.length ? (
          <ul className="event-list" style={{ marginTop: 4 }}>
            {deviceState.recentEventLogs.slice(0, 5).map((log) => (
              <li key={log.id}>
                <span>
                  [{log.level}] {log.message}
                </span>
                <small>{new Date(log.at).toLocaleTimeString("zh-CN", { hour12: false })}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">暂无事件。</p>
        )}
      </div>
    </article>
  );
}
