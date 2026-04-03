import { useEffect, useMemo, useState } from "react";
import {
  buildSurveyQueueSummary,
  isRetryableSubmission,
  retryEtaLabel,
  type SurveyQueueSummary,
  uploadStatusClassName,
  uploadStatusText
} from "./surveyQueueView";
import { sceneLabel, glossaryLabel } from "../../content/glossary";
import type { InteractionScene, UserProfileState } from "../../state/types";

type ExperienceFeedbackCardProps = {
  feedback: UserProfileState["experienceFeedback"];
  submissionCount: number;
  lastSubmittedAt: string | null;
  latestSubmission: UserProfileState["surveySubmissions"][number] | null;
  queueSummary?: SurveyQueueSummary;
  activeScene: InteractionScene;
  dailyColorName: string;
  onSubmit: (patch: Partial<UserProfileState["experienceFeedback"]>) => void;
  onRetryUpload: (submissionId?: string) => void;
};

const SCENE_OPTIONS: InteractionScene[] = ["chat", "comfort", "bedtime", "mood", "color"];

function expectedFollowupText(form: UserProfileState["experienceFeedback"]): string {
  const hasIntent = form.wantsPhysical === "yes" || form.joinWaitlist === "yes" || form.continueUsing === "yes";
  if (!hasIntent) {
    return "你已完成本轮反馈，我们会先用于优化数字生命体验。";
  }
  if (form.contact) {
    return "提交已进入候补队列，预计 24-72 小时内按你留下的联系方式触达。";
  }
  return "提交已进入候补队列，建议补充联系方式以便下一轮邀测触达。";
}

function statusHint(
  latestSubmission: ExperienceFeedbackCardProps["latestSubmission"],
  retryEta: string | null
): { tone: "waiting" | "success" | "error"; text: string } {
  const status = latestSubmission?.status;
  if (status === "upload_success") {
    const token = latestSubmission?.id?.slice(-6) ?? "------";
    return { tone: "success", text: `提交成功，候补编号 #${token}。` };
  }
  if (status === "upload_failed" || status === "upload_permanent_failed") {
    return {
      tone: "error",
      text: retryEta
        ? `网络有波动，意向已保留，${retryEta}。`
        : "网络有波动，意向已保留。可稍后重试，不会丢失。"
    };
  }
  return {
    tone: "waiting",
    text: retryEta ? `已进入发送队列，${retryEta}。` : "已记录到队列，正在处理。"
  };
}

export function ExperienceFeedbackCard({
  feedback,
  submissionCount,
  lastSubmittedAt,
  latestSubmission,
  queueSummary,
  activeScene,
  dailyColorName,
  onSubmit,
  onRetryUpload
}: ExperienceFeedbackCardProps) {
  const [form, setForm] = useState(feedback);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(feedback);
  }, [feedback]);

  const resolvedSummary = queueSummary ?? buildSurveyQueueSummary(latestSubmission ? [latestSubmission] : []);
  const statusClassName = useMemo(() => uploadStatusClassName(latestSubmission?.status), [latestSubmission?.status]);
  const retryEta = retryEtaLabel(latestSubmission?.nextRetryAt ?? resolvedSummary.nextRetryAt);
  const canRetry = isRetryableSubmission(latestSubmission);
  const followupText = expectedFollowupText(form);
  const hint = statusHint(latestSubmission, retryEta);
  const showRecallHint = form.joinWaitlist === "yes" && !form.contact;

  return (
    <article className="card feedback-card" data-testid="experience-feedback-card">
      <h2>加入候补名单</h2>
      <p className="muted">10-20 秒完成。提交后先进入数字生命体验验证队列，再按意向推进实体版触达。</p>

      <div className="survey-status-row" data-testid="survey-status-row">
        <span className="survey-status-pill saved" data-testid="survey-pill-saved">
          本地已记录
        </span>
        <span className={`survey-status-pill ${statusClassName}`} data-testid={`survey-pill-${statusClassName}`}>
          {uploadStatusText(latestSubmission?.status)}
        </span>
        {retryEta ? (
          <span className="survey-status-pill pending" data-testid="survey-pill-queued">
            {retryEta}
          </span>
        ) : null}
        {canRetry ? (
          <span className="survey-status-pill retryable" data-testid="survey-pill-retryable">
            可重试
          </span>
        ) : null}
        {canRetry ? (
          <button type="button" className="survey-retry-btn" onClick={() => onRetryUpload(latestSubmission?.id)}>
            立即重试
          </button>
        ) : null}
      </div>

      <p className="muted survey-queue-summary" data-testid="survey-queue-summary">
        队列状态：待处理 {resolvedSummary.pending} · 已成功 {resolvedSummary.success} · 失败 {resolvedSummary.transientFailed + resolvedSummary.permanentFailed}
      </p>

      <p className="muted">
        已提交 {submissionCount} 份{lastSubmittedAt ? ` · 最近一次 ${new Date(lastSubmittedAt).toLocaleString()}` : ""}
      </p>

      <p className={`survey-state-hint ${hint.tone}`}>{hint.text}</p>
      {latestSubmission?.lastError ? <p className="muted">轻提示：{latestSubmission.lastError}</p> : null}

      <label>
        <span>是否加入候补名单？</span>
        <select
          data-testid="waitlist-join-select"
          value={form.joinWaitlist ?? ""}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              joinWaitlist: (event.target.value || null) as "yes" | "no" | null
            }))
          }
        >
          <option value="">先不选择</option>
          <option value="yes">愿意加入</option>
          <option value="no">暂不加入</option>
        </select>
      </label>

      <label>
        <span>联系方式（建议填写）</span>
        <input
          data-testid="waitlist-contact-input"
          value={form.contact ?? ""}
          placeholder="微信 / 邮箱 / 手机（任选其一）"
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              contact: event.target.value.trim() ? event.target.value : null
            }))
          }
        />
      </label>

      <label>
        <span>是否想体验实体版？</span>
        <select
          data-testid="waitlist-physical-select"
          value={form.wantsPhysical ?? ""}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              wantsPhysical: (event.target.value || null) as "yes" | "no" | "unsure" | null
            }))
          }
        >
          <option value="">先不选择</option>
          <option value="yes">想体验</option>
          <option value="unsure">还在考虑</option>
          <option value="no">暂时不需要</option>
        </select>
      </label>

      <label>
        <span>你最喜欢哪个{glossaryLabel("scene")}？</span>
        <select
          data-testid="waitlist-favorite-scene-select"
          value={form.favoriteScene ?? activeScene}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              favoriteScene: event.target.value as InteractionScene
            }))
          }
        >
          {SCENE_OPTIONS.map((scene) => (
            <option key={scene} value={scene}>
              {sceneLabel(scene)}场景
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>想对小羊卷说的一句话（可选）</span>
        <input
          data-testid="waitlist-note-input"
          value={form.favoriteColorExperience ?? ""}
          placeholder={`例如：今天的${dailyColorName}让我很放松`}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              favoriteColorExperience: event.target.value
            }))
          }
        />
      </label>

      <button
        type="button"
        className="primary-btn"
        data-testid="waitlist-submit"
        onClick={() => {
          onSubmit({
            ...form,
            favoriteScene: form.favoriteScene ?? activeScene,
            continueUsing: form.continueUsing ?? "yes"
          });
          setSaved(true);
          window.setTimeout(() => setSaved(false), 4200);
        }}
      >
        提交候补意向
      </button>

      {saved ? <p className="form-success">已提交：你的意向已写入队列，不会丢失。</p> : null}
      {saved ? <p className="muted followup-hint">{followupText}</p> : null}
      {showRecallHint ? <p className="survey-recall-hint">补充联系方式后，可优先收到下一轮邀测通知。</p> : null}
      <p className="muted">说明：当前为数字生命体验验证阶段，实体版会继承同一只小羊卷的关系状态。</p>
    </article>
  );
}
