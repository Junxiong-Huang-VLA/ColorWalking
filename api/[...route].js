const RATE_LIMIT_STATE = new Map();

function envInt(name, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const raw = process.env[name];
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeBaseUrl(value) {
  if (!value) return "";
  return String(value).trim().replace(/\/+$/, "");
}

function resolveApiBase() {
  const base = normalizeBaseUrl(process.env.WAITLIST_BACKEND_URL);
  if (!base) return "";
  if (base.endsWith("/api")) return base;
  return `${base}/api`;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded) && forwarded[0]) return String(forwarded[0]).split(",")[0].trim();
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) return realIp.trim();
  const cfIp = req.headers["cf-connecting-ip"];
  if (typeof cfIp === "string" && cfIp.trim()) return cfIp.trim();
  return "unknown";
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === "GET" || req.method === "HEAD") {
      resolve(null);
      return;
    }
    if (req.body !== undefined && req.body !== null) {
      resolve(req.body);
      return;
    }
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      if (!chunks.length) {
        resolve(null);
        return;
      }
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

function parseJsonBody(rawBody) {
  if (!rawBody) return {};
  if (typeof rawBody === "object") return rawBody;
  if (typeof rawBody !== "string") return {};
  try {
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
}

function checkRateLimit(ip) {
  const windowMs = envInt("WAITLIST_RATE_LIMIT_WINDOW_MS", 60_000, 1000, 3_600_000);
  const maxCount = envInt("WAITLIST_RATE_LIMIT_MAX", 8, 1, 1000);
  const blockMs = envInt("WAITLIST_RATE_LIMIT_BLOCK_MS", 10 * 60_000, 1000, 24 * 60 * 60 * 1000);
  const now = Date.now();

  const current = RATE_LIMIT_STATE.get(ip) ?? {
    windowStartedAt: now,
    count: 0,
    blockedUntil: 0
  };

  if (current.blockedUntil > now) {
    return { ok: false, status: 429, error: "rate_limited_temporarily", retryAfterSeconds: Math.ceil((current.blockedUntil - now) / 1000) };
  }

  if (now - current.windowStartedAt > windowMs) {
    current.windowStartedAt = now;
    current.count = 0;
  }

  current.count += 1;
  if (current.count > maxCount) {
    current.blockedUntil = now + blockMs;
    RATE_LIMIT_STATE.set(ip, current);
    return { ok: false, status: 429, error: "rate_limited_temporarily", retryAfterSeconds: Math.ceil(blockMs / 1000) };
  }

  RATE_LIMIT_STATE.set(ip, current);
  return { ok: true };
}

function validateClientTimestamp(clientAt) {
  if (!clientAt) return { ok: true };
  const time = Date.parse(String(clientAt));
  if (!Number.isFinite(time)) return { ok: false, status: 400, error: "invalid_client_timestamp" };
  const now = Date.now();
  const maxAge = envInt("WAITLIST_CLIENT_AT_MAX_AGE_MS", 2 * 60 * 60 * 1000, 60_000, 7 * 24 * 60 * 60 * 1000);
  const futureSkew = envInt("WAITLIST_CLIENT_AT_MAX_FUTURE_MS", 5 * 60 * 1000, 0, 60 * 60 * 1000);
  if (time < now - maxAge || time > now + futureSkew) {
    return { ok: false, status: 400, error: "stale_client_timestamp" };
  }
  return { ok: true };
}

function isLikelyEmail(value) {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function verifyTurnstileIfNeeded({ token, ip }) {
  const secret = normalizeBaseUrl(process.env.WAITLIST_TURNSTILE_SECRET);
  const required = process.env.WAITLIST_TURNSTILE_REQUIRED === "1";
  if (!secret) return { ok: true };
  if (!token) return required ? { ok: false, status: 400, error: "captcha_required" } : { ok: true };

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", String(token));
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  try {
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    if (!resp.ok) return { ok: false, status: 502, error: "captcha_verify_unavailable" };
    const json = await resp.json();
    if (json && json.success === true) return { ok: true };
    return { ok: false, status: 400, error: "captcha_verify_failed" };
  } catch {
    return { ok: false, status: 502, error: "captcha_verify_unavailable" };
  }
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function sanitizeWaitlistBody(body) {
  return {
    id: typeof body.id === "string" && body.id.trim() ? body.id.trim() : undefined,
    name: typeof body.name === "string" ? body.name.trim() : "",
    email: typeof body.email === "string" ? body.email.trim().toLowerCase() : "",
    intent: typeof body.intent === "string" ? body.intent.trim() : "",
    source: typeof body.source === "string" ? body.source.trim() : "unknown"
  };
}

export default async function handler(req, res) {
  const apiBase = resolveApiBase();
  if (!apiBase) {
    json(res, 503, {
      ok: false,
      error: "waitlist_backend_url_not_configured",
      detail: "Set WAITLIST_BACKEND_URL in Vercel environment variables."
    });
    return;
  }

  const route = Array.isArray(req.query.route) ? req.query.route : [req.query.route].filter(Boolean);
  const routePath = route.map((item) => String(item).replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
  if (!routePath) {
    json(res, 404, { ok: false, error: "api_route_not_found" });
    return;
  }

  const requestUrl = new URL(req.url, "https://local.proxy");
  const targetUrl = `${apiBase}/${routePath}${requestUrl.search || ""}`;
  const rawBody = await readBody(req);
  const parsedBody = parseJsonBody(rawBody);
  const isWaitlistCreate = req.method === "POST" && routePath === "waitlist";
  const clientIp = getClientIp(req);
  let forwardBody = parsedBody;

  if (isWaitlistCreate) {
    const rate = checkRateLimit(clientIp);
    if (!rate.ok) {
      if (rate.retryAfterSeconds) res.setHeader("retry-after", String(rate.retryAfterSeconds));
      json(res, rate.status, { ok: false, error: rate.error, message: "提交过于频繁，请稍后再试。" });
      return;
    }

    if (typeof parsedBody.website === "string" && parsedBody.website.trim()) {
      json(res, 200, { ok: true, ignored: true, reason: "honeypot" });
      return;
    }

    const tsCheck = validateClientTimestamp(parsedBody.clientAt);
    if (!tsCheck.ok) {
      json(res, tsCheck.status, { ok: false, error: tsCheck.error, message: "提交时间无效，请刷新后重试。" });
      return;
    }

    const captcha = await verifyTurnstileIfNeeded({
      token: parsedBody.captchaToken ?? parsedBody.turnstileToken ?? req.headers["x-waitlist-captcha-token"],
      ip: clientIp
    });
    if (!captcha.ok) {
      json(res, captcha.status, { ok: false, error: captcha.error, message: "人机校验失败，请重试。" });
      return;
    }

    const sanitized = sanitizeWaitlistBody(parsedBody);
    if (!sanitized.name || !sanitized.email || !sanitized.intent || !isLikelyEmail(sanitized.email)) {
      json(res, 400, { ok: false, error: "invalid_waitlist_payload", message: "请填写有效称呼、邮箱和意向。" });
      return;
    }
    forwardBody = sanitized;
  }

  const headers = {
    accept: "application/json",
    "content-type": "application/json"
  };
  const backendToken = normalizeBaseUrl(process.env.WAITLIST_BACKEND_TOKEN);
  if (backendToken) headers.authorization = `Bearer ${backendToken}`;
  if (clientIp && clientIp !== "unknown") headers["x-forwarded-for"] = clientIp;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : JSON.stringify(forwardBody ?? {})
    });
    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";
    res.statusCode = upstream.status;
    res.setHeader("content-type", contentType);
    res.end(text);
  } catch (error) {
    json(res, 502, {
      ok: false,
      error: "waitlist_backend_unreachable",
      message: "候补服务暂时不可用，请稍后重试。",
      detail: error instanceof Error ? error.message : "unknown_error"
    });
  }
}
