import { useMemo, useState } from "react";
import { ExperienceFeedbackCard } from "../../features/memory/ExperienceFeedbackCard";
import { buildSurveyQueueSummary, uploadStatusText } from "../../features/memory/surveyQueueView";
import { SheepAvatarStage } from "../../features/sheep/SheepAvatarStage";
import { sceneLabel } from "../../content/glossary";
import type {
  ExperienceSurveySubmission,
  InteractionScene,
  SheepEmotionState,
  SheepVisualState,
  UserProfileState
} from "../../state/types";

type ValidationPageProps = {
  userProfile: UserProfileState;
  activeScene: InteractionScene;
  dailyColorName: string;
  sheepEmotionState: SheepEmotionState;
  sheepVisualState: SheepVisualState;
  onGoHome: () => void;
  onSubmitExperienceFeedback: (patch: Partial<UserProfileState["experienceFeedback"]>) => void;
  onRetrySurveyUpload: (submissionId?: string) => void;
  focusMode?: boolean;
  showOpsData?: boolean;
};

function followupItems() {
  return [
    "下一轮数字生命体验开放通知（按你填写的联系方式触达）",
    "幸运色陪伴功能的新版本邀测",
    "实体版小羊卷的规划进展与小范围内测消息"
  ];
}

function statusSummaryText(summary: ReturnType<typeof buildSurveyQueueSummary>): string {
  if (summary.success > 0) {
    return `已成功同步 ${summary.success} 份意向，后续会按优先队列触达。`;
  }
  if (summary.pending > 0) {
    return `有 ${summary.pending} 份意向在发送队列中，网络恢复后会自动重试。`;
  }
  if (summary.transientFailed + summary.permanentFailed > 0) {
    return "存在发送失败记录，但意向已保留，可在卡片里一键重试。";
  }
  return "提交后会先本地保存，再进入发送队列，不会因网络波动丢失。";
}

function yesNoText(value: "yes" | "no" | "unsure" | null): string {
  if (value === "yes") return "是";
  if (value === "no") return "否";
  if (value === "unsure") return "考虑中";
  return "-";
}

function waitlistText(value: "yes" | "no" | null): string {
  if (value === "yes") return "愿意";
  if (value === "no") return "暂不";
  return "-";
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(submissions: ExperienceSurveySubmission[]): string {
  const header = ["created_at", "status", "favorite_scene", "join_waitlist", "wants_physical", "contact", "source"];
  const rows = submissions.map((item) => [
    item.createdAt,
    item.status,
    item.payload.favoriteScene ?? "",
    item.payload.joinWaitlist ?? "",
    item.payload.wantsPhysical ?? "",
    item.payload.contact ?? "",
    item.source
  ]);
  const lines = [header, ...rows].map((line) => line.map((cell) => csvEscape(String(cell ?? ""))).join(","));
  return lines.join("\n");
}

export function ValidationPage({
  userProfile,
  activeScene,
  dailyColorName,
  sheepEmotionState,
  sheepVisualState,
  onGoHome,
  onSubmitExperienceFeedback,
  onRetrySurveyUpload,
  focusMode = false,
  showOpsData = false
}: ValidationPageProps) {
  const latestSubmission = userProfile.surveySubmissions[0] ?? null;
  const queueSummary = useMemo(() => buildSurveyQueueSummary(userProfile.surveySubmissions), [userProfile.surveySubmissions]);
  const recentSubmissions = userProfile.surveySubmissions.slice(0, 12);
  const [exportHint, setExportHint] = useState<string | null>(null);

  const handleExportCsv = () => {
    if (typeof window === "undefined") return;
    const csv = toCsv(userProfile.surveySubmissions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `yangjuan-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setExportHint("已导出 CSV，可直接用于首批意向整理。");
  };

  const handleCopyJson = async () => {
    const payload = JSON.stringify(userProfile.surveySubmissions.slice(0, 20), null, 2);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        setExportHint("最近 20 条意向 JSON 已复制。");
        return;
      }
    } catch {
      // ignore and fallback
    }

    if (typeof window !== "undefined") {
      window.prompt("请复制以下 JSON", payload);
      setExportHint("已打开复制窗口。");
    }
  };

  return (
    <section className="page-grid validation-page-grid" data-testid="validation-page">
      <article className="card validation-overview-card">
        <h2>候补名单</h2>
        <p className="muted">你正在体验数字生命版小羊卷。现在留个意向，就能延续这段关系。</p>
        <div className="state-chip-row">
          <span>当前场景：{sceneLabel(activeScene)}</span>
          <span>当前幸运色：{dailyColorName}</span>
          <span>已记录意向：{queueSummary.total}</span>
          <span>已成功同步：{queueSummary.success}</span>
        </div>
        <div className="quick-actions home-quick-actions">
          <button type="button" className="ghost-btn" onClick={onGoHome} data-testid="validation-back-home">
            回到首页继续陪伴
          </button>
        </div>
        <SheepAvatarStage
          scarfColorHex={sheepVisualState.scarfColorHex}
          eyeColorHex={sheepVisualState.eyeColorHex}
          expression={sheepVisualState.expression}
          motion={sheepVisualState.motionTemplate}
          statusText={sheepVisualState.statusText}
          emotionLevel={sheepEmotionState.emotionLevel}
          emotion={sheepEmotionState.emotion}
          scene={activeScene}
          minimal={focusMode}
        />
      </article>

      <ExperienceFeedbackCard
        feedback={userProfile.experienceFeedback}
        submissionCount={userProfile.surveySubmissions.length}
        lastSubmittedAt={latestSubmission?.createdAt ?? null}
        latestSubmission={latestSubmission}
        queueSummary={queueSummary}
        activeScene={activeScene}
        dailyColorName={dailyColorName}
        onSubmit={onSubmitExperienceFeedback}
        onRetryUpload={onRetrySurveyUpload}
      />

      <article className="card validation-upgrade-card">
        <h3>提交后你会收到什么</h3>
        <ul className="validation-module-list">
          {followupItems().map((text) => (
            <li key={text}>
              <p>{text}</p>
            </li>
          ))}
        </ul>
        <p className="muted">{statusSummaryText(queueSummary)}</p>
        <p className="muted">当前阶段：数字生命体验验证中；实体版规划中，会继承同一只小羊卷的关系状态。</p>
      </article>

      {showOpsData ? (
        <article className="card validation-data-card">
          <h3>意向数据（最小实用视图）</h3>
          <p className="muted">用于演示后快速看数据、导出给后续跟进同学。</p>

          <div className="validation-export-actions">
            <button type="button" className="ghost-btn" onClick={handleExportCsv}>
              导出 CSV
            </button>
            <button type="button" className="ghost-btn" onClick={handleCopyJson}>
              复制最近 20 条 JSON
            </button>
          </div>

          {exportHint ? <p className="muted">{exportHint}</p> : null}

          <div className="validation-mini-table-wrap">
            <table className="validation-mini-table">
              <thead>
                <tr>
                  <th>提交时间</th>
                  <th>状态</th>
                  <th>场景</th>
                  <th>候补</th>
                  <th>实体意向</th>
                  <th>联系方式</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.length ? (
                  recentSubmissions.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.createdAt).toLocaleString()}</td>
                      <td>{uploadStatusText(item.status)}</td>
                      <td>{item.payload.favoriteScene ? sceneLabel(item.payload.favoriteScene) : "-"}</td>
                      <td>{waitlistText(item.payload.joinWaitlist)}</td>
                      <td>{yesNoText(item.payload.wantsPhysical)}</td>
                      <td>{item.payload.contact || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>暂无提交记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  );
}
