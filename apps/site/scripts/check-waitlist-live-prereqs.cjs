/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const strict = process.argv.includes("--strict");

const results = [];

function pushResult(level, key, detail) {
  results.push({ level, key, detail });
}

function check(condition, key, passDetail, failDetail, failLevel = "warn") {
  if (condition) {
    pushResult("pass", key, passDetail);
    return;
  }
  pushResult(failLevel, key, failDetail);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isHttpsUrl(value) {
  return /^https:\/\//i.test(value);
}

function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function printResult(item) {
  const icon = item.level === "pass" ? "PASS" : item.level === "fail" ? "FAIL" : "WARN";
  console.log(`[waitlist-prereq] ${icon} ${item.key} - ${item.detail}`);
}

function run() {
  const waitlistBackendUrl = normalizeText(process.env.WAITLIST_BACKEND_URL);
  const waitlistBackendToken = normalizeText(process.env.WAITLIST_BACKEND_TOKEN);
  const turnstileSecret = normalizeText(process.env.WAITLIST_TURNSTILE_SECRET);
  const verifySiteUrl = normalizeText(process.env.WAITLIST_VERIFY_SITE_URL || "https://www.colorful-lamb-rolls.cloud");
  const verifyCaptchaToken = normalizeText(process.env.WAITLIST_VERIFY_CAPTCHA_TOKEN);

  check(fileExists("api/waitlist.ts"), "api.waitlist", "api/waitlist.ts exists", "api/waitlist.ts is missing", "fail");
  check(fileExists("scripts/verify-waitlist-integration.cjs"), "live.verify.script", "live verify script exists", "verify-waitlist-integration.cjs is missing", "fail");
  check(Boolean(waitlistBackendUrl), "env.backend.url", "WAITLIST_BACKEND_URL is configured", "WAITLIST_BACKEND_URL is not configured", "fail");
  check(
    !waitlistBackendUrl || isHttpsUrl(waitlistBackendUrl),
    "env.backend.url.scheme",
    "WAITLIST_BACKEND_URL uses HTTPS",
    "WAITLIST_BACKEND_URL should use HTTPS in production",
    strict ? "fail" : "warn"
  );
  check(
    Boolean(waitlistBackendToken),
    "env.backend.token",
    "WAITLIST_BACKEND_TOKEN is configured",
    "WAITLIST_BACKEND_TOKEN is empty (allowed only for trusted private upstream)"
  );
  check(
    isHttpsUrl(verifySiteUrl),
    "verify.site.url",
    `WAITLIST_VERIFY_SITE_URL=${verifySiteUrl}`,
    "WAITLIST_VERIFY_SITE_URL should be HTTPS",
    strict ? "fail" : "warn"
  );
  check(
    !turnstileSecret || Boolean(verifyCaptchaToken),
    "turnstile.verify.token",
    turnstileSecret
      ? "TURNSTILE secret enabled and WAITLIST_VERIFY_CAPTCHA_TOKEN provided"
      : "TURNSTILE secret not enabled, captcha token not required",
    "WAITLIST_TURNSTILE_SECRET is set but WAITLIST_VERIFY_CAPTCHA_TOKEN is missing",
    strict ? "fail" : "warn"
  );

  for (const item of results) {
    printResult(item);
  }

  const hasHardFailure = results.some((item) => item.level === "fail");
  if (hasHardFailure) {
    process.exit(1);
  }

  if (strict) {
    const hasWarn = results.some((item) => item.level === "warn");
    if (hasWarn) {
      console.error("[waitlist-prereq] strict mode enabled: warnings found");
      process.exit(1);
    }
  }

  console.log("[waitlist-prereq] prerequisite check completed");
}

run();

