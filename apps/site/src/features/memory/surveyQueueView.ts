import type { ExperienceSurveySubmission, ExperienceSurveyUploadStatus } from "../../state/types";

export type SurveyQueueSummary = {
  total: number;
  pending: number;
  retryScheduled: number;
  transientFailed: number;
  permanentFailed: number;
  success: number;
  nextRetryAt: string | null;
};

export function uploadStatusText(status: ExperienceSurveyUploadStatus | undefined): string {
  if (status === "upload_pending") return "上传中";
  if (status === "upload_failed") return "等待重试";
  if (status === "upload_permanent_failed") return "需手动重试";
  if (status === "upload_success") return "已同步";
  return "已保存";
}

export function uploadStatusClassName(status: ExperienceSurveyUploadStatus | undefined): string {
  if (status === "upload_pending") return "pending";
  if (status === "upload_failed") return "failed";
  if (status === "upload_permanent_failed") return "permanent";
  if (status === "upload_success") return "success";
  return "saved";
}

export function isRetryableSubmission(submission: ExperienceSurveySubmission | null): boolean {
  if (!submission) return false;
  return (
    submission.status === "saved_local" ||
    submission.status === "upload_failed" ||
    submission.status === "upload_permanent_failed"
  );
}

export function retryEtaLabel(nextRetryAt: string | null, nowMs = Date.now()): string | null {
  if (!nextRetryAt) return null;
  const etaMs = new Date(nextRetryAt).getTime() - nowMs;
  if (!Number.isFinite(etaMs) || etaMs <= 0) return "即将自动重试";
  const sec = Math.ceil(etaMs / 1000);
  return `约 ${sec}s 后自动重试`;
}

export function buildSurveyQueueSummary(submissions: ExperienceSurveySubmission[]): SurveyQueueSummary {
  let nextRetryAt: string | null = null;
  for (const item of submissions) {
    if (!item.nextRetryAt) continue;
    if (!nextRetryAt || new Date(item.nextRetryAt).getTime() < new Date(nextRetryAt).getTime()) {
      nextRetryAt = item.nextRetryAt;
    }
  }

  const retryScheduled = submissions.filter((item) => item.status === "upload_failed" && Boolean(item.nextRetryAt)).length;

  return {
    total: submissions.length,
    pending:
      submissions.filter((item) => item.status === "upload_pending").length +
      retryScheduled,
    retryScheduled,
    transientFailed: submissions.filter((item) => item.status === "upload_failed").length,
    permanentFailed: submissions.filter((item) => item.status === "upload_permanent_failed").length,
    success: submissions.filter((item) => item.status === "upload_success").length,
    nextRetryAt
  };
}
