import { formatDayKey } from "@colorwalking/shared";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  applyWaitlistSnapshot,
  latestWaitlistEntry,
  requestWaitlistFollowup,
  waitlistStatusLabel,
  type DigitalLifeState,
  type WaitlistSource
} from "../digitalLifeState";
import {
  checkBackendHealth,
  createWaitlistRemote,
  requestWaitlistFollowupRemote,
  retryWaitlistRemote,
  updateWaitlistStatusRemote,
  type WaitlistRecord
} from "../services/backendApi";

type Props = {
  life: DigitalLifeState;
  source: WaitlistSource;
  onLifeChange: (state: DigitalLifeState) => void;
  autoDemoSubmit?: boolean;
  showDataOps?: boolean;
  className?: string;
};

const INTENT_OPTIONS = ["想继续陪伴小羊卷", "想优先体验实体版", "想第一时间收到后续更新"];

const FLOW_STEPS: Array<{ key: "filled" | "queued" | "uploading" | "success" | "failed"; label: string }> = [
  { key: "filled", label: "已填写" },
  { key: "queued", label: "待上传" },
  { key: "uploading", label: "上传中" },
  { key: "success", label: "上传成功" },
  { key: "failed", label: "上传失败（可重试）" }
];

const STATUS_COPY: Record<"filled" | "queued" | "uploading" | "success" | "failed", string> = {
  filled: "信息已填写，准备提交。",
  queued: "已加入候补队列，正在等待同步。",
  uploading: "正在同步意向信息，请稍等……",
  success: "已完成，你已进入小羊卷候补名单。",
  failed: "这次提交没有成功，点一下重试就能继续。"
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WindowWithCaptcha = Window & {
  __WAITLIST_CAPTCHA_TOKEN__?: unknown;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function toLocalSource(source: string): WaitlistSource {
  return source === "home" || source === "lucky" || source === "future" || source === "about" || source === "premiere"
    ? source
    : "unknown";
}

function readCaptchaToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const token = (window as WindowWithCaptcha).__WAITLIST_CAPTCHA_TOKEN__;
  return typeof token === "string" && token.trim() ? token.trim() : undefined;
}

function toHintByError(error: string | undefined): string {
  if (!error) return "候补提交暂时失败，请稍后再试。";
  if (error === "rate_limited_temporarily") return "你提交得有点快了，稍等一下再试。";
  if (error === "captcha_required" || error === "captcha_verify_failed") return "人机校验未通过，请重试一次。";
  if (error === "waitlist_backend_unreachable") return "候补服务暂时不可用，请稍后再试。";
  return "候补提交暂时失败，请稍后再试。";
}

function syncLocalByRemote(entry: WaitlistRecord, onLifeChange: (state: DigitalLifeState) => void): DigitalLifeState {
  const next = applyWaitlistSnapshot({
    id: entry.id,
    name: entry.name,
    email: entry.email,
    intent: entry.intent,
    source: toLocalSource(entry.source),
    status: entry.status,
    retryCount: entry.retryCount,
    failReason: entry.failReason,
    followupRequestedAt: entry.followupRequestedAt,
    submittedAt: entry.submittedAt,
    updatedAt: entry.updatedAt
  });
  onLifeChange(next);
  return next;
}

export function WaitlistConversionCard({
  life,
  source,
  onLifeChange,
  autoDemoSubmit = false,
  showDataOps = false,
  className = ""
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState(INTENT_OPTIONS[0]);
  const [hint, setHint] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const autoSubmittedRef = useRef(false);

  const latestEntry = useMemo(() => latestWaitlistEntry(life, source) ?? life.waitlistState[0] ?? null, [life, source]);

  const runUploadPipeline = useCallback(
    async (entryId: string) => {
      setIsUploading(true);

      const queueResult = await updateWaitlistStatusRemote({ id: entryId, status: "queued" });
      if (!queueResult.ok || !queueResult.data?.waitlist) {
        setHint(toHintByError(queueResult.error));
        setIsUploading(false);
        return;
      }
      syncLocalByRemote(queueResult.data.waitlist, onLifeChange);

      const uploadingResult = await updateWaitlistStatusRemote({ id: entryId, status: "uploading" });
      if (!uploadingResult.ok || !uploadingResult.data?.waitlist) {
        setHint("进入上传阶段失败，请稍后重试。");
        setIsUploading(false);
        return;
      }
      syncLocalByRemote(uploadingResult.data.waitlist, onLifeChange);

      await sleep(680);
      const finishResult = await updateWaitlistStatusRemote({
        id: entryId,
        status: "success"
      });

      if (!finishResult.ok || !finishResult.data?.waitlist) {
        const failedResult = await updateWaitlistStatusRemote({
          id: entryId,
          status: "failed",
          failReason: "upload_confirmation_timeout"
        });
        if (failedResult.ok && failedResult.data?.waitlist) {
          syncLocalByRemote(failedResult.data.waitlist, onLifeChange);
        }
        setHint("上传确认超时了，请点一次重试。");
        setIsUploading(false);
        return;
      }

      syncLocalByRemote(finishResult.data.waitlist, onLifeChange);
      setHint("意向已记录，后续首演与实体版进展会优先通知你。");
      setIsUploading(false);
    },
    [onLifeChange]
  );

  const submitFlow = useCallback(
    async (payload: { name: string; email: string; intent: string }) => {
      const healthy = await checkBackendHealth();
      if (!healthy) {
        setHint("候补服务暂未连通，请稍后重试。");
        return;
      }

      const created = await createWaitlistRemote({
        name: payload.name,
        email: payload.email,
        intent: payload.intent,
        source,
        clientAt: new Date().toISOString(),
        website: "",
        captchaToken: readCaptchaToken()
      });

      if (!created.ok || !created.data?.waitlist) {
        setHint(toHintByError(created.error));
        return;
      }

      const current = syncLocalByRemote(created.data.waitlist, onLifeChange);
      const entry = latestWaitlistEntry(current, source) ?? current.waitlistState[0];
      if (!entry) {
        setHint("候补记录创建后读取失败，请稍后重试。");
        return;
      }

      await runUploadPipeline(entry.id);
    },
    [onLifeChange, runUploadPipeline, source]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setHint("留下称呼和邮箱就可以完成候补。");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setHint("邮箱格式不太对，请检查后再提交。");
      return;
    }

    await submitFlow({
      name: name.trim(),
      email: email.trim(),
      intent: intent.trim() || INTENT_OPTIONS[0]
    });
  };

  const onRetry = useCallback(async () => {
    if (!latestEntry) return;

    const retryResult = await retryWaitlistRemote(latestEntry.id);
    if (!retryResult.ok || !retryResult.data?.waitlist) {
      setHint("重试请求没有成功，请再点一次。");
      return;
    }

    syncLocalByRemote(retryResult.data.waitlist, onLifeChange);
    await runUploadPipeline(latestEntry.id);
  }, [latestEntry, onLifeChange, runUploadPipeline]);

  const onFollowup = useCallback(async () => {
    if (!latestEntry) return;

    const result = await requestWaitlistFollowupRemote({ id: latestEntry.id, channel: "email" });
    if (!result.ok || !result.data?.waitlist) {
      setHint("提醒请求发送失败，请稍后再试。");
      return;
    }

    const synced = syncLocalByRemote(result.data.waitlist, onLifeChange);
    const target = latestWaitlistEntry(synced, source) ?? synced.waitlistState[0];
    if (target) {
      onLifeChange(requestWaitlistFollowup(target.id));
    }
    setHint("好的，下次关键更新前会再提醒你。");
  }, [latestEntry, onLifeChange, source]);

  useEffect(() => {
    if (!autoDemoSubmit || autoSubmittedRef.current) return;
    if (latestEntry && (latestEntry.status === "success" || latestEntry.status === "uploading" || latestEntry.status === "queued")) return;

    autoSubmittedRef.current = true;
    const demoName = `演示访客${formatDayKey(new Date()).slice(5).replace("-", "")}`;
    const demoEmail = `demo+${Date.now()}@yangjuandao.test`;
    setName(demoName);
    setEmail(demoEmail);
    setIntent(INTENT_OPTIONS[1]);
    void submitFlow({ name: demoName, email: demoEmail, intent: INTENT_OPTIONS[1] });
  }, [autoDemoSubmit, latestEntry, submitFlow]);

  const currentStatus = latestEntry?.status ?? null;
  const statusLine = currentStatus ? STATUS_COPY[currentStatus] : "填完就能加入候补，全程只需要几秒。";
  const submittedSummary = latestEntry
    ? `已提交：${latestEntry.name || "未命名"} / ${latestEntry.email || "--"}`
    : "";

  return (
    <section
      id="waitlist-conversion"
      className={`waitlist-conversion-card ${className}`.trim()}
      data-testid="waitlist-conversion-card"
    >
      <h2>想继续和小羊卷见面，就把联系方式留在这里</h2>
      <p>留下称呼和邮箱后，你会优先收到实体版体验、首演更新和下一次陪伴邀请。</p>

      <form className="waitlist-conversion-form" data-testid="waitlist-form" onSubmit={(event) => void onSubmit(event)}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="你的称呼"
          autoComplete="name"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="邮箱"
          type="email"
          autoComplete="email"
        />
        <input
          className="waitlist-honeypot"
          type="text"
          name="website"
          autoComplete="off"
          tabIndex={-1}
          defaultValue=""
          aria-hidden="true"
        />

        <div className="waitlist-intent-row" role="group" aria-label="候补意向">
          {INTENT_OPTIONS.map((option) => (
            <button
              type="button"
              key={option}
              className={intent === option ? "is-active" : ""}
              onClick={() => setIntent(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <button type="submit" className="waitlist-submit" data-testid="waitlist-submit" disabled={isUploading}>
          {isUploading ? "上传中..." : "加入候补名单"}
        </button>
      </form>

      <div className="waitlist-flow-state" aria-live="polite">
        {FLOW_STEPS.map((item) => {
          const active =
            item.key === currentStatus ||
            (item.key === "filled" && currentStatus !== null) ||
            (item.key === "queued" && (currentStatus === "uploading" || currentStatus === "success" || currentStatus === "failed")) ||
            (item.key === "uploading" && (currentStatus === "success" || currentStatus === "failed"));
          return (
            <span key={item.key} className={active ? "is-active" : ""}>
              {item.label}
            </span>
          );
        })}
      </div>

      <p className="waitlist-status-line" data-testid="waitlist-status-line">
        当前状态：{currentStatus ? waitlistStatusLabel(currentStatus) : "未提交"} · {statusLine}
      </p>
      {hint ? <p className="waitlist-hint">{hint}</p> : null}
      {latestEntry ? <p className="waitlist-entry-summary">{submittedSummary}</p> : null}

      {latestEntry?.status === "success" ? (
        <div className="waitlist-next-expectation">
          <p>你已完成意向登记。接下来你会收到：首演邀请、内测时间和实体版进展。</p>
          <p>当前仍在数字生命体验证阶段，实体版正在规划。</p>
        </div>
      ) : null}

      {latestEntry?.status === "failed" ? (
        <button type="button" className="waitlist-retry" onClick={() => void onRetry()}>
          重试上传
        </button>
      ) : null}

      {latestEntry?.status === "success" && !latestEntry.followupRequestedAt ? (
        <button type="button" className="waitlist-followup" onClick={() => void onFollowup()}>
          下次关键更新前再提醒我
        </button>
      ) : null}

      {showDataOps ? (
        <p className="waitlist-data-ops">
          数据查看：<a href="/api/waitlist?limit=100" target="_blank" rel="noreferrer">最新 100 条意向</a>
        </p>
      ) : null}
    </section>
  );
}
