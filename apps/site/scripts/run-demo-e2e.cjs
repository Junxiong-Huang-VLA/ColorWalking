const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, ".demo-e2e");
const outPackageJsonPath = path.join(outDir, "package.json");
const sourceConfigDir = path.join(root, "src", "config");
const outputConfigDir = path.join(outDir, "src", "config");
const sharedShimDir = path.join(outDir, "node_modules", "@colorwalking", "shared");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeSharedShim() {
  ensureDir(sharedShimDir);
  fs.writeFileSync(
    path.join(sharedShimDir, "package.json"),
    JSON.stringify({ name: "@colorwalking/shared", version: "0.0.0", main: "index.js" }, null, 2)
  );
  fs.writeFileSync(
    path.join(sharedShimDir, "index.js"),
    `
const DEVICE_INPUT_EVENT_TYPES = [
  "touch_head",
  "touch_body",
  "hug_pressure",
  "proximity_near",
  "picked_up",
  "laid_down",
  "chat_started",
  "daily_color_drawn",
  "bedtime_mode_started"
];

function formatDayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "1970-01-01";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return \`\${y}-\${m}-\${day}\`;
}

module.exports = {
  DEVICE_INPUT_EVENT_TYPES,
  formatDayKey
};
`.trimStart()
  );
}

function run() {
  fs.rmSync(outDir, { recursive: true, force: true });

  try {
    execSync("pnpm exec tsc -p tsconfig.demo-e2e.json", {
      cwd: root,
      stdio: "inherit"
    });

    ensureDir(outDir);
    fs.writeFileSync(outPackageJsonPath, JSON.stringify({ type: "commonjs" }, null, 2));

    fs.cpSync(sourceConfigDir, outputConfigDir, { recursive: true });
    writeSharedShim();

    execSync("node .demo-e2e/scripts/demo-e2e.js", {
      cwd: root,
      stdio: "inherit"
    });
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

run();
