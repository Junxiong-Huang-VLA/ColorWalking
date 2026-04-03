type RawSurveyPayload = {
  wantsPhysical?: "yes" | "no" | "unsure" | null;
  favoriteScene?: "chat" | "comfort" | "bedtime" | "mood" | "color" | null;
  favoriteColorExperience?: string | null;
  joinWaitlist?: "yes" | "no" | null;
  contact?: string | null;
};

type WaitlistDraft = {
  id?: string;
  createdAt?: string;
  clientAt?: string;
  source?: "experience_feedback_card" | "demo_mode" | "milestone";
  payload?: RawSurveyPayload;
  website?: string | null;
  captchaToken?: string | null;
};

type WaitlistRateState = {
  count: number;
  resetAt: number;
  blockedUntil: number;
  invalidCount: number;
};

type WaitlistRateStore = Map<string, WaitlistRateState>;

const RATE_LIMIT_WINDOW_MS = Number(process.env.WAITLIST_RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.WAITLIST_RATE_LIMIT_MAX_REQUESTS ?? 8);
const RATE_LIMIT_MAX_INVALID = Number(process.env.WAITLIST_RATE_LIMIT_MAX_INVALID ?? 4);
const RATE_LIMIT_BLOCK_MS = Number(process.env.WAITLIST_RATE_LIMIT_BLOCK_MS ?? 60 * 60 * 1000);
const MAX_CLIENT_TIME_DRIFT_MS = Number(process.env.WAITLIST_MAX_CLIENT_TIME_DRIFT_MS ?? 30 * 60 * 1000);
const CAPTCHA_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_SECRET = normalizeNullableText(process.env.WAITLIST_TURNSTILE_SECRET);

function rateStore(): WaitlistRateStore {
  const scoped = globalThis as { __waitlistRateStore__?: WaitlistRateStore };
  if (!scoped.__waitlistRateStore__) {
    scoped.__waitlistRateStore__ = new Map<string, WaitlistRateState>();
  }
  return scoped.__waitlistRateStore__;
}

function jsonResponse(res: any, status: number, body: Record<string, unknown>): void {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(JSON.stringify(body));
}

function normalizeNullableText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function parseBody(rawBody: unknown): WaitlistDraft | null {
  if (!rawBody) return null;
  if (typeof rawBody === "string") {
    try {
      return JSON.parse(rawBody) as WaitlistDraft;
    } catch {
      return null;
    }
  }
  if (typeof rawBody === "object") return rawBody as WaitlistDraft;
  return null;
}

function hasMeaningfulPayload(payload: RawSurveyPayload): boolean {
  return Boolean(
    payload.wantsPhysical ||
      payload.favoriteScene ||
      normalizeNullableText(payload.favoriteColorExperience) ||
      payload.joinWaitlist ||
      normalizeNullableText(payload.contact)
  );
}

function isAllowedSource(source: unknown): source is "experience_feedback_card" | "demo_mode" | "milestone" {
  return source === "experience_feedback_card" || source === "demo_mode" || source === "milestone";
}

function parseClientIp(req: any): string {
  const xff = normalizeNullableText(req.headers?.["x-forwarded-for"]);
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const vercelForwarded = normalizeNullableText(req.headers?.["x-real-ip"]);
  if (vercelForwarded) return vercelForwarded;
  const cfConnecting = normalizeNullableText(req.headers?.["cf-connecting-ip"]);
  if (cfConnecting) return cfConnecting;
  return "unknown";
}

function getOrCreateRateState(key: string, nowMs: number): WaitlistRateState {
  const store = rateStore();
  const current = store.get(key);
  if (!current || nowMs >= current.resetAt) {
    const fresh = {
      count: 0,
      resetAt: nowMs + RATE_LIMIT_WINDOW_MS,
      blockedUntil: current?.blockedUntil ?? 0,
      invalidCount: 0
    };
    store.set(key, fresh);
    return fresh;
  }
  return current;
}

function checkRateLimit(ip: string, nowMs: number): { ok: boolean; retryAfterSec?: number; reason?: string } {
  const state = getOrCreateRateState(ip, nowMs);

  if (state.blockedUntil > nowMs) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((state.blockedUntil - nowMs) / 1000),
      reason: "ip_blocked"
    };
  }

  state.count += 1;
  if (state.count > RATE_LIMIT_MAX_REQUESTS) {
    state.blockedUntil = nowMs + RATE_LIMIT_BLOCK_MS;
    return {
      ok: false,
      retryAfterSec: Math.ceil(RATE_LIMIT_BLOCK_MS / 1000),
      reason: "rate_exceeded"
    };
  }

  return { ok: true };
}

function markInvalidAttempt(ip: string, nowMs: number): void {
  const state = getOrCreateRateState(ip, nowMs);
  state.invalidCount += 1;
  if (state.invalidCount >= RATE_LIMIT_MAX_INVALID) {
    state.blockedUntil = nowMs + RATE_LIMIT_BLOCK_MS;
  }
}

function isClientTimestampFresh(clientAt: string | undefined | null, serverNowMs: number): boolean {
  if (!clientAt) return true;
  const clientMs = new Date(clientAt).getTime();
  if (!Number.isFinite(clientMs)) return false;
  return Math.abs(serverNowMs - clientMs) <= MAX_CLIENT_TIME_DRIFT_MS;
}

async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true;
  const body = new URLSearchParams();
  body.set("secret", TURNSTILE_SECRET);
  body.set("response", token);
  if (ip !== "unknown") {
    body.set("remoteip", ip);
  }

  try {
    const response = await fetch(CAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

async function readUpstreamBody(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text };
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method === "OPTIONS") {
    res.status(204);
    res.setHeader("Allow", "POST, OPTIONS");
    res.end();
    return;
  }

  if (req.method !== "POST") {
    jsonResponse(res, 405, {
      accepted: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Only POST is supported."
    });
    return;
  }

  const nowMs = Date.now();
  const clientIp = parseClientIp(req);
  const rateResult = checkRateLimit(clientIp, nowMs);
  if (!rateResult.ok) {
    if (rateResult.retryAfterSec) {
      res.setHeader("Retry-After", String(rateResult.retryAfterSec));
    }
    jsonResponse(res, 429, {
      accepted: false,
      error: "RATE_LIMITED",
      message: "请求过于频繁，请稍后再试。",
      reason: rateResult.reason
    });
    return;
  }

  const body = parseBody(req.body);
  if (!body || !body.id || !body.createdAt || !isAllowedSource(body.source) || !body.payload) {
    markInvalidAttempt(clientIp, nowMs);
    jsonResponse(res, 400, {
      accepted: false,
      error: "INVALID_REQUEST",
      message: "提交内容不完整，请刷新后重试。"
    });
    return;
  }

  if (normalizeNullableText(body.website)) {
    markInvalidAttempt(clientIp, nowMs);
    jsonResponse(res, 400, {
      accepted: false,
      error: "SPAM_REJECTED",
      message: "请求未通过校验。"
    });
    return;
  }

  if (!isClientTimestampFresh(body.clientAt, nowMs)) {
    markInvalidAttempt(clientIp, nowMs);
    jsonResponse(res, 400, {
      accepted: false,
      error: "STALE_REQUEST",
      message: "提交请求已过期，请刷新页面后重试。"
    });
    return;
  }

  if (!hasMeaningfulPayload(body.payload)) {
    markInvalidAttempt(clientIp, nowMs);
    jsonResponse(res, 422, {
      accepted: false,
      error: "EMPTY_PAYLOAD",
      message: "请至少填写一项候补偏好。"
    });
    return;
  }

  if (TURNSTILE_SECRET) {
    const captchaToken = normalizeNullableText(body.captchaToken);
    if (!captchaToken) {
      markInvalidAttempt(clientIp, nowMs);
      jsonResponse(res, 403, {
        accepted: false,
        error: "CAPTCHA_REQUIRED",
        message: "请完成人机校验后再提交。"
      });
      return;
    }
    const captchaOk = await verifyTurnstileToken(captchaToken, clientIp);
    if (!captchaOk) {
      markInvalidAttempt(clientIp, nowMs);
      jsonResponse(res, 403, {
        accepted: false,
        error: "CAPTCHA_FAILED",
        message: "人机校验失败，请重试。"
      });
      return;
    }
  }

  const upstreamUrl = normalizeNullableText(process.env.WAITLIST_BACKEND_URL);
  if (!upstreamUrl) {
    jsonResponse(res, 503, {
      accepted: false,
      error: "WAITLIST_BACKEND_URL_NOT_CONFIGURED",
      message: "候补后端尚未配置，请联系管理员设置 WAITLIST_BACKEND_URL。"
    });
    return;
  }

  const requestPayload = {
    submissionId: body.id,
    createdAt: body.createdAt,
    source: body.source,
    payload: {
      wantsPhysical: body.payload.wantsPhysical ?? null,
      favoriteScene: body.payload.favoriteScene ?? null,
      favoriteColorExperience: normalizeNullableText(body.payload.favoriteColorExperience),
      joinWaitlist: body.payload.joinWaitlist ?? null,
      contact: normalizeNullableText(body.payload.contact)
    },
    antiAbuse: {
      ip: clientIp,
      userAgent: normalizeNullableText(req.headers?.["user-agent"]),
      requestAt: new Date(nowMs).toISOString()
    },
    site: "colorful-lamb-rolls.cloud",
    receivedAt: new Date(nowMs).toISOString()
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Waitlist-Source": "colorful-lamb-rolls-cloud"
  };

  const backendToken = normalizeNullableText(process.env.WAITLIST_BACKEND_TOKEN);
  if (backendToken) {
    headers.Authorization = `Bearer ${backendToken}`;
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestPayload)
    });
  } catch {
    jsonResponse(res, 502, {
      accepted: false,
      error: "UPSTREAM_UNREACHABLE",
      message: "候补服务暂时不可达，请稍后重试。"
    });
    return;
  }

  const upstreamBody = await readUpstreamBody(upstreamResponse);
  if (!upstreamResponse.ok) {
    const upstreamMessage =
      (upstreamBody?.message as string | undefined) ??
      (upstreamBody?.error as string | undefined) ??
      "候补服务暂时不可用，请稍后重试。";
    jsonResponse(res, 502, {
      accepted: false,
      error: "UPSTREAM_REJECTED",
      message: upstreamMessage
    });
    return;
  }

  const acceptedValue = upstreamBody?.accepted;
  if (acceptedValue === false) {
    jsonResponse(res, 422, {
      accepted: false,
      error: (upstreamBody?.error as string | undefined) ?? "UPSTREAM_DECLINED",
      message: (upstreamBody?.message as string | undefined) ?? "候补提交未通过，请补充信息后重试。"
    });
    return;
  }

  jsonResponse(res, 200, {
    accepted: true,
    submissionId: body.id,
    queuedAt: (upstreamBody?.queuedAt as string | undefined) ?? new Date().toISOString(),
    channel: "backend_relay"
  });
}
