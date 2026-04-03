import { getBrandCoreCopy, getBrandPrimaryCtas, getFeaturedProduct } from "@colorwalking/shared";
import { useMemo } from "react";
import { ExperienceFeedbackCard } from "../../features/memory/ExperienceFeedbackCard";
import { buildSurveyQueueSummary } from "../../features/memory/surveyQueueView";
import type { DemoScenarioPreset, InteractionScene, UserProfileState } from "../../state/types";

type ProductPageProps = {
  userProfile: UserProfileState;
  activeScene: InteractionScene;
  dailyColorName: string;
  onSubmitExperienceFeedback: (patch: Partial<UserProfileState["experienceFeedback"]>) => void;
  onRetrySurveyUpload: (submissionId?: string) => void;
  onGoInteraction: () => void;
  onRunDemoScript: (preset: DemoScenarioPreset) => void;
};

const CAPABILITIES = [
  {
    title: "每日幸运色",
    desc: "每天生成一份幸运色与轻提示，作为小羊卷当天的陪伴主题。"
  },
  {
    title: "眼睛 / 围巾同步",
    desc: "幸运色会同步到眼睛与围巾表达，形成可感知的角色状态。"
  },
  {
    title: "轻陪伴互动",
    desc: "支持短句对话、场景切换与轻触发反馈，不做高打扰信息轰炸。"
  },
  {
    title: "养成成长",
    desc: "通过羁绊关系值、任务和成长节点，验证长期陪伴是否可持续。"
  },
  {
    title: "记忆沉淀",
    desc: "沉淀颜色轨迹、互动时间线和反馈数据，形成共同经历回路。"
  }
] as const;

export function ProductPage({
  userProfile,
  activeScene,
  dailyColorName,
  onSubmitExperienceFeedback,
  onRetrySurveyUpload,
  onGoInteraction,
  onRunDemoScript
}: ProductPageProps) {
  const featured = getFeaturedProduct();
  const brandCopy = getBrandCoreCopy();
  const ctas = getBrandPrimaryCtas();
  const ctaById = Object.fromEntries(ctas.map((item) => [item.id, item]));
  const latestSubmission = userProfile.surveySubmissions[0] ?? null;
  const queueSummary = useMemo(() => buildSurveyQueueSummary(userProfile.surveySubmissions), [userProfile.surveySubmissions]);

  const handleWantPhysical = () => {
    onSubmitExperienceFeedback({ wantsPhysical: "yes" });
  };

  const handleJoinWaitlist = () => {
    onSubmitExperienceFeedback({ joinWaitlist: "yes" });
  };

  const handleWantUpdates = () => {
    onSubmitExperienceFeedback({ continueUsing: "yes" });
  };

  return (
    <section className="page-grid" data-testid="product-page">
      <article className="card product-spotlight-card">
        <h2>小羊卷产品页</h2>
        <p className="muted">一句话定义：{brandCopy.sheepOneLiner}</p>
        <img src={featured.siteImagePath} alt={featured.name} className="product-spotlight-image" loading="eager" />
        <div className="product-spotlight-meta">
          <b>{featured.name}</b>
          <small>{featured.tagline}</small>
        </div>
      </article>

      <article className="card">
        <h2>核心能力</h2>
        <ul className="companion-module-list">
          {CAPABILITIES.map((item) => (
            <li key={item.title}>
              <b>{item.title}</b>
              <p>{item.desc}</p>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <h2>当前阶段说明</h2>
        <div className="state-chip-row">
          <span>当前：数字生命体 Demo 验证阶段</span>
          <span>下一步：实体版联动规划中</span>
        </div>
        <p style={{ marginTop: 10 }}>{brandCopy.softwareFirstReason}</p>
        <button type="button" className="ghost-btn" onClick={onGoInteraction}>
          {ctaById.enter_light_companion_demo.label}
        </button>
      </article>

      <article className="card">
        <h2>一键演示剧本</h2>
        <p className="muted">用于录产品视频与对外展示，点击后会直接进入 Demo 并切到对应剧本状态。</p>
        <div className="quick-actions home-quick-actions">
          <button type="button" className="primary-btn" onClick={() => onRunDemoScript("today_first_meet")}>
            今日第一次见面
          </button>
          <button type="button" className="ghost-btn" onClick={() => onRunDemoScript("tonight_tired")}>
            今晚有点累
          </button>
          <button type="button" className="ghost-btn" onClick={() => onRunDemoScript("companionship_growth")}>
            连续陪伴后的关系感
          </button>
        </div>
      </article>

      <article className="card waitlist-entry-card">
        <h2>候补名单 / 预约验证</h2>
        <p className="muted">以下三个 CTA 会直接写入现有轻问卷与上传队列。</p>
        <div className="quick-actions home-quick-actions">
          <button type="button" className="primary-btn" onClick={handleWantPhysical}>
            想体验实体版
          </button>
          <button type="button" className="ghost-btn" onClick={handleJoinWaitlist}>
            愿意加入候补名单
          </button>
          <button type="button" className="ghost-btn" onClick={handleWantUpdates}>
            想收到后续更新
          </button>
        </div>
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
    </section>
  );
}
