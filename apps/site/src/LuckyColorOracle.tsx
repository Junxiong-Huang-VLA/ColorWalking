import { useMemo, useState } from "react";
import {
  compareTwoDays,
  formatDayKey,
  type BirthProfile,
  type FiveElement,
  type FortuneInsight
} from "@colorwalking/shared";

const SIGN_STORE_KEY = "colorwalking.time-color-note.v1";

type SavedSign = {
  id: string;
  savedAt: string;
  birthday: string;
  birthHour: number;
  firstDate: string;
  secondDate: string;
  firstColorName: string;
  firstColorHex: string;
  secondColorName: string;
  secondColorHex: string;
  advice: string;
};

function todayText(offset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const ELEMENT_LABEL: Record<FiveElement, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水"
};

const ELEMENT_MOOD: Record<FiveElement, string[]> = {
  wood: ["生长", "舒展", "重启"],
  fire: ["热望", "表达", "明亮"],
  earth: ["安稳", "沉着", "扎实"],
  metal: ["清晰", "边界", "专注"],
  water: ["流动", "感受", "修复"]
};

const ELEMENT_ACTION: Record<FiveElement, string> = {
  wood: "给今天立一个很小的开始，比如先完成 10 分钟的任务。",
  fire: "和一个信任的人说说近况，让情绪有出口。",
  earth: "整理一处小角落，把心也轻轻归位。",
  metal: "先做一件最重要的小事，其他先放一放。",
  water: "慢慢呼吸 6 次，再继续处理眼前的事情。"
};

function loadSavedSigns(): SavedSign[] {
  try {
    const raw = localStorage.getItem(SIGN_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedSign[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSign(item: SavedSign) {
  const list = loadSavedSigns();
  const next = [item, ...list].slice(0, 12);
  localStorage.setItem(SIGN_STORE_KEY, JSON.stringify(next));
}

function compareTone(first: FortuneInsight, second: FortuneInsight): string {
  if (first.luckyElement === second.luckyElement) return "两天节奏接近，适合保持稳定步调。";
  const left = ELEMENT_LABEL[first.luckyElement];
  const right = ELEMENT_LABEL[second.luckyElement];
  return `A 日偏「${left}」，B 日偏「${right}」，可以按心情灵活切换节奏。`;
}

function bestDayHint(first: FortuneInsight, second: FortuneInsight): string {
  if (first.supportElement === second.supportElement) return "两天都适合你，按日程轻松安排就好。";
  return first.supportElement === first.luckyElement
    ? `更推荐 ${first.dateKey}，这天更贴合你当下状态。`
    : `更推荐 ${second.dateKey}，这天会更顺手一点。`;
}

async function copyTextFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback to execCommand
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function buildSignShareText(sign: SavedSign): string {
  return [
    `我的时色签`,
    `A 日 ${sign.firstDate}：${sign.firstColorName} ${sign.firstColorHex}`,
    `B 日 ${sign.secondDate}：${sign.secondColorName} ${sign.secondColorHex}`,
    `今日建议：${sign.advice}`,
    `来自 ColorWalking`
  ].join("\n");
}

function ResultCard({ title, item }: { title: string; item: FortuneInsight }) {
  const moodWords = ELEMENT_MOOD[item.luckyElement];
  return (
    <article className="oracle-result-card">
      <p className="oracle-result-date">{title} · {item.dateKey}</p>
      <div className="oracle-color-row">
        <span style={{ backgroundColor: item.luckyColor.hex }} />
        <div>
          <b>{item.luckyColor.name}</b>
          <small>{item.luckyColor.hex}</small>
        </div>
      </div>
      <p className="oracle-tags">
        今日气息：{ELEMENT_LABEL[item.dayElement]} / 支持元素：{ELEMENT_LABEL[item.supportElement]} / 建议偏向：
        {ELEMENT_LABEL[item.luckyElement]}
      </p>
      <div className="oracle-mood-chips">
        {moodWords.map((x) => (
          <span key={`${item.dateKey}-${x}`}>{x}</span>
        ))}
      </div>
      <p className="oracle-summary">{item.summary}</p>
      <p className="oracle-message">{item.luckyColor.message}</p>
      <p className="oracle-action">今日建议：{ELEMENT_ACTION[item.luckyElement]}</p>
    </article>
  );
}

export function LuckyColorOracle() {
  const [birthday, setBirthday] = useState("1998-08-08");
  const [birthHour, setBirthHour] = useState(9);
  const [firstDate, setFirstDate] = useState(todayText(0));
  const [secondDate, setSecondDate] = useState(todayText(1));
  const [savedHint, setSavedHint] = useState("");
  const [shareHint, setShareHint] = useState("");
  // FEAT-06: 历史列表 + FEAT-07: 表单折叠
  const [savedSigns, setSavedSigns] = useState<SavedSign[]>(() => loadSavedSigns());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);

  const result = useMemo(() => {
    if (!birthday || !firstDate || !secondDate) return null;
    const profile: BirthProfile = { birthday, birthHour };
    return compareTwoDays(profile, new Date(`${firstDate}T00:00:00`), new Date(`${secondDate}T00:00:00`));
  }, [birthday, birthHour, firstDate, secondDate]);

  const todayAdvice = result ? ELEMENT_ACTION[result.first.luckyElement] : "";

  const createCurrentSign = (): SavedSign | null => {
    if (!result) return null;
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: new Date().toISOString(),
      birthday,
      birthHour,
      firstDate,
      secondDate,
      firstColorName: result.first.luckyColor.name,
      firstColorHex: result.first.luckyColor.hex,
      secondColorName: result.second.luckyColor.name,
      secondColorHex: result.second.luckyColor.hex,
      advice: todayAdvice
    };
  };

  const onSaveTodaySign = () => {
    const sign = createCurrentSign();
    if (!sign) return;
    saveSign(sign);
    setSavedSigns(loadSavedSigns());
    setSavedHint(`已保存今日时色签（${formatDayKey(new Date())}）。`);
    window.setTimeout(() => setSavedHint(""), 2200);
  };

  const onShareTodaySign = async () => {
    let sign: SavedSign | null = savedSigns[0] ?? null;
    if (!sign) {
      sign = createCurrentSign();
      if (sign) {
        saveSign(sign);
        setSavedSigns(loadSavedSigns());
      }
    }
    if (!sign) return;

    const text = buildSignShareText(sign);
    try {
      if (navigator.share) {
        await navigator.share({ title: "时色签", text, url: window.location.href });
        setShareHint("已打开分享面板");
      } else {
        const ok = await copyTextFallback(`${text}\n${window.location.href}`);
        if (ok) {
          setShareHint("已复制时色签文案");
        } else {
          window.prompt("复制这段时色签：", `${text}\n${window.location.href}`);
          setShareHint("已为你准备好分享内容");
        }
      }
    } catch (err) {
      const abort = err instanceof Error && err.name === "AbortError";
      if (abort) {
        setShareHint("你取消了分享，没关系。");
      } else {
        const ok = await copyTextFallback(`${text}\n${window.location.href}`);
        setShareHint(ok ? "分享面板不可用，已帮你复制。" : "这次先不分享也没关系。");
      }
    }
    window.setTimeout(() => setShareHint(""), 2200);
  };

  return (
    <section id="oracle" className="section oracle-card">
      <h2>时色签</h2>
      <p className="oracle-desc">输入生日和时段，看看这两天各自适合的幸运颜色。它不是标准答案，而是一份柔和的心情参考。</p>

      {/* FEAT-07: 表单折叠/展开 */}
      {!formCollapsed ? (
        <div className="oracle-form-grid">
          <label>
            生日
            <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          </label>

          <label>
            出生时段
            <select value={birthHour} onChange={(e) => setBirthHour(Number(e.target.value))}>
              <option value={0}>子时（23:00-00:59）</option>
              <option value={2}>丑时（01:00-02:59）</option>
              <option value={4}>寅时（03:00-04:59）</option>
              <option value={6}>卯时（05:00-06:59）</option>
              <option value={8}>辰时（07:00-08:59）</option>
              <option value={10}>巳时（09:00-10:59）</option>
              <option value={12}>午时（11:00-12:59）</option>
              <option value={14}>未时（13:00-14:59）</option>
              <option value={16}>申时（15:00-16:59）</option>
              <option value={18}>酉时（17:00-18:59）</option>
              <option value={20}>戌时（19:00-20:59）</option>
              <option value={22}>亥时（21:00-22:59）</option>
            </select>
          </label>

          <label>
            对比日期 A
            <input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
          </label>

          <label>
            对比日期 B
            <input type="date" value={secondDate} onChange={(e) => setSecondDate(e.target.value)} />
          </label>
        </div>
      ) : (
        <div className="oracle-form-summary">
          <span>生日 {birthday} · {birthHour}时 · {firstDate} vs {secondDate}</span>
          <button type="button" className="oracle-reopen-btn" onClick={() => setFormCollapsed(false)}>
            重新填写
          </button>
        </div>
      )}

      {result ? (
        <>
          <div className="oracle-compare-head oracle-compare-panel">
            <b>{result.sameColor ? "两天颜色一致" : "两天颜色不同"}</b>
            <span>{compareTone(result.first, result.second)}</span>
            <p className="oracle-best-day">{bestDayHint(result.first, result.second)}</p>
            <div className="oracle-sign-actions">
              <button type="button" className="oracle-save-btn" onClick={onSaveTodaySign}>保存今日时色签</button>
              <button type="button" className="oracle-share-btn" onClick={onShareTodaySign}>分享今日时色签</button>
              <button type="button" className="oracle-collapse-btn" onClick={() => setFormCollapsed(true)}>收起条件</button>
              {savedHint ? <em>{savedHint}</em> : null}
              {shareHint ? <em>{shareHint}</em> : null}
            </div>
          </div>
          <div className="oracle-results-grid">
            <ResultCard title="日期 A" item={result.first} />
            <ResultCard title="日期 B" item={result.second} />
          </div>
        </>
      ) : null}

      {/* FEAT-06: 时色签历史列表 */}
      {savedSigns.length > 0 && (
        <div className="oracle-saved-preview">
          <div className="oracle-saved-header">
            <b>时色签历史（{savedSigns.length} 条）</b>
            {savedSigns.length > 1 && (
              <button type="button" className="oracle-history-toggle" onClick={() => setHistoryOpen(v => !v)}>
                {historyOpen ? "收起" : "展开"}
              </button>
            )}
          </div>
          {/* 最近1条始终显示 */}
          <div className="oracle-saved-row oracle-saved-latest">
            <span className="oracle-saved-dot" style={{ background: savedSigns[0].firstColorHex }} />
            <span className="oracle-saved-dot" style={{ background: savedSigns[0].secondColorHex }} />
            <span className="oracle-saved-text">
              {savedSigns[0].firstDate} / {savedSigns[0].secondDate}
            </span>
            <small className="oracle-saved-meta">{savedSigns[0].firstColorName} · {savedSigns[0].secondColorName}</small>
          </div>
          {/* 展开后显示剩余 */}
          {historyOpen && savedSigns.slice(1).map(sign => (
            <div key={sign.id} className="oracle-saved-row">
              <span className="oracle-saved-dot" style={{ background: sign.firstColorHex }} />
              <span className="oracle-saved-dot" style={{ background: sign.secondColorHex }} />
              <span className="oracle-saved-text">{sign.firstDate} / {sign.secondDate}</span>
              <small className="oracle-saved-meta">{sign.firstColorName} · {sign.secondColorName}</small>
            </div>
          ))}
        </div>
      )}

      <p className="oracle-note">说明：这是一个用于情绪灵感的轻量功能，不替代任何专业建议。</p>
    </section>
  );
}

