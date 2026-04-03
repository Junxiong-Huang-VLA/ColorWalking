import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildClosureChecklist,
  latestWaitlistEntry,
  markE2EBaselineCovered,
  recordDeviceBridgeOutput,
  waitlistStatusLabel,
  type DigitalLifeState
} from "../digitalLifeState";
import { fetchLatestE2ERunRemote, reportE2ERunRemote, type E2ERunRecord } from "../services/backendApi";

type Props = {
  life: DigitalLifeState;
  onLifeChange: (state: DigitalLifeState) => void;
  open?: boolean;
};

export function ClosureReadinessPanel({ life, onLifeChange, open = false }: Props) {
  const checklist = useMemo(() => buildClosureChecklist(life), [life]);
  const latestWaitlist = latestWaitlistEntry(life);
  const latestBridge = life.closureState.bridgeOutputs[0] ?? null;
  const [remoteE2E, setRemoteE2E] = useState<E2ERunRecord | null>(null);
  const [syncHint, setSyncHint] = useState("");

  const passedCount = [
    checklist.luckyColorGenerated,
    checklist.sheepStateUpdated,
    checklist.interactionOccurred,
    checklist.growthWritten,
    checklist.memorySettled,
    checklist.waitlistRecorded,
    checklist.bridgeOutputGenerated,
    checklist.e2eBaselineCovered
  ].filter(Boolean).length;

  const syncRemoteStatus = useCallback(async () => {
    const latest = await fetchLatestE2ERunRemote("investor-demo-baseline");
    if (!latest.ok) {
      setSyncHint("CI 基线状态读取失败。");
      return;
    }
    setRemoteE2E(latest.data?.run ?? null);
    if (latest.data?.run?.status === "passed" && !life.closureState.e2eBaseline.covered) {
      onLifeChange(markE2EBaselineCovered(`ci:${latest.data.run.id}`));
    }
    setSyncHint(latest.data?.run ? `已同步 CI：${latest.data.run.status}` : "CI 还没有上传 E2E 记录。");
  }, [life.closureState.e2eBaseline.covered, onLifeChange]);

  useEffect(() => {
    void syncRemoteStatus();
  }, [syncRemoteStatus]);

  return (
    <details className="closure-readiness-panel" open={open}>
      <summary>Demo Mode / 闭环验收摘要（内部可见）</summary>
      <ul>
        <li className={checklist.luckyColorGenerated ? "is-pass" : ""}>今日幸运色已生成</li>
        <li className={checklist.sheepStateUpdated ? "is-pass" : ""}>小羊卷状态已更新</li>
        <li className={checklist.interactionOccurred ? "is-pass" : ""}>互动已发生</li>
        <li className={checklist.growthWritten ? "is-pass" : ""}>成长已写入</li>
        <li className={checklist.memorySettled ? "is-pass" : ""}>记忆已沉淀</li>
        <li className={checklist.waitlistRecorded ? "is-pass" : ""}>候补名单状态已记录</li>
        <li className={checklist.bridgeOutputGenerated ? "is-pass" : ""}>设备桥接输出对象已生成</li>
        <li className={checklist.e2eBaselineCovered ? "is-pass" : ""}>E2E 基线已覆盖</li>
      </ul>

      <p className="closure-score">闭环进度：{passedCount} / 8</p>

      <p className="closure-meta">
        候补最新状态：{latestWaitlist ? `${waitlistStatusLabel(latestWaitlist.status)}（${latestWaitlist.intent}）` : "暂无"}
      </p>
      <p className="closure-meta">
        CI E2E：{remoteE2E ? `${remoteE2E.status}（${remoteE2E.createdAt}）` : "暂无远端记录"}
      </p>
      {syncHint ? <p className="closure-meta">{syncHint}</p> : null}

      <div className="closure-actions">
        <button
          type="button"
          onClick={() => {
            const next = recordDeviceBridgeOutput("manual");
            onLifeChange(next);
          }}
        >
          生成桥接对象
        </button>
        <button
          type="button"
          onClick={() => {
            const next = markE2EBaselineCovered("demo-manual-confirm");
            onLifeChange(next);
          }}
        >
          本地标记 E2E 基线
        </button>
        <button
          type="button"
          onClick={async () => {
            const result = await reportE2ERunRemote({
              suite: "investor-demo-baseline",
              status: "passed",
              note: "manual-closure-panel-report"
            });
            if (!result.ok) {
              setSyncHint("E2E 结果上报失败。");
              return;
            }
            onLifeChange(markE2EBaselineCovered(`api:${result.data?.run.id ?? "manual"}`));
            await syncRemoteStatus();
          }}
        >
          上报 E2E 通过
        </button>
        <button type="button" onClick={() => void syncRemoteStatus()}>
          同步 CI E2E 状态
        </button>
      </div>

      <pre className="closure-json">
        {latestBridge
          ? JSON.stringify(latestBridge, null, 2)
          : JSON.stringify({ info: "暂无桥接对象，执行抽色或互动后会自动生成。" }, null, 2)}
      </pre>
    </details>
  );
}
