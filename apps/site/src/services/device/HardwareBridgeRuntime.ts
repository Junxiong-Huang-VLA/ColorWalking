import type { DeviceInputEventType, DeviceOutputState } from "@colorwalking/shared";
import type { DeviceMeta } from "./DeviceBridge";

export type BuiltinBridgeTransport = "mock" | "runtime" | "serial" | "bluetooth" | "api" | "auto";

export interface HardwareDeviceBridgeRuntime {
  id: string;
  connect?: () => Promise<Partial<DeviceMeta> | void>;
  disconnect?: () => Promise<void>;
  getMeta?: () => Partial<DeviceMeta>;
  sendOutput: (output: DeviceOutputState) => Promise<void>;
  testSensor?: (sensor: DeviceInputEventType) => Promise<"ok" | "error">;
  protocolVersion?: string;
  capabilities?: string[];
  getProtocolVersion?: () => string;
  getCapabilities?: () => string[];
  getLastHeartbeatAt?: () => string | null;
}

type RuntimeResolverOptions = {
  transport: BuiltinBridgeTransport;
  externalRuntime: HardwareDeviceBridgeRuntime | null;
};

const DEFAULT_SERIAL_BAUD_RATE = 115200;
const DEFAULT_BLUETOOTH_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const DEFAULT_BLUETOOTH_RX_CHAR_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
const DEFAULT_BLUETOOTH_TX_CHAR_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
const HANDSHAKE_TIMEOUT_MS = 2200;
const API_BRIDGE_BASE_STORAGE_KEY = "xiao-yang-juan.device.api_base";
const API_BRIDGE_TOKEN_STORAGE_KEY = "xiao-yang-juan.device.api_token";
const DEFAULT_API_BRIDGE_BASE = "/api/device-bridge";

export type ApiBridgeConfig = {
  baseUrl: string;
  bearerToken: string | null;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function normalizeIso(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function normalizeCapabilities(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function normalizeDeviceMeta(value: unknown): Partial<DeviceMeta> {
  if (!isObjectRecord(value)) return {};
  return {
    battery: typeof value.battery === "number" ? value.battery : null,
    firmware: typeof value.firmware === "string" ? value.firmware : null
  };
}

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeBaseUrl(value: string | null): string {
  if (!value) return DEFAULT_API_BRIDGE_BASE;
  return value.replace(/\/+$/, "");
}

export function loadApiBridgeConfig(): ApiBridgeConfig {
  if (typeof window === "undefined") {
    return {
      baseUrl: DEFAULT_API_BRIDGE_BASE,
      bearerToken: null
    };
  }
  const storedBase = normalizeNonEmptyString(window.localStorage.getItem(API_BRIDGE_BASE_STORAGE_KEY));
  const storedToken = normalizeNonEmptyString(window.localStorage.getItem(API_BRIDGE_TOKEN_STORAGE_KEY));
  return {
    baseUrl: normalizeBaseUrl(storedBase),
    bearerToken: storedToken
  };
}

export function saveApiBridgeConfig(config: ApiBridgeConfig): ApiBridgeConfig {
  const normalized = {
    baseUrl: normalizeBaseUrl(normalizeNonEmptyString(config.baseUrl)),
    bearerToken: normalizeNonEmptyString(config.bearerToken)
  };
  if (typeof window === "undefined") return normalized;
  try {
    window.localStorage.setItem(API_BRIDGE_BASE_STORAGE_KEY, normalized.baseUrl);
    if (normalized.bearerToken) {
      window.localStorage.setItem(API_BRIDGE_TOKEN_STORAGE_KEY, normalized.bearerToken);
    } else {
      window.localStorage.removeItem(API_BRIDGE_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage failures
  }
  return normalized;
}

type PendingRequest = {
  createdAt: number;
  resolve: (payload: Record<string, unknown>) => void;
  reject: (error: unknown) => void;
};

class JsonLineProtocolClient {
  private readonly pending = new Map<string, PendingRequest>();
  private readonly listeners = new Set<(payload: Record<string, unknown>) => void>();
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();
  private requestCounter = 0;
  private lastHeartbeatAt: string | null = null;

  constructor(private readonly sendRaw: (bytes: Uint8Array) => Promise<void>) {}

  getLastHeartbeatAt(): string | null {
    return this.lastHeartbeatAt;
  }

  onPayload(listener: (payload: Record<string, unknown>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async send(type: string, payload?: Record<string, unknown>, timeoutMs = HANDSHAKE_TIMEOUT_MS): Promise<Record<string, unknown>> {
    const requestId = `req_${Date.now()}_${this.requestCounter++}`;
    const message = {
      type,
      requestId,
      at: new Date().toISOString(),
      payload
    };

    const response = new Promise<Record<string, unknown>>((resolve, reject) => {
      this.pending.set(requestId, { createdAt: Date.now(), resolve, reject });
      globalThis.setTimeout(() => {
        const pending = this.pending.get(requestId);
        if (!pending) return;
        this.pending.delete(requestId);
        reject(new Error(`桥接请求超时: ${type}`));
      }, timeoutMs);
    });

    await this.sendRaw(this.encoder.encode(`${JSON.stringify(message)}\n`));
    return response;
  }

  async sendWithoutAck(type: string, payload?: Record<string, unknown>): Promise<void> {
    const message = {
      type,
      at: new Date().toISOString(),
      payload
    };
    await this.sendRaw(this.encoder.encode(`${JSON.stringify(message)}\n`));
  }

  ingestBytes(bytes: Uint8Array): void {
    if (!bytes.length) return;
    const text = this.decoder.decode(bytes, { stream: true });
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
      this.ingestLine(line);
    }
  }

  ingestLine(line: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      return;
    }
    if (!isObjectRecord(parsed)) return;

    const responseTo = typeof parsed.responseTo === "string" ? parsed.responseTo : null;
    if (responseTo) {
      const pending = this.pending.get(responseTo);
      if (pending) {
        this.pending.delete(responseTo);
        pending.resolve(parsed);
      }
    }

    this.lastHeartbeatAt = new Date().toISOString();
    this.listeners.forEach((listener) => listener(parsed));
  }

  dispose(): void {
    for (const pending of this.pending.values()) {
      pending.reject(new Error("桥接客户端已释放"));
    }
    this.pending.clear();
    this.listeners.clear();
  }
}

function toWirePayload(output: DeviceOutputState): Record<string, unknown> {
  return {
    emotion: output.emotion,
    emotionLevel: output.emotion_level ?? 0,
    eyeState: output.eye_state,
    eyeColorHex: output.eye_color_hex ?? null,
    scarfColorHex: output.scarf_color_hex ?? output.scarf_color,
    motionTemplate: output.motion_template,
    voiceStyle: output.voice_style,
    raw: output
  };
}

function toRuntimeCapabilities(base: string[], transport: "serial" | "bluetooth" | "api"): string[] {
  const defaults = [
    "handshake.basic",
    "state.sync",
    "output.emotion",
    "output.eye_state",
    "output.scarf_color",
    "output.motion_template",
    "output.voice_style"
  ];
  return Array.from(new Set([...defaults, ...base, `transport.${transport}`]));
}

async function createSerialRuntime(): Promise<HardwareDeviceBridgeRuntime> {
  const nav = navigator as Navigator & { serial?: { requestPort: () => Promise<unknown> } };
  if (!nav.serial?.requestPort) {
    throw new Error("当前浏览器不支持 Web Serial，请在 Chrome/Edge HTTPS 环境使用。");
  }

  let port: unknown = null;
  let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  let readerTask: Promise<void> | null = null;
  let protocolVersion = "web-serial-bridge/1.0.0";
  let capabilities = toRuntimeCapabilities([], "serial");
  let battery: number | null = null;
  let firmware: string | null = null;
  const encoder = new TextEncoder();
  let protocol: JsonLineProtocolClient | null = null;

  const startReaderLoop = (readable: ReadableStream<Uint8Array>) => {
    readerTask = (async () => {
      const reader = readable.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value || !protocol) continue;
          protocol.ingestBytes(value);
        }
      } finally {
        reader.releaseLock();
      }
    })();
  };

  const runtime: HardwareDeviceBridgeRuntime = {
    id: "serial-xiaoyangjuan-device",
    protocolVersion,
    capabilities,
    getProtocolVersion: () => protocolVersion,
    getCapabilities: () => capabilities,
    getLastHeartbeatAt: () => protocol?.getLastHeartbeatAt() ?? null,
    getMeta: () => ({ battery, firmware }),
    connect: async () => {
      port = await nav.serial!.requestPort();
      const serialPort = port as {
        open: (options: { baudRate: number }) => Promise<void>;
        close: () => Promise<void>;
        readable?: ReadableStream<Uint8Array>;
        writable?: WritableStream<Uint8Array>;
      };

      await serialPort.open({ baudRate: DEFAULT_SERIAL_BAUD_RATE });
      if (!serialPort.writable || !serialPort.readable) {
        throw new Error("串口不可读写，无法建立桥接。");
      }

      writer = serialPort.writable.getWriter();
      protocol = new JsonLineProtocolClient(async (bytes) => {
        if (!writer) return;
        await writer.write(bytes);
      });
      startReaderLoop(serialPort.readable);

      const handshakeFallback = {
        payload: {
          battery: null,
          firmware: "serial-unknown",
          capabilities: toRuntimeCapabilities([], "serial")
        }
      };

      const handshake = await protocol.send("handshake", {
        protocolVersion,
        transport: "serial",
        client: "site"
      }).catch(() => handshakeFallback as Record<string, unknown>);

      const handshakePayload = isObjectRecord(handshake.payload) ? handshake.payload : {};
      const meta = normalizeDeviceMeta(handshakePayload);
      battery = meta.battery ?? battery;
      firmware = meta.firmware ?? firmware ?? "serial-unknown";
      const serverVersion = typeof handshakePayload.protocolVersion === "string" ? handshakePayload.protocolVersion : null;
      protocolVersion = serverVersion ?? protocolVersion;
      capabilities = toRuntimeCapabilities(normalizeCapabilities(handshakePayload.capabilities), "serial");

      return {
        battery,
        firmware
      };
    },
    disconnect: async () => {
      const serialPort = port as {
        close?: () => Promise<void>;
      } | null;
      try {
        if (protocol) {
          await protocol.sendWithoutAck("disconnect", { reason: "app_request" }).catch(() => undefined);
        }
      } finally {
        protocol?.dispose();
        protocol = null;
      }
      if (writer) {
        await writer.close().catch(() => undefined);
        writer.releaseLock();
        writer = null;
      }
      await readerTask?.catch(() => undefined);
      readerTask = null;
      if (serialPort?.close) {
        await serialPort.close().catch(() => undefined);
      }
      port = null;
    },
    sendOutput: async (output) => {
      if (!protocol) throw new Error("串口桥接未连接");
      await protocol.send("state_sync", toWirePayload(output)).catch(async () => {
        await protocol?.sendWithoutAck("state_sync", toWirePayload(output));
      });
    },
    testSensor: async (sensor) => {
      if (!protocol) return "error";
      const response = await protocol.send("sensor_test", { sensor }).catch(() => null);
      if (!response) return "error";
      if (response.payload && isObjectRecord(response.payload)) {
        const status = response.payload.status;
        if (status === "ok" || status === "error") return status;
      }
      return "ok";
    }
  };

  return runtime;
}

async function createBluetoothRuntime(): Promise<HardwareDeviceBridgeRuntime> {
  const nav = navigator as Navigator & {
    bluetooth?: {
      requestDevice: (options: Record<string, unknown>) => Promise<unknown>;
    };
  };

  if (!nav.bluetooth?.requestDevice) {
    throw new Error("当前浏览器不支持 Web Bluetooth，请在 Chrome/Edge HTTPS 环境使用。");
  }

  let protocolVersion = "web-bluetooth-bridge/1.0.0";
  let capabilities = toRuntimeCapabilities([], "bluetooth");
  let battery: number | null = null;
  let firmware: string | null = null;
  let protocol: JsonLineProtocolClient | null = null;
  let gattServer: unknown = null;
  let txCharacteristic: unknown = null;
  let rxCharacteristic: unknown = null;
  let runtimeId = "bluetooth-xiaoyangjuan-device";

  const toBluetoothBufferSource = (bytes: Uint8Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return buffer;
  };

  const writeRaw = async (bytes: Uint8Array) => {
    const characteristic = txCharacteristic as {
      writeValue?: (value: BufferSource) => Promise<void>;
      writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
    } | null;
    const payload = toBluetoothBufferSource(bytes);
    if (!characteristic) throw new Error("蓝牙桥接未连接");
    if (characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(payload);
      return;
    }
    if (characteristic.writeValue) {
      await characteristic.writeValue(payload);
      return;
    }
    throw new Error("蓝牙特征值不支持写入");
  };

  const runtime: HardwareDeviceBridgeRuntime = {
    id: runtimeId,
    getProtocolVersion: () => protocolVersion,
    getCapabilities: () => capabilities,
    getLastHeartbeatAt: () => protocol?.getLastHeartbeatAt() ?? null,
    getMeta: () => ({ battery, firmware }),
    connect: async () => {
      const device = (await nav.bluetooth!.requestDevice({
        acceptAllDevices: true,
        optionalServices: [DEFAULT_BLUETOOTH_SERVICE_UUID]
      })) as {
        id?: string;
        gatt?: { connect: () => Promise<unknown> };
      };
      runtimeId = device.id ? `bluetooth-${device.id}` : runtimeId;

      if (!device.gatt?.connect) throw new Error("蓝牙设备不支持 GATT 连接");
      gattServer = await device.gatt.connect();

      const server = gattServer as {
        getPrimaryService: (uuid: string) => Promise<{
          getCharacteristic: (uuid: string) => Promise<unknown>;
        }>;
      };

      const service = await server.getPrimaryService(DEFAULT_BLUETOOTH_SERVICE_UUID);
      txCharacteristic = await service.getCharacteristic(DEFAULT_BLUETOOTH_TX_CHAR_UUID);
      rxCharacteristic = await service.getCharacteristic(DEFAULT_BLUETOOTH_RX_CHAR_UUID);

      protocol = new JsonLineProtocolClient(writeRaw);

      const notifier = rxCharacteristic as {
        startNotifications?: () => Promise<void>;
        addEventListener?: (event: string, listener: (event: Event) => void) => void;
      };
      if (notifier.startNotifications && notifier.addEventListener) {
        await notifier.startNotifications();
        notifier.addEventListener("characteristicvaluechanged", (event: Event) => {
          const target = event.target as { value?: DataView } | null;
          const value = target?.value;
          if (!value || !protocol) return;
          protocol.ingestBytes(new Uint8Array(value.buffer));
        });
      }

      const handshakeFallback = {
        payload: {
          battery: null,
          firmware: "bluetooth-unknown",
          capabilities: toRuntimeCapabilities([], "bluetooth")
        }
      };

      const handshake = await protocol.send("handshake", {
        protocolVersion,
        transport: "bluetooth",
        client: "site"
      }).catch(() => handshakeFallback as Record<string, unknown>);

      const handshakePayload = isObjectRecord(handshake.payload) ? handshake.payload : {};
      const meta = normalizeDeviceMeta(handshakePayload);
      battery = meta.battery ?? battery;
      firmware = meta.firmware ?? firmware ?? "bluetooth-unknown";
      const serverVersion = typeof handshakePayload.protocolVersion === "string" ? handshakePayload.protocolVersion : null;
      protocolVersion = serverVersion ?? protocolVersion;
      capabilities = toRuntimeCapabilities(normalizeCapabilities(handshakePayload.capabilities), "bluetooth");

      return {
        battery,
        firmware
      };
    },
    disconnect: async () => {
      try {
        await protocol?.sendWithoutAck("disconnect", { reason: "app_request" }).catch(() => undefined);
      } finally {
        protocol?.dispose();
        protocol = null;
      }

      const server = gattServer as { disconnect?: () => void } | null;
      server?.disconnect?.();
      gattServer = null;
      txCharacteristic = null;
      rxCharacteristic = null;
    },
    sendOutput: async (output) => {
      if (!protocol) throw new Error("蓝牙桥接未连接");
      await protocol.send("state_sync", toWirePayload(output)).catch(async () => {
        await protocol?.sendWithoutAck("state_sync", toWirePayload(output));
      });
    },
    testSensor: async (sensor) => {
      if (!protocol) return "error";
      const response = await protocol.send("sensor_test", { sensor }).catch(() => null);
      if (!response) return "error";
      if (response.payload && isObjectRecord(response.payload)) {
        const status = response.payload.status;
        if (status === "ok" || status === "error") return status;
      }
      return "ok";
    }
  };

  return runtime;
}

async function createApiRuntime(): Promise<HardwareDeviceBridgeRuntime> {
  const config = loadApiBridgeConfig();
  if (typeof fetch === "undefined") {
    throw new Error("当前环境不支持 fetch，无法使用 API 桥接通道。");
  }

  let protocolVersion = "api-bridge/1.0.0";
  let capabilities = toRuntimeCapabilities(["transport.api"], "api");
  let battery: number | null = null;
  let firmware: string | null = null;
  let runtimeId = `api-${config.baseUrl}`;
  let lastHeartbeatAt: string | null = null;

  const requestJson = async (
    endpoint: string,
    payload?: Record<string, unknown>,
    timeoutMs = HANDSHAKE_TIMEOUT_MS
  ): Promise<Record<string, unknown>> => {
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${config.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.bearerToken ? { Authorization: `Bearer ${config.bearerToken}` } : {})
        },
        body: JSON.stringify({
          at: new Date().toISOString(),
          payload
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`API 桥接请求失败（${response.status} ${response.statusText}）`);
      }
      const data = (await response.json().catch(() => ({}))) as unknown;
      if (!isObjectRecord(data)) return {};
      lastHeartbeatAt = new Date().toISOString();
      return data;
    } finally {
      globalThis.clearTimeout(timer);
    }
  };

  const runtime: HardwareDeviceBridgeRuntime = {
    id: runtimeId,
    getProtocolVersion: () => protocolVersion,
    getCapabilities: () => capabilities,
    getLastHeartbeatAt: () => lastHeartbeatAt,
    getMeta: () => ({ battery, firmware }),
    connect: async () => {
      const response = await requestJson("/connect", {
        client: "site",
        protocolVersion,
        transport: "api"
      });
      const payload = isObjectRecord(response.payload) ? response.payload : response;
      const meta = normalizeDeviceMeta(payload);
      battery = meta.battery ?? battery;
      firmware = meta.firmware ?? firmware ?? "api-bridge";
      const remoteProtocol = normalizeNonEmptyString(payload.protocolVersion);
      if (remoteProtocol) {
        protocolVersion = remoteProtocol;
      }
      capabilities = toRuntimeCapabilities(normalizeCapabilities(payload.capabilities), "api");
      runtimeId = normalizeNonEmptyString(payload.runtimeId) ?? runtimeId;
      return { battery, firmware };
    },
    disconnect: async () => {
      await requestJson("/disconnect", { reason: "app_request" }).catch(() => undefined);
    },
    sendOutput: async (output) => {
      await requestJson("/state-sync", {
        state: toWirePayload(output)
      });
    },
    testSensor: async (sensor) => {
      const response = await requestJson("/sensor-test", { sensor }).catch(() => null);
      if (!response) return "error";
      const payload = isObjectRecord(response.payload) ? response.payload : response;
      const status = payload.status;
      if (status === "ok" || status === "error") return status;
      return "ok";
    }
  };

  return runtime;
}

function isExternalRuntime(value: unknown): value is HardwareDeviceBridgeRuntime {
  if (!isObjectRecord(value)) return false;
  return typeof value.id === "string" && typeof value.sendOutput === "function";
}

export async function resolveBridgeRuntime(options: RuntimeResolverOptions): Promise<{
  mode: "hardware" | "mock";
  runtime: HardwareDeviceBridgeRuntime;
  hint: string;
  selectedTransport: BuiltinBridgeTransport;
}> {
  const external = options.externalRuntime;

  if (options.transport === "runtime") {
    if (external && isExternalRuntime(external)) {
      return {
        mode: "hardware",
        runtime: external,
        hint: "使用外部注入桥接 runtime。",
        selectedTransport: "runtime"
      };
    }
    throw new Error("未检测到外部桥接 runtime，请先注入 window.__XIAO_YANG_JUAN_DEVICE_BRIDGE__");
  }

  if (options.transport === "serial") {
    const runtime = await createSerialRuntime();
    return {
      mode: "hardware",
      runtime,
      hint: "使用 Web Serial 直连硬件桥接。",
      selectedTransport: "serial"
    };
  }

  if (options.transport === "bluetooth") {
    const runtime = await createBluetoothRuntime();
    return {
      mode: "hardware",
      runtime,
      hint: "使用 Web Bluetooth 直连硬件桥接。",
      selectedTransport: "bluetooth"
    };
  }

  if (options.transport === "api") {
    const runtime = await createApiRuntime();
    return {
      mode: "hardware",
      runtime,
      hint: "使用 HTTP API 桥接通道。",
      selectedTransport: "api"
    };
  }

  if (options.transport === "auto") {
    if (external && isExternalRuntime(external)) {
      return {
        mode: "hardware",
        runtime: external,
        hint: "检测到外部桥接 runtime，自动切换 hardware 通道。",
        selectedTransport: "runtime"
      };
    }
  }

  return {
    mode: "mock",
    runtime: {
      id: "mock-lambroll-device",
      sendOutput: async () => undefined,
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
      ],
      getProtocolVersion: () => "mock-bridge/1.0.0"
    },
    hint: "未检测到可用硬件桥接，使用 mock 通道。",
    selectedTransport: "mock"
  };
}

export function availableBridgeTransports(): BuiltinBridgeTransport[] {
  const transports: BuiltinBridgeTransport[] = ["auto", "mock", "runtime", "api"];
  if (typeof navigator === "undefined") return transports;
  const nav = navigator as Navigator & { serial?: unknown; bluetooth?: unknown };
  if (nav.serial) transports.push("serial");
  if (nav.bluetooth) transports.push("bluetooth");
  return transports;
}
