import { useCallback, useEffect, useRef } from "react";
import { SURVEY_UPLOAD_QUEUE_CONFIG, surveyRetryDelayMsForFailure } from "../../config/surveyUploadQueue";
import { submitExperienceSurvey } from "../../services/survey/experienceSurveyApi";
import { dayKeyOf } from "../../utils/time";
import { useAppSelector, useAppStore } from "../store";
import type { AppRootState, ExperienceSurveyPayload, ExperienceSurveySubmission } from "../types";

export const userSelectors = {
  profile: (state: AppRootState) => state.userProfile,
  nickname: (state: AppRootState) => state.userProfile.nickname,
  timezone: (state: AppRootState) => state.userProfile.timezone,
  preferredInputMode: (state: AppRootState) => state.userProfile.preferredInputMode,
  gentleModeEnabled: (state: AppRootState) => state.userProfile.gentleModeEnabled
};

function toSurveyPayload(feedback: AppRootState["userProfile"]["experienceFeedback"]): ExperienceSurveyPayload {
  return {
    wantsPhysical: feedback.wantsPhysical,
    favoriteScene: feedback.favoriteScene,
    favoriteColorExperience: feedback.favoriteColorExperience,
    joinWaitlist: feedback.joinWaitlist,
    contact: feedback.contact
  };
}

function isSameSurveyPayload(left: ExperienceSurveyPayload | null | undefined, right: ExperienceSurveyPayload): boolean {
  if (!left) return false;
  return (
    left.wantsPhysical === right.wantsPhysical &&
    left.favoriteScene === right.favoriteScene &&
    left.favoriteColorExperience === right.favoriteColorExperience &&
    left.joinWaitlist === right.joinWaitlist &&
    left.contact === right.contact
  );
}

function shouldUploadAgain(submission: ExperienceSurveySubmission): boolean {
  return submission.status !== "upload_success";
}

function isOnlineNow(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

type RecoverableSurveySelectionOptions = {
  limit: number;
  nowMs?: number;
  stalePendingMs: number;
  inflightIds?: Set<string>;
  isOnline?: boolean;
};

export function selectRecoverableSurveySubmissions(
  submissions: ExperienceSurveySubmission[],
  options: RecoverableSurveySelectionOptions
): ExperienceSurveySubmission[] {
  const nowMs = options.nowMs ?? Date.now();
  const inflightIds = options.inflightIds ?? new Set<string>();
  if (options.isOnline === false) return [];

  return submissions
    .filter((item) => item.status !== "upload_success" && item.status !== "upload_permanent_failed")
    .filter((item) => {
      if (inflightIds.has(item.id)) return false;
      if (item.status === "saved_local") return true;
      if (item.status === "upload_failed") {
        if (!item.nextRetryAt) return true;
        return new Date(item.nextRetryAt).getTime() <= nowMs;
      }
      if (item.status === "upload_pending") {
        if (!item.lastAttemptAt) return true;
        return nowMs - new Date(item.lastAttemptAt).getTime() >= options.stalePendingMs;
      }
      return false;
    })
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
    .slice(0, Math.max(1, options.limit));
}

function makeSubmission(
  payload: ExperienceSurveyPayload,
  nowIso: string,
  source: ExperienceSurveySubmission["source"] = "experience_feedback_card"
): ExperienceSurveySubmission {
  return {
    id: `survey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: nowIso,
    source,
    status: "saved_local",
    attemptCount: 0,
    lastAttemptAt: null,
    uploadedAt: null,
    nextRetryAt: null,
    permanentFailedAt: null,
    lastError: null,
    payload
  };
}

export function useUserStore() {
  const profile = useAppSelector(userSelectors.profile);
  const { dispatch } = useAppStore();
  const profileRef = useRef(profile);
  const retryTimersRef = useRef<Record<string, number>>({});
  const inflightRef = useRef<Record<string, boolean>>({});
  const startupRecoveryTimerRef = useRef<number | null>(null);
  const backgroundRecoveryTimerRef = useRef<number | null>(null);
  const immediateRecoveryLastRunRef = useRef(0);
  const recoveryBootstrappedRef = useRef(false);
  const uploadRunnerRef = useRef<(submission: ExperienceSurveySubmission) => void>(() => undefined);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const clearRetryTimer = useCallback((submissionId: string) => {
    const timer = retryTimersRef.current[submissionId];
    if (!timer) return;
    window.clearTimeout(timer);
    delete retryTimersRef.current[submissionId];
  }, []);

  const queueAutoRetry = useCallback(
    (submissionId: string, nextRetryAt: string | null) => {
      clearRetryTimer(submissionId);
      if (!nextRetryAt) return;
      const delay = Math.max(0, new Date(nextRetryAt).getTime() - Date.now());
      retryTimersRef.current[submissionId] = window.setTimeout(() => {
        delete retryTimersRef.current[submissionId];
        const latest = profileRef.current.surveySubmissions.find((item) => item.id === submissionId);
        if (!latest) return;
        if (latest.status === "upload_success" || latest.status === "upload_permanent_failed") return;
        uploadRunnerRef.current(latest);
      }, delay);
    },
    [clearRetryTimer]
  );

  const uploadSubmission = useCallback(
    (submission: ExperienceSurveySubmission) => {
      if (inflightRef.current[submission.id]) return;
      inflightRef.current[submission.id] = true;
      clearRetryTimer(submission.id);

      const now = new Date().toISOString();
      dispatch({
        type: "USER_SURVEY_UPLOAD_STARTED",
        submissionId: submission.id,
        nowIso: now
      });

      void submitExperienceSurvey({
        id: submission.id,
        createdAt: submission.createdAt,
        source: submission.source,
        payload: submission.payload
      })
        .then(() => {
          clearRetryTimer(submission.id);
          dispatch({
            type: "USER_SURVEY_UPLOAD_SUCCEEDED",
            submissionId: submission.id,
            nowIso: new Date().toISOString()
          });
        })
        .catch((error: unknown) => {
          const nowIso = new Date().toISOString();
          const failedAttemptCount = submission.attemptCount + 1;
          const retryDelayMs = surveyRetryDelayMsForFailure(failedAttemptCount);
          const nextRetryAt = retryDelayMs === null ? null : new Date(Date.now() + retryDelayMs).toISOString();
          const permanent = retryDelayMs === null;
          const message = error instanceof Error ? error.message : "waitlist upload unavailable";
          dispatch({
            type: "USER_SURVEY_UPLOAD_FAILED",
            submissionId: submission.id,
            nowIso,
            error: message,
            nextRetryAt,
            permanent
          });
          if (!permanent && nextRetryAt) {
            queueAutoRetry(submission.id, nextRetryAt);
          }
        })
        .finally(() => {
          delete inflightRef.current[submission.id];
        });
    },
    [clearRetryTimer, dispatch, queueAutoRetry]
  );

  uploadRunnerRef.current = uploadSubmission;

  const recoverableSubmissions = useCallback((limit: number): ExperienceSurveySubmission[] => {
    const inflightIds = new Set(
      Object.keys(inflightRef.current).filter((submissionId) => Boolean(inflightRef.current[submissionId]))
    );
    return selectRecoverableSurveySubmissions(profileRef.current.surveySubmissions, {
      limit,
      nowMs: Date.now(),
      stalePendingMs: SURVEY_UPLOAD_QUEUE_CONFIG.stalePendingMs,
      inflightIds,
      isOnline: isOnlineNow()
    });
  }, []);

  const runRecoveryBatch = useCallback(
    (limit: number) => {
      const targets = recoverableSubmissions(limit);
      for (const item of targets) {
        uploadRunnerRef.current(item);
      }
    },
    [recoverableSubmissions]
  );

  const runImmediateRecovery = useCallback(
    (limit = SURVEY_UPLOAD_QUEUE_CONFIG.startupBatchSize) => {
      const nowMs = Date.now();
      if (
        nowMs - immediateRecoveryLastRunRef.current <
        SURVEY_UPLOAD_QUEUE_CONFIG.immediateRecoveryThrottleMs
      ) {
        return;
      }
      immediateRecoveryLastRunRef.current = nowMs;
      runRecoveryBatch(limit);
    },
    [runRecoveryBatch]
  );

  useEffect(() => {
    const keepTimerIds = new Set<string>();
    for (const submission of profile.surveySubmissions) {
      const shouldSchedule = submission.status === "upload_failed" && Boolean(submission.nextRetryAt);
      if (!shouldSchedule) {
        clearRetryTimer(submission.id);
        continue;
      }
      keepTimerIds.add(submission.id);
      if (!retryTimersRef.current[submission.id]) {
        queueAutoRetry(submission.id, submission.nextRetryAt);
      }
    }

    for (const submissionId of Object.keys(retryTimersRef.current)) {
      if (!keepTimerIds.has(submissionId)) {
        clearRetryTimer(submissionId);
      }
    }
  }, [clearRetryTimer, profile.surveySubmissions, queueAutoRetry]);

  useEffect(() => {
    if (recoveryBootstrappedRef.current) return;
    recoveryBootstrappedRef.current = true;
    startupRecoveryTimerRef.current = window.setTimeout(() => {
      runRecoveryBatch(SURVEY_UPLOAD_QUEUE_CONFIG.startupBatchSize);
    }, SURVEY_UPLOAD_QUEUE_CONFIG.startupRecoveryDelayMs);
  }, [runRecoveryBatch]);

  useEffect(() => {
    runRecoveryBatch(1);
    backgroundRecoveryTimerRef.current = window.setInterval(() => {
      runRecoveryBatch(1);
    }, SURVEY_UPLOAD_QUEUE_CONFIG.backgroundScanIntervalMs);

    return () => {
      if (backgroundRecoveryTimerRef.current) {
        window.clearInterval(backgroundRecoveryTimerRef.current);
        backgroundRecoveryTimerRef.current = null;
      }
    };
  }, [runRecoveryBatch]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      runImmediateRecovery();
    };
    const onOnline = () => {
      runImmediateRecovery();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    };
  }, [runImmediateRecovery]);

  useEffect(() => {
    return () => {
      Object.values(retryTimersRef.current).forEach((timer) => window.clearTimeout(timer));
      retryTimersRef.current = {};
      if (startupRecoveryTimerRef.current) {
        window.clearTimeout(startupRecoveryTimerRef.current);
        startupRecoveryTimerRef.current = null;
      }
      if (backgroundRecoveryTimerRef.current) {
        window.clearInterval(backgroundRecoveryTimerRef.current);
        backgroundRecoveryTimerRef.current = null;
      }
      inflightRef.current = {};
    };
  }, []);

  const triggerMilestonePlaceholders = useCallback(
    (payload: ExperienceSurveyPayload, nowIso: string) => {
      const dayKey = dayKeyOf(nowIso);
      if (payload.joinWaitlist === "yes" || payload.wantsPhysical === "yes") {
        dispatch({
          type: "MILESTONE_PLACEHOLDER_TRIGGERED",
          nowIso,
          dayKey,
          milestoneId: "reservation-triggered-v1",
          milestoneType: "reservation_triggered",
          title: "预约意向已记录",
          desc: "你愿意了解实体版，已进入预约前占位流程。",
          scene: payload.favoriteScene ?? undefined
        });
      }
      if (payload.favoriteScene || payload.favoriteColorExperience) {
        const sceneKey = payload.favoriteScene ?? "general";
        dispatch({
          type: "MILESTONE_PLACEHOLDER_TRIGGERED",
          nowIso,
          dayKey,
          milestoneId: `campaign-triggered-${sceneKey}`,
          milestoneType: "campaign_triggered",
          title: "活动触达占位",
          desc: "已记录你的偏好，后续可用于活动触达与提醒。",
          scene: payload.favoriteScene ?? undefined
        });
      }
    },
    [dispatch]
  );

  return {
    profile,
    actions: {
      updateNickname: (nickname: string) => {
        dispatch({ type: "USER_PROFILE_UPDATED", patch: { nickname } });
      },
      updateTimezone: (timezone: string) => {
        dispatch({ type: "USER_PROFILE_UPDATED", patch: { timezone } });
      },
      setInputMode: (mode: "text" | "voice") => {
        dispatch({ type: "USER_INPUT_MODE_CHANGED", mode });
      },
      updateExperienceFeedback: (patch: Partial<AppRootState["userProfile"]["experienceFeedback"]>) => {
        const nowIso = new Date().toISOString();
        const nextFeedback = {
          ...profile.experienceFeedback,
          ...patch,
          updatedAt: nowIso
        };
        const hasWaitlistIntent =
          patch.joinWaitlist === "yes" ||
          patch.wantsPhysical === "yes" ||
          patch.continueUsing === "yes" ||
          typeof patch.contact === "string";
        const payload = toSurveyPayload(nextFeedback);
        const latest = profile.surveySubmissions[0] ?? null;
        const shouldAppendSubmission = !isSameSurveyPayload(latest?.payload, payload);

        const submission = shouldAppendSubmission ? makeSubmission(payload, nowIso) : latest;
        const nextSurveySubmissions =
          submission && shouldAppendSubmission
            ? [submission, ...profile.surveySubmissions].slice(0, 30)
            : profile.surveySubmissions;

        dispatch({
          type: "USER_PROFILE_UPDATED",
          patch: {
            experienceFeedback: nextFeedback,
            surveySubmissions: nextSurveySubmissions
          }
        });

        if (hasWaitlistIntent) {
          dispatch({
            type: "PRODUCT_EVENT_TRACKED",
            nowIso,
            eventName: "waitlist_cta_clicked",
            source: "waitlist_page",
            status: "started",
            payload: {
              wantsPhysical: nextFeedback.wantsPhysical,
              joinWaitlist: nextFeedback.joinWaitlist,
              continueUsing: nextFeedback.continueUsing
            }
          });
        }

        if (shouldAppendSubmission) {
          triggerMilestonePlaceholders(payload, nowIso);
        }

        if (submission && shouldUploadAgain(submission)) {
          uploadSubmission(submission);
        }
      },
      retrySurveyUpload: (submissionId?: string) => {
        const target =
          (submissionId
            ? profile.surveySubmissions.find((item) => item.id === submissionId)
            : profile.surveySubmissions.find(
                (item) => item.status === "upload_failed" || item.status === "upload_permanent_failed"
              )) ??
          profile.surveySubmissions.find((item) => item.status === "saved_local");
        if (!target) return;
        clearRetryTimer(target.id);
        uploadSubmission(target);
      }
    }
  };
}
