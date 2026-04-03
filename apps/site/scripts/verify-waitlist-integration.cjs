/* eslint-disable no-console */
const crypto = require("node:crypto");

function normalizeUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

async function postWaitlist(url, payload, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text };
    }
    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const siteUrl = normalizeUrl(process.env.WAITLIST_VERIFY_SITE_URL || "https://www.colorful-lamb-rolls.cloud");
  const endpoint = `${siteUrl}/api/waitlist`;
  const timeoutMs = Number(process.env.WAITLIST_VERIFY_TIMEOUT_MS || 15000);
  const submissionId = `verify-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const contact =
    String(process.env.WAITLIST_VERIFY_CONTACT || "").trim() || `verify+${Date.now()}@example.com`;
  const captchaToken = String(process.env.WAITLIST_VERIFY_CAPTCHA_TOKEN || "").trim() || null;

  const payload = {
    id: submissionId,
    createdAt: new Date().toISOString(),
    clientAt: new Date().toISOString(),
    source: "milestone",
    payload: {
      wantsPhysical: "yes",
      favoriteScene: "comfort",
      favoriteColorExperience: "integration-check",
      joinWaitlist: "yes",
      contact
    },
    website: "",
    captchaToken
  };

  console.log(`[waitlist-verify] POST ${endpoint}`);
  const { response, body } = await postWaitlist(endpoint, payload, timeoutMs);

  if (!response.ok) {
    console.error("[waitlist-verify] failed", {
      status: response.status,
      body
    });
    process.exit(1);
  }

  if (!body || body.accepted !== true) {
    console.error("[waitlist-verify] unexpected response", body);
    process.exit(1);
  }

  console.log("[waitlist-verify] success", {
    submissionId: body.submissionId || submissionId,
    queuedAt: body.queuedAt,
    channel: body.channel
  });
}

main().catch((error) => {
  console.error("[waitlist-verify] fatal", error);
  process.exit(1);
});
