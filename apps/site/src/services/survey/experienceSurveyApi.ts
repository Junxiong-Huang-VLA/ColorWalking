import type { ExperienceSurveyPayload } from "../../state/types";

const DEFAULT_WAITLIST_ENDPOINT = "/api/waitlist";
const REQUEST_TIMEOUT_MS = 8000;

export type ExperienceSurveyDraft = {
  id: string;
  createdAt: string;
  source: "experience_feedback_card" | "demo_mode" | "milestone";
  payload: ExperienceSurveyPayload;
};

type WaitlistSubmitResult = {
  accepted: boolean;
  queuedAt?: string;
  channel?: string;
  submissionId?: string;
  message?: string;
  error?: string;
};

export type ExperienceSurveySubmitResult = {
  accepted: true;
  queuedAt: string;
  channel: "waitlist_api" | "backend_relay" | "custom_endpoint";
  submissionId: string;
};

function hasMeaningfulPayload(payload: ExperienceSurveyPayload): boolean {
  return Boolean(
    payload.wantsPhysical ||
      payload.favoriteScene ||
      (payload.favoriteColorExperience && payload.favoriteColorExperience.trim()) ||
      payload.joinWaitlist ||
      (payload.contact && payload.contact.trim())
  );
}

function resolveWaitlistEndpoint(): string {
  const runtimeGlobal =
    typeof window !== "undefined" ? String((window as { __WAITLIST_API_ENDPOINT__?: string }).__WAITLIST_API_ENDPOINT__ ?? "").trim() : "";
  if (runtimeGlobal) return runtimeGlobal;
  const nodeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const processEnv = String(nodeEnv?.VITE_WAITLIST_API_ENDPOINT ?? "").trim();
  return processEnv || DEFAULT_WAITLIST_ENDPOINT;
}

function resolveChannel(endpoint: string, channel: string | undefined): ExperienceSurveySubmitResult["channel"] {
  if (channel === "waitlist_api" || channel === "backend_relay" || channel === "custom_endpoint") {
    return channel;
  }
  return endpoint === DEFAULT_WAITLIST_ENDPOINT ? "waitlist_api" : "custom_endpoint";
}

function toErrorMessage(response: Response, body: WaitlistSubmitResult | null): string {
  if (body?.message) return body.message;
  if (body?.error) return body.error;
  if (response.status >= 500) return "候补服务暂时不可用，请稍后重试。";
  if (response.status >= 400) return "提交信息未通过校验，请补充后重试。";
  return "候补意向提交失败，请稍后重试。";
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timer);
  }
}

async function parseResult(response: Response): Promise<WaitlistSubmitResult | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as WaitlistSubmitResult;
  } catch {
    return { accepted: false, message: text };
  }
}

export async function submitExperienceSurvey(draft: ExperienceSurveyDraft): Promise<ExperienceSurveySubmitResult> {
  if (!hasMeaningfulPayload(draft.payload)) {
    throw new Error("请至少填写一项候补偏好后再提交。");
  }

  const endpoint = resolveWaitlistEndpoint();
  const runtimeCaptchaToken =
    typeof window !== "undefined"
      ? String((window as { __WAITLIST_CAPTCHA_TOKEN__?: string }).__WAITLIST_CAPTCHA_TOKEN__ ?? "").trim() || null
      : null;

  let response: Response;
  try {
    response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: draft.id,
        createdAt: draft.createdAt,
        source: draft.source,
        payload: draft.payload,
        clientAt: new Date().toISOString(),
        website: "",
        captchaToken: runtimeCaptchaToken
      })
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("候补服务响应超时，请稍后重试。");
    }
    throw new Error("网络连接不稳定，意向已本地保留。");
  }

  const body = await parseResult(response);
  if (!response.ok || body?.accepted !== true) {
    throw new Error(toErrorMessage(response, body));
  }

  return {
    accepted: true,
    queuedAt: body.queuedAt ?? new Date().toISOString(),
    channel: resolveChannel(endpoint, body.channel),
    submissionId: body.submissionId ?? draft.id
  };
}

// Backward-compat export to keep older call sites functional during phased rollout.
export const submitExperienceSurveyPlaceholder = submitExperienceSurvey;
