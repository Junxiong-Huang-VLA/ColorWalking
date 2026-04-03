export const SURVEY_UPLOAD_QUEUE_CONFIG = {
  maxAttempts: 3,
  retryBackoffMs: [1500, 5200],
  startupRecoveryDelayMs: 600,
  backgroundScanIntervalMs: 6000,
  immediateRecoveryThrottleMs: 1200,
  startupBatchSize: 3,
  stalePendingMs: 20000
} as const;

export function isSurveyPermanentFailure(attemptCount: number): boolean {
  return attemptCount >= SURVEY_UPLOAD_QUEUE_CONFIG.maxAttempts;
}

export function surveyRetryDelayMsForFailure(failedAttemptCount: number): number | null {
  if (isSurveyPermanentFailure(failedAttemptCount)) return null;
  const index = Math.max(0, failedAttemptCount - 1);
  const fallback = SURVEY_UPLOAD_QUEUE_CONFIG.retryBackoffMs[SURVEY_UPLOAD_QUEUE_CONFIG.retryBackoffMs.length - 1] ?? 3000;
  return SURVEY_UPLOAD_QUEUE_CONFIG.retryBackoffMs[index] ?? fallback;
}
