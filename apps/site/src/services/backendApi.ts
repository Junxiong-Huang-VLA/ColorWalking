type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type WaitlistRecord = {
  id: string;
  name: string;
  email: string;
  intent: string;
  source: "home" | "lucky" | "future" | "about" | "premiere" | "unknown";
  status: "filled" | "queued" | "uploading" | "success" | "failed";
  retryCount: number;
  failReason?: string;
  followupRequestedAt?: string;
  followupStatus?: string;
  followupNote?: string;
  submittedAt: string;
  updatedAt: string;
};

export type BridgeOutputRecord = {
  id: string;
  trigger: string;
  payload: Record<string, unknown>;
  createdAt: string;
  deliveryStatus: string;
  deliveryNote?: string;
};

export type E2ERunRecord = {
  id: string;
  suite: string;
  status: "passed" | "failed" | "running";
  reportUrl?: string;
  commitSha?: string;
  runId?: string;
  note?: string;
  createdAt: string;
};

function canUseWindow(): boolean {
  return typeof window !== "undefined";
}

function resolveApiBase(): string {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envBase && envBase.trim()) return envBase.replace(/\/+$/, "");
  if (!canUseWindow()) return "http://127.0.0.1:8787/api";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "http://127.0.0.1:8787/api";
  return "/api";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const base = resolveApiBase();
  const url = `${base}${path}`;
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {})
      }
    });
    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok || payload.ok !== true) {
      const error = typeof payload.error === "string" ? payload.error : `http_${response.status}`;
      return { ok: false, error };
    }
    return { ok: true, data: payload as T };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "network_error" };
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  const base = resolveApiBase();
  const candidateUrls = Array.from(
    new Set([
      `${base}/health`,
      `${base.replace(/\/api$/, "")}/health`
    ])
  );
  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) continue;
      const payload = (await response.json()) as { ok?: boolean };
      if (payload.ok === true) return true;
    } catch {
      // try next candidate
    }
  }
  return false;
}

export async function createWaitlistRemote(input: {
  id?: string;
  name: string;
  email: string;
  intent: string;
  source: "home" | "lucky" | "future" | "about" | "premiere" | "unknown";
  clientAt?: string;
  website?: string;
  captchaToken?: string;
}): Promise<ApiResult<{ waitlist: WaitlistRecord }>> {
  return requestJson<{ waitlist: WaitlistRecord }>("/waitlist", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateWaitlistStatusRemote(input: {
  id: string;
  status: "filled" | "queued" | "uploading" | "success" | "failed";
  failReason?: string;
}): Promise<ApiResult<{ waitlist: WaitlistRecord }>> {
  return requestJson<{ waitlist: WaitlistRecord }>(`/waitlist/${encodeURIComponent(input.id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: input.status,
      failReason: input.failReason
    })
  });
}

export async function retryWaitlistRemote(id: string): Promise<ApiResult<{ waitlist: WaitlistRecord }>> {
  return requestJson<{ waitlist: WaitlistRecord }>(`/waitlist/${encodeURIComponent(id)}/retry`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function requestWaitlistFollowupRemote(input: {
  id: string;
  channel?: "email" | "message";
}): Promise<ApiResult<{ waitlist: WaitlistRecord; followupJob: Record<string, unknown> }>> {
  return requestJson<{ waitlist: WaitlistRecord; followupJob: Record<string, unknown> }>(
    `/waitlist/${encodeURIComponent(input.id)}/followup`,
    {
      method: "POST",
      body: JSON.stringify({ channel: input.channel ?? "email" })
    }
  );
}

export async function pushBridgeOutputRemote(input: {
  id: string;
  trigger: string;
  payload: Record<string, unknown>;
  createdAt: string;
}): Promise<ApiResult<{ output: BridgeOutputRecord }>> {
  return requestJson<{ output: BridgeOutputRecord }>("/bridge/outputs", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function reportE2ERunRemote(input: {
  suite: string;
  status: "passed" | "failed" | "running";
  reportUrl?: string;
  commitSha?: string;
  runId?: string;
  note?: string;
}): Promise<ApiResult<{ run: E2ERunRecord }>> {
  return requestJson<{ run: E2ERunRecord }>("/e2e/runs", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function fetchLatestE2ERunRemote(suite = "investor-demo-baseline"): Promise<ApiResult<{ run: E2ERunRecord | null }>> {
  const params = new URLSearchParams({ suite });
  return requestJson<{ run: E2ERunRecord | null }>(`/e2e/latest?${params.toString()}`, {
    method: "GET"
  });
}
