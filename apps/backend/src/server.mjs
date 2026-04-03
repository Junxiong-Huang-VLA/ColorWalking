import cors from "cors";
import express from "express";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../../..");
const DB_PATH = process.env.CW_DB_PATH ?? resolve(ROOT_DIR, "apps/backend/data/colorwalking.db");
const PORT = Number(process.env.PORT ?? 8787);
const FOLLOWUP_WEBHOOK_URL = process.env.CW_FOLLOWUP_WEBHOOK_URL ?? "";
const BRIDGE_WEBHOOK_URL = process.env.CW_BRIDGE_WEBHOOK_URL ?? "";
const API_TOKEN = process.env.CW_API_TOKEN ?? "";
const ALLOWED_WAITLIST_STATUS = new Set(["filled", "queued", "uploading", "success", "failed"]);
const ALLOWED_WAITLIST_SOURCE = new Set(["home", "lucky", "future", "about", "premiere", "unknown"]);
const ALLOWED_BRIDGE_TRIGGER = new Set([
  "ritual",
  "interaction",
  "waitlist-filled",
  "waitlist-queued",
  "waitlist-uploading",
  "waitlist-success",
  "waitlist-failed",
  "waitlist-followup",
  "e2e-covered",
  "manual"
]);
const ALLOWED_E2E_STATUS = new Set(["passed", "failed", "running"]);
const WAITLIST_RATE_STATE = new Map();

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA busy_timeout = 5000;");
db.exec(`
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  intent TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  fail_reason TEXT,
  followup_requested_at TEXT,
  followup_status TEXT NOT NULL DEFAULT 'idle',
  followup_note TEXT,
  submitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_waitlist_submitted_at ON waitlist_entries(submitted_at DESC);

CREATE TABLE IF NOT EXISTS followup_jobs (
  id TEXT PRIMARY KEY,
  waitlist_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  provider_response TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(waitlist_id) REFERENCES waitlist_entries(id)
);
CREATE INDEX IF NOT EXISTS idx_followup_waitlist_id ON followup_jobs(waitlist_id);

CREATE TABLE IF NOT EXISTS bridge_outputs (
  id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  delivery_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_bridge_created_at ON bridge_outputs(created_at DESC);

CREATE TABLE IF NOT EXISTS e2e_runs (
  id TEXT PRIMARY KEY,
  suite TEXT NOT NULL,
  status TEXT NOT NULL,
  report_url TEXT,
  commit_sha TEXT,
  run_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_e2e_created_at ON e2e_runs(created_at DESC);
`);

function nowIso() {
  return new Date().toISOString();
}

function toInteger(value, fallback, min = 1, max = 100) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function asText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function envInt(name, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(String(process.env[name] ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getClientIp(req) {
  const forwarded = asText(req.headers["x-forwarded-for"]);
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = asText(req.headers["x-real-ip"]);
  if (realIp) return realIp;
  const cfIp = asText(req.headers["cf-connecting-ip"]);
  if (cfIp) return cfIp;
  const ip = asText(req.ip);
  return ip || "unknown";
}

function authorizeRequest(req, res) {
  if (!API_TOKEN) return true;
  const auth = asText(req.headers.authorization);
  if (auth === `Bearer ${API_TOKEN}`) return true;
  res.status(401).json({ ok: false, error: "unauthorized" });
  return false;
}

function checkWaitlistRateLimit(ip) {
  const windowMs = envInt("CW_WAITLIST_RATE_LIMIT_WINDOW_MS", 60_000, 1000, 3_600_000);
  const maxCount = envInt("CW_WAITLIST_RATE_LIMIT_MAX", 10, 1, 1000);
  const blockMs = envInt("CW_WAITLIST_RATE_LIMIT_BLOCK_MS", 10 * 60_000, 1000, 24 * 60 * 60 * 1000);
  const now = Date.now();
  const current = WAITLIST_RATE_STATE.get(ip) ?? {
    startedAt: now,
    count: 0,
    blockedUntil: 0
  };

  if (current.blockedUntil > now) {
    return { ok: false, retryAfterSeconds: Math.ceil((current.blockedUntil - now) / 1000) };
  }

  if (now - current.startedAt > windowMs) {
    current.startedAt = now;
    current.count = 0;
  }
  current.count += 1;
  if (current.count > maxCount) {
    current.blockedUntil = now + blockMs;
    WAITLIST_RATE_STATE.set(ip, current);
    return { ok: false, retryAfterSeconds: Math.ceil(blockMs / 1000) };
  }

  WAITLIST_RATE_STATE.set(ip, current);
  return { ok: true };
}

function validateClientAt(clientAt) {
  if (!clientAt) return { ok: true };
  const ms = Date.parse(clientAt);
  if (!Number.isFinite(ms)) return { ok: false, error: "invalid_client_timestamp" };
  const now = Date.now();
  const maxAge = envInt("CW_WAITLIST_CLIENT_AT_MAX_AGE_MS", 2 * 60 * 60 * 1000, 60_000, 7 * 24 * 60 * 60 * 1000);
  const futureSkew = envInt("CW_WAITLIST_CLIENT_AT_MAX_FUTURE_MS", 5 * 60 * 1000, 0, 60 * 60 * 1000);
  if (ms < now - maxAge || ms > now + futureSkew) {
    return { ok: false, error: "stale_client_timestamp" };
  }
  return { ok: true };
}

function mapWaitlist(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    intent: row.intent,
    source: row.source,
    status: row.status,
    retryCount: row.retry_count,
    failReason: row.fail_reason ?? undefined,
    followupRequestedAt: row.followup_requested_at ?? undefined,
    followupStatus: row.followup_status,
    followupNote: row.followup_note ?? undefined,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at
  };
}

function mapBridgeOutput(row) {
  if (!row) return null;
  let payload = {};
  try {
    payload = JSON.parse(row.payload_json);
  } catch {
    payload = {};
  }
  return {
    id: row.id,
    trigger: row.trigger,
    payload,
    createdAt: row.created_at,
    deliveryStatus: row.delivery_status,
    deliveryNote: row.delivery_note ?? undefined
  };
}

function mapE2ERun(row) {
  if (!row) return null;
  return {
    id: row.id,
    suite: row.suite,
    status: row.status,
    reportUrl: row.report_url ?? undefined,
    commitSha: row.commit_sha ?? undefined,
    runId: row.run_id ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at
  };
}

function getWaitlistById(id) {
  const row = db.prepare("SELECT * FROM waitlist_entries WHERE id = ?").get(id);
  return mapWaitlist(row);
}

async function deliverToWebhook(url, payload) {
  if (!url) {
    return { status: "skipped", note: "webhook_not_configured" };
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const text = await response.text();
      return { status: "failed", note: `http_${response.status}:${text.slice(0, 180)}` };
    }
    return { status: "sent", note: "ok" };
  } catch (error) {
    return {
      status: "failed",
      note: error instanceof Error ? `network:${error.message.slice(0, 180)}` : "network:unknown"
    };
  }
}

const bridgeSubscribers = new Set();
function broadcastBridge(output) {
  const payload = `event: bridge\ndata: ${JSON.stringify(output)}\n\n`;
  bridgeSubscribers.forEach((res) => {
    try {
      res.write(payload);
    } catch {
      bridgeSubscribers.delete(res);
    }
  });
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

function healthPayload() {
  return {
    ok: true,
    service: "colorwalking-backend",
    now: nowIso(),
    dbPath: DB_PATH
  };
}

app.get("/health", (_req, res) => {
  res.json(healthPayload());
});

app.get("/api/health", (_req, res) => {
  res.json({
    ...healthPayload(),
    via: "api"
  });
});

app.post("/api/waitlist", (req, res) => {
  if (!authorizeRequest(req, res)) return;
  const ip = getClientIp(req);
  const rate = checkWaitlistRateLimit(ip);
  if (!rate.ok) {
    res.setHeader("retry-after", String(rate.retryAfterSeconds ?? 60));
    res.status(429).json({ ok: false, error: "rate_limited_temporarily" });
    return;
  }

  const website = asText(req.body?.website);
  if (website) {
    res.json({ ok: true, ignored: true });
    return;
  }

  const ts = validateClientAt(asText(req.body?.clientAt));
  if (!ts.ok) {
    res.status(400).json({ ok: false, error: ts.error });
    return;
  }

  const name = asText(req.body?.name);
  const email = asText(req.body?.email).toLowerCase();
  const intent = asText(req.body?.intent);
  const sourceRaw = asText(req.body?.source, "unknown");
  const source = ALLOWED_WAITLIST_SOURCE.has(sourceRaw) ? sourceRaw : "unknown";
  if (!name || !email || !intent || !isLikelyEmail(email)) {
    res.status(400).json({ ok: false, error: "name_email_intent_required" });
    return;
  }

  const id = asText(req.body?.id) || crypto.randomUUID();
  const now = nowIso();
  db.prepare(`
    INSERT OR REPLACE INTO waitlist_entries (
      id, name, email, intent, source, status, retry_count, fail_reason,
      followup_requested_at, followup_status, followup_note, submitted_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'filled', 0, NULL, NULL, 'idle', NULL, ?, ?)
  `).run(id, name, email, intent, source, now, now);

  res.json({ ok: true, waitlist: getWaitlistById(id) });
});

app.patch("/api/waitlist/:id/status", (req, res) => {
  if (!authorizeRequest(req, res)) return;
  const id = asText(req.params.id);
  const statusRaw = asText(req.body?.status);
  const failReason = asText(req.body?.failReason);
  if (!ALLOWED_WAITLIST_STATUS.has(statusRaw)) {
    res.status(400).json({ ok: false, error: "invalid_status" });
    return;
  }

  const row = db.prepare("SELECT * FROM waitlist_entries WHERE id = ?").get(id);
  if (!row) {
    res.status(404).json({ ok: false, error: "waitlist_not_found" });
    return;
  }

  let retryCount = Number(row.retry_count ?? 0);
  if (statusRaw === "queued" && row.status === "failed") retryCount += 1;

  db.prepare(`
    UPDATE waitlist_entries
    SET status = ?, retry_count = ?, fail_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(statusRaw, retryCount, statusRaw === "failed" ? failReason || "upload_failed" : null, nowIso(), id);

  res.json({ ok: true, waitlist: getWaitlistById(id) });
});

app.post("/api/waitlist/:id/retry", (req, res) => {
  if (!authorizeRequest(req, res)) return;
  const id = asText(req.params.id);
  const row = db.prepare("SELECT * FROM waitlist_entries WHERE id = ?").get(id);
  if (!row) {
    res.status(404).json({ ok: false, error: "waitlist_not_found" });
    return;
  }
  db.prepare(`
    UPDATE waitlist_entries
    SET status = 'queued', retry_count = retry_count + 1, fail_reason = NULL, updated_at = ?
    WHERE id = ?
  `).run(nowIso(), id);
  res.json({ ok: true, waitlist: getWaitlistById(id) });
});

app.post("/api/waitlist/:id/followup", async (req, res) => {
  if (!authorizeRequest(req, res)) return;
  const id = asText(req.params.id);
  const channel = asText(req.body?.channel, "email");
  const row = db.prepare("SELECT * FROM waitlist_entries WHERE id = ?").get(id);
  if (!row) {
    res.status(404).json({ ok: false, error: "waitlist_not_found" });
    return;
  }

  const waitlist = mapWaitlist(row);
  const now = nowIso();
  db.prepare(`
    UPDATE waitlist_entries
    SET followup_requested_at = ?, followup_status = 'queued', followup_note = NULL, updated_at = ?
    WHERE id = ?
  `).run(now, now, id);

  const payload = {
    channel,
    waitlistId: waitlist.id,
    name: waitlist.name,
    email: waitlist.email,
    intent: waitlist.intent,
    source: waitlist.source,
    requestedAt: now
  };
  const jobId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO followup_jobs (id, waitlist_id, channel, provider, status, payload_json, provider_response, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'queued', ?, NULL, ?, ?)
  `).run(jobId, id, channel, FOLLOWUP_WEBHOOK_URL ? "webhook" : "none", JSON.stringify(payload), now, now);

  const delivery = await deliverToWebhook(FOLLOWUP_WEBHOOK_URL, payload);
  db.prepare(`
    UPDATE followup_jobs
    SET status = ?, provider_response = ?, updated_at = ?
    WHERE id = ?
  `).run(delivery.status, delivery.note, nowIso(), jobId);

  db.prepare(`
    UPDATE waitlist_entries
    SET followup_status = ?, followup_note = ?, updated_at = ?
    WHERE id = ?
  `).run(delivery.status, delivery.note, nowIso(), id);

  const job = db.prepare("SELECT * FROM followup_jobs WHERE id = ?").get(jobId);
  res.json({
    ok: true,
    waitlist: getWaitlistById(id),
    followupJob: {
      id: job.id,
      waitlistId: job.waitlist_id,
      channel: job.channel,
      provider: job.provider,
      status: job.status,
      providerResponse: job.provider_response ?? undefined,
      createdAt: job.created_at,
      updatedAt: job.updated_at
    }
  });
});

app.get("/api/waitlist/:id", (req, res) => {
  const waitlist = getWaitlistById(asText(req.params.id));
  if (!waitlist) {
    res.status(404).json({ ok: false, error: "waitlist_not_found" });
    return;
  }
  res.json({ ok: true, waitlist });
});

app.get("/api/waitlist", (req, res) => {
  const limit = toInteger(req.query.limit, 20, 1, 100);
  const rows = db.prepare("SELECT * FROM waitlist_entries ORDER BY submitted_at DESC LIMIT ?").all(limit);
  res.json({ ok: true, waitlist: rows.map(mapWaitlist) });
});

app.post("/api/bridge/outputs", async (req, res) => {
  if (!authorizeRequest(req, res)) return;
  const trigger = asText(req.body?.trigger);
  if (!ALLOWED_BRIDGE_TRIGGER.has(trigger)) {
    res.status(400).json({ ok: false, error: "invalid_trigger" });
    return;
  }
  const payload = req.body?.payload;
  if (!payload || typeof payload !== "object") {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  const id = asText(req.body?.id) || crypto.randomUUID();
  const createdAt = asText(req.body?.createdAt) || nowIso();
  db.prepare(`
    INSERT OR REPLACE INTO bridge_outputs (id, trigger, payload_json, created_at, delivery_status, delivery_note)
    VALUES (?, ?, ?, ?, 'pending', NULL)
  `).run(id, trigger, JSON.stringify(payload), createdAt);

  const delivery = await deliverToWebhook(BRIDGE_WEBHOOK_URL, {
    id,
    trigger,
    payload,
    createdAt
  });
  db.prepare(`
    UPDATE bridge_outputs
    SET delivery_status = ?, delivery_note = ?
    WHERE id = ?
  `).run(delivery.status, delivery.note, id);

  const output = mapBridgeOutput(db.prepare("SELECT * FROM bridge_outputs WHERE id = ?").get(id));
  broadcastBridge(output);
  res.json({ ok: true, output });
});

app.get("/api/bridge/outputs", (req, res) => {
  const limit = toInteger(req.query.limit, 20, 1, 100);
  const rows = db.prepare("SELECT * FROM bridge_outputs ORDER BY created_at DESC LIMIT ?").all(limit);
  res.json({ ok: true, outputs: rows.map(mapBridgeOutput) });
});

app.get("/api/bridge/stream", (req, res) => {
  res.setHeader("content-type", "text/event-stream");
  res.setHeader("cache-control", "no-cache");
  res.setHeader("connection", "keep-alive");
  res.flushHeaders();
  res.write("event: ready\ndata: {\"ok\":true}\n\n");
  bridgeSubscribers.add(res);

  const ping = setInterval(() => {
    try {
      res.write("event: ping\ndata: {}\n\n");
    } catch {
      clearInterval(ping);
      bridgeSubscribers.delete(res);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(ping);
    bridgeSubscribers.delete(res);
  });
});

app.post("/api/e2e/runs", (req, res) => {
  if (!authorizeRequest(req, res)) return;
  const suite = asText(req.body?.suite);
  const status = asText(req.body?.status);
  if (!suite || !ALLOWED_E2E_STATUS.has(status)) {
    res.status(400).json({ ok: false, error: "suite_and_status_required" });
    return;
  }
  const id = crypto.randomUUID();
  const createdAt = nowIso();
  db.prepare(`
    INSERT INTO e2e_runs (id, suite, status, report_url, commit_sha, run_id, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    suite,
    status,
    asText(req.body?.reportUrl) || null,
    asText(req.body?.commitSha) || null,
    asText(req.body?.runId) || null,
    asText(req.body?.note) || null,
    createdAt
  );

  res.json({ ok: true, run: mapE2ERun(db.prepare("SELECT * FROM e2e_runs WHERE id = ?").get(id)) });
});

app.get("/api/e2e/latest", (req, res) => {
  const suite = asText(req.query.suite, "investor-demo-baseline");
  const row = db.prepare("SELECT * FROM e2e_runs WHERE suite = ? ORDER BY created_at DESC LIMIT 1").get(suite);
  res.json({ ok: true, run: mapE2ERun(row) });
});

app.get("/api/e2e/runs", (req, res) => {
  const limit = toInteger(req.query.limit, 20, 1, 100);
  const suite = asText(req.query.suite);
  const rows = suite
    ? db.prepare("SELECT * FROM e2e_runs WHERE suite = ? ORDER BY created_at DESC LIMIT ?").all(suite, limit)
    : db.prepare("SELECT * FROM e2e_runs ORDER BY created_at DESC LIMIT ?").all(limit);
  res.json({ ok: true, runs: rows.map(mapE2ERun) });
});

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] colorwalking backend listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[backend] sqlite: ${DB_PATH}`);
});

function shutdown() {
  server.close(() => {
    try {
      db.close();
    } catch {
      // ignore
    }
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
