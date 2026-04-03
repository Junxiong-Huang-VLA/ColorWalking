import { createMockDeviceAdapter, type DeviceInputEventType, type DeviceOutputState } from "@colorwalking/shared";
import type { DeviceBridge, DeviceMeta } from "./DeviceBridge";
import {
  availableBridgeTransports,
  type BuiltinBridgeTransport,
  type HardwareDeviceBridgeRuntime,
  resolveBridgeRuntime
} from "./HardwareBridgeRuntime";

type SensorTestStatus = "ok" | "error";
export type DeviceBridgeMode = "hardware" | "mock";
type DeviceBridgeHandshakeStatus = "ready" | "waiting" | "stale" | "error";

interface DeviceBridgeHandshakeSnapshot {
  status: DeviceBridgeHandshakeStatus;
  protocolVersion: string;
  capabilities: string[];
  lastHeartbeatAt: string | null;
}

export interface DeviceBridgeDiagnostics {
  mode: DeviceBridgeMode;
  runtimeId: string;
  hint: string;
  unsupportedOutputs: string[];
  selectedTransport: BuiltinBridgeTransport;
  availableTransports: BuiltinBridgeTransport[];
  handshake: DeviceBridgeHandshakeSnapshot;
}

declare global {
  interface Window {
    __XIAO_YANG_JUAN_DEVICE_BRIDGE__?: HardwareDeviceBridgeRuntime;
  }
}

const DEVICE_TRANSPORT_STORAGE_KEY = "xiao-yang-juan.device.transport";

function loadStoredTransport(): BuiltinBridgeTransport {
  if (typeof window === "undefined") return "auto";
  const value = window.localStorage.getItem(DEVICE_TRANSPORT_STORAGE_KEY);
  if (
    value === "mock" ||
    value === "runtime" ||
    value === "serial" ||
    value === "bluetooth" ||
    value === "api" ||
    value === "auto"
  ) {
    return value;
  }
  return "auto";
}

function persistTransport(value: BuiltinBridgeTransport): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEVICE_TRANSPORT_STORAGE_KEY, value);
  } catch {
    // ignore storage failure in private mode
  }
}

function hasCapability(capabilities: string[], key: string): boolean {
  return capabilities.includes(key);
}

function isMockRuntime(runtimeId: string): boolean {
  return runtimeId.startsWith("mock");
}

function fallbackMockRuntime(): HardwareDeviceBridgeRuntime {
  const mock = createMockDeviceAdapter();
  return {
    id: mock.id,
    sendOutput: async (output) => {
      await mock.sendState(output);
    },
    testSensor: async () => "ok",
    protocolVersion: "mock-bridge/1.0.0",
    capabilities: [
      "input.touch_head",
      "input.touch_body",
      "input.hug_pressure",
      "input.proximity_near",
      "input.picked_up",
      "input.laid_down",
      "output.emotion",
      "output.eye_state",
      "output.scarf_color",
      "output.motion_template",
      "output.voice_style"
    ],
    getProtocolVersion: () => "mock-bridge/1.0.0",
    getCapabilities: () => [
      "input.touch_head",
      "input.touch_body",
      "input.hug_pressure",
      "input.proximity_near",
      "input.picked_up",
      "input.laid_down",
      "output.emotion",
      "output.eye_state",
      "output.scarf_color",
      "output.motion_template",
      "output.voice_style"
    ]
  };
}

export class MockDeviceBridge implements DeviceBridge {
  private connected = false;
  private battery = 86;
  private firmware = "0.1.0-mock";
  private deviceId: string | null = null;
  private lastHeartbeatAt: string | null = null;
  private lastHandshakeError: string | null = null;

  private mode: DeviceBridgeMode = "mock";
  private hint = "未初始化设备桥接。";
  private runtime: HardwareDeviceBridgeRuntime = fallbackMockRuntime();
  private selectedTransport: BuiltinBridgeTransport = loadStoredTransport();
  private availableTransports: BuiltinBridgeTransport[] = ["auto", "mock", "runtime", "api"];

  private resolveExternalRuntime(): HardwareDeviceBridgeRuntime | null {
    if (typeof window === "undefined") return null;
    const candidate = window.__XIAO_YANG_JUAN_DEVICE_BRIDGE__;
    if (!candidate || typeof candidate !== "object") return null;
    if (typeof candidate.id !== "string" || typeof candidate.sendOutput !== "function") return null;
    return candidate;
  }

  private async ensureRuntime(refresh = false): Promise<void> {
    if (!refresh && this.runtime) {
      this.availableTransports = availableBridgeTransports();
      return;
    }

    this.availableTransports = availableBridgeTransports();
    const externalRuntime = this.resolveExternalRuntime();

    try {
      const resolved = await resolveBridgeRuntime({
        transport: this.selectedTransport,
        externalRuntime
      });
      this.mode = resolved.mode;
      this.runtime = resolved.runtime;
      this.hint = resolved.hint;
      this.selectedTransport = resolved.selectedTransport;
      if (isMockRuntime(resolved.runtime.id)) {
        this.firmware = "0.1.0-mock";
      }
    } catch (error: unknown) {
      this.mode = "mock";
      this.runtime = fallbackMockRuntime();
      this.hint = error instanceof Error ? `${error.message} 已回退到 mock。` : "桥接异常，已回退到 mock。";
      this.selectedTransport = "mock";
      this.lastHandshakeError = error instanceof Error ? error.message : "桥接初始化失败";
    }

    persistTransport(this.selectedTransport);
  }

  setTransport(transport: BuiltinBridgeTransport): void {
    this.selectedTransport = transport;
    persistTransport(transport);
    this.availableTransports = availableBridgeTransports();
    this.hint = `桥接通道已切换为 ${transport}，请重新连接设备。`;
    if (transport === "mock") {
      this.mode = "mock";
      this.runtime = fallbackMockRuntime();
    }
    if (!this.connected) {
      this.lastHandshakeError = null;
      this.lastHeartbeatAt = null;
    }
    if (this.connected) {
      this.connected = false;
      this.deviceId = null;
      this.lastHeartbeatAt = null;
      this.lastHandshakeError = "桥接通道已切换，请重新连接设备";
    }
  }

  private touchHeartbeat(): void {
    this.lastHeartbeatAt = new Date().toISOString();
  }

  private resolveProtocolVersion(): string {
    return this.runtime.getProtocolVersion?.() ?? this.runtime.protocolVersion ?? (this.mode === "hardware" ? "hardware-bridge/1.0.0" : "mock-bridge/1.0.0");
  }

  private resolveCapabilities(): string[] {
    const values = this.runtime.getCapabilities?.() ?? this.runtime.capabilities;
    if (values?.length) return values;
    return this.mode === "hardware"
      ? ["handshake.basic", "sensor.stream", "state.sync"]
      : [
          "input.touch_head",
          "input.touch_body",
          "input.hug_pressure",
          "input.proximity_near",
          "input.picked_up",
          "input.laid_down",
          "output.emotion",
          "output.eye_state",
          "output.scarf_color",
          "output.motion_template",
          "output.voice_style"
        ];
  }

  private supportsSensor(sensor: DeviceInputEventType): boolean {
    const caps = this.resolveCapabilities();
    return hasCapability(caps, `input.${sensor}`) || hasCapability(caps, "sensor.stream");
  }

  private normalizeOutput(output: DeviceOutputState): DeviceOutputState {
    const caps = this.resolveCapabilities();
    const next: DeviceOutputState = { ...output };

    if (!hasCapability(caps, "output.emotion")) {
      next.emotion = "soft";
      next.emotion_level = 55;
    }

    if (!hasCapability(caps, "output.eye_state")) {
      next.eye_state = "half_closed";
    }

    if (!hasCapability(caps, "output.eye_color") && !hasCapability(caps, "output.eye_color_hex")) {
      next.eye_color_hex = "#C9DBEE";
    }

    if (!hasCapability(caps, "output.scarf_color") && !hasCapability(caps, "output.scarf_light")) {
      const fallback = output.scarf_color_hex ?? output.scarf_color ?? "#F5C7A8";
      next.scarf_color = fallback;
      next.scarf_color_hex = fallback;
    }

    if (!hasCapability(caps, "output.motion_template")) {
      next.motion_template = "idle_breathe";
    }

    if (!hasCapability(caps, "output.voice_style")) {
      next.voice_style = "soft";
    }

    return next;
  }

  private resolveUnsupportedOutputs(): string[] {
    const caps = this.resolveCapabilities();
    const missing: string[] = [];
    if (!hasCapability(caps, "output.emotion")) missing.push("emotion");
    if (!hasCapability(caps, "output.eye_state")) missing.push("eye_state");
    if (!hasCapability(caps, "output.scarf_color") && !hasCapability(caps, "output.scarf_light")) missing.push("scarf_color");
    if (!hasCapability(caps, "output.motion_template")) missing.push("motion_template");
    if (!hasCapability(caps, "output.voice_style")) missing.push("voice_style");
    return missing;
  }

  private resolveHandshakeStatus(): DeviceBridgeHandshakeStatus {
    if (this.lastHandshakeError) return "error";
    if (!this.connected) return "waiting";
    const lastHeartbeatAt = this.runtime.getLastHeartbeatAt?.() ?? this.lastHeartbeatAt;
    if (!lastHeartbeatAt) return "waiting";
    const delta = Date.now() - new Date(lastHeartbeatAt).getTime();
    if (Number.isFinite(delta) && delta > 90_000) return "stale";
    return "ready";
  }

  async connect(): Promise<DeviceMeta> {
    await this.ensureRuntime(true);
    try {
      const meta = (await this.runtime.connect?.()) ?? this.runtime.getMeta?.() ?? {};
      this.connected = true;
      this.deviceId = this.runtime.id;
      this.lastHandshakeError = null;
      this.touchHeartbeat();
      this.battery = typeof meta.battery === "number" ? meta.battery : this.battery;
      this.firmware = typeof meta.firmware === "string" ? meta.firmware : this.mode === "hardware" ? "hardware-bridge" : this.firmware;
      return this.getMeta();
    } catch (error: unknown) {
      this.connected = false;
      this.deviceId = null;
      this.lastHandshakeError = error instanceof Error ? error.message : "握手失败";
      throw error;
    }
  }

  async disconnect(): Promise<DeviceMeta> {
    await this.runtime.disconnect?.();
    this.connected = false;
    this.deviceId = null;
    this.lastHeartbeatAt = null;
    this.lastHandshakeError = null;
    return this.getMeta();
  }

  getMeta(): DeviceMeta {
    return {
      connected: this.connected,
      deviceId: this.connected ? this.deviceId ?? this.runtime.id : null,
      battery: this.connected ? this.battery : null,
      firmware: this.connected ? this.firmware : null
    };
  }

  async sendOutput(output: DeviceOutputState): Promise<void> {
    if (!this.connected) return;
    const normalized = this.normalizeOutput(output);
    await this.runtime.sendOutput(normalized);
    this.touchHeartbeat();
    this.lastHandshakeError = null;
    if (this.mode === "mock") {
      this.battery = Math.max(5, this.battery - 0.02);
    }
  }

  async testSensor(sensor: DeviceInputEventType): Promise<SensorTestStatus> {
    if (!this.connected) return "error";
    if (!this.supportsSensor(sensor)) return "error";
    if (this.runtime.testSensor) {
      const result = await this.runtime.testSensor(sensor);
      this.touchHeartbeat();
      this.lastHandshakeError = null;
      return result;
    }
    this.touchHeartbeat();
    return "ok";
  }

  getDiagnostics(): DeviceBridgeDiagnostics {
    const lastHeartbeatAt = this.runtime.getLastHeartbeatAt?.() ?? this.lastHeartbeatAt;
    return {
      mode: this.mode,
      runtimeId: this.runtime.id,
      hint: this.hint,
      unsupportedOutputs: this.resolveUnsupportedOutputs(),
      selectedTransport: this.selectedTransport,
      availableTransports: this.availableTransports,
      handshake: {
        status: this.resolveHandshakeStatus(),
        protocolVersion: this.resolveProtocolVersion(),
        capabilities: this.resolveCapabilities(),
        lastHeartbeatAt
      }
    };
  }
}
