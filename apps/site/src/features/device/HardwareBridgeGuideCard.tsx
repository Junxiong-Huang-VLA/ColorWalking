const API_CONFIG_SNIPPET = `localStorage.setItem("xiao-yang-juan.device.api_base", "https://your-api-host/device-bridge");
localStorage.setItem("xiao-yang-juan.device.api_token", "YOUR_TOKEN");
// 切到 HTTP API 桥接通道后重新连接设备`; 

const INJECTION_SNIPPET = `window.__XIAO_YANG_JUAN_DEVICE_BRIDGE__ = {
  id: "custom-hardware-bridge",
  protocolVersion: "xiao-yang-juan-bridge/1.0.0",
  capabilities: ["handshake.basic", "state.sync", "sensor.stream"],
  async connect() {
    // TODO: 接你的真实后端 API / 本地桥接进程
    return { battery: 100, firmware: "api-bridge-dev" };
  },
  async disconnect() {},
  async sendOutput(output) {
    // TODO: 把 output 转发给硬件控制层
    console.log("bridge output", output);
  },
  async testSensor(sensor) {
    // TODO: 回传传感器联调结果
    return "ok";
  }
};`;

export function HardwareBridgeGuideCard() {
  return (
    <article className="card" data-testid="hardware-bridge-guide-card">
      <h2>真实硬件联调指引</h2>
      <p className="muted">设备页现在支持四种真实联调路径：serial / bluetooth / api / runtime 注入。</p>
      <ul className="companion-module-list" style={{ marginTop: 10 }}>
        <li>
          <b>Web Serial（串口）</b>
          <p>选择“Web Serial（串口）”后点“连接设备”，浏览器会弹出串口选择器。</p>
        </li>
        <li>
          <b>Web Bluetooth（蓝牙）</b>
          <p>选择“Web Bluetooth（蓝牙）”后点“连接设备”，按 FFE0/FFE1 服务默认协议握手。</p>
        </li>
        <li>
          <b>HTTP API 桥接</b>
          <p>配置 API Base 与 token 后，切到“HTTP API 桥接”通道即可走真实后端联调。</p>
        </li>
        <li>
          <b>External Runtime 注入</b>
          <p>在浏览器控制台注入 `window.__XIAO_YANG_JUAN_DEVICE_BRIDGE__`，再切到 runtime 通道。</p>
        </li>
      </ul>
      <pre className="json-box" style={{ marginTop: 10 }}>
        <code>{API_CONFIG_SNIPPET}</code>
      </pre>
      <pre className="json-box" style={{ marginTop: 10 }}>
        <code>{INJECTION_SNIPPET}</code>
      </pre>
      <p className="muted" style={{ marginTop: 8 }}>
        提示：Serial / Bluetooth 需要 HTTPS + Chrome/Edge。切换桥接通道后请重新连接设备。
      </p>
    </article>
  );
}
