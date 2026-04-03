/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const protocolPath = path.join(root, "src", "config", "device-protocol.json");
const outputMapperPath = path.join(root, "src", "domain", "device", "outputMapper.ts");
const mockBridgePath = path.join(root, "src", "services", "device", "MockDeviceBridge.ts");
const hardwareBridgePath = path.join(root, "src", "services", "device", "HardwareBridgeRuntime.ts");

const REQUIRED_INPUT_EVENTS = [
  "touch_head",
  "touch_body",
  "hug_pressure",
  "proximity_near",
  "picked_up",
  "laid_down"
];

const REQUIRED_OUTPUT_FIELDS = [
  "emotion",
  "emotionLevel",
  "eyeState",
  "eyeColorHex",
  "scarfColorHex",
  "motionTemplate",
  "voiceStyle"
];

const REQUIRED_WIRE_FIELDS = [
  "emotion",
  "emotion_level",
  "eye_state",
  "eye_color_hex",
  "scarf_color",
  "scarf_color_hex",
  "motion_template",
  "voice_style"
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[bridge-contract] ${message}`);
  }
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function run() {
  const protocol = JSON.parse(readText(protocolPath));
  const inputEvents = Array.isArray(protocol.inputEvents) ? protocol.inputEvents.map((item) => item.eventType) : [];
  const outputFields = Array.isArray(protocol.outputState?.fields)
    ? protocol.outputState.fields.map((item) => item.name)
    : [];

  for (const eventType of REQUIRED_INPUT_EVENTS) {
    assert(inputEvents.includes(eventType), `missing input event in protocol: ${eventType}`);
  }
  for (const field of REQUIRED_OUTPUT_FIELDS) {
    assert(outputFields.includes(field), `missing output field in protocol: ${field}`);
  }

  const outputMapperSource = readText(outputMapperPath);
  for (const field of REQUIRED_WIRE_FIELDS) {
    assert(
      outputMapperSource.includes(`${field}:`) || outputMapperSource.includes(`"${field}"`) || outputMapperSource.includes(`'${field}'`),
      `output mapper is missing wire field: ${field}`
    );
  }

  const mockBridgeSource = readText(mockBridgePath);
  for (const eventType of REQUIRED_INPUT_EVENTS) {
    assert(mockBridgeSource.includes(`input.${eventType}`), `mock bridge capabilities missing input.${eventType}`);
  }
  for (const capability of ["output.emotion", "output.eye_state", "output.scarf_color", "output.motion_template", "output.voice_style"]) {
    assert(mockBridgeSource.includes(capability), `mock bridge capabilities missing ${capability}`);
  }

  const hardwareBridgeSource = readText(hardwareBridgePath);
  for (const field of REQUIRED_WIRE_FIELDS) {
    assert(hardwareBridgeSource.includes(field), `hardware bridge payload mapping missing ${field}`);
  }

  console.log("[bridge-contract] protocol + mapper + bridge capability checks passed");
}

run();

