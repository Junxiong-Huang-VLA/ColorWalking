const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, ".engine-smoke");
const outPackageJsonPath = path.join(outDir, "package.json");
const sourceConfigDir = path.join(root, "src", "config");
const outputConfigDir = path.join(outDir, "src", "config");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function run() {
  fs.rmSync(outDir, { recursive: true, force: true });

  try {
    execSync("pnpm exec tsc -p tsconfig.engine-smoke.json", {
      cwd: root,
      stdio: "inherit"
    });

    ensureDir(outDir);
    fs.writeFileSync(outPackageJsonPath, JSON.stringify({ type: "commonjs" }, null, 2));

    fs.cpSync(sourceConfigDir, outputConfigDir, {
      recursive: true
    });

    execSync("node .engine-smoke/scripts/engine-smoke.js", {
      cwd: root,
      stdio: "inherit"
    });
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

run();
