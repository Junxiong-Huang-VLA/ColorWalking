import { useMemo, useState } from "react";
import {
  compareTwoDays,
  formatDayKey,
  type BirthProfile,
  type FiveElement,
  type FortuneInsight
} from "@colorwalking/shared";

const SIGN_STORE_KEY = "lambroll-isle.time-color-note.v1";
const LEGACY_SIGN_STORE_KEY = "colorwalking.time-color-note.v1";

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
  wood: "鏈?,
  fire: "鐏?,
  earth: "鍦?,
  metal: "閲?,
  water: "姘?
};

const ELEMENT_MOOD: Record<FiveElement, string[]> = {
  wood: ["鐢熼暱", "鑸掑睍", "閲嶅惎"],
  fire: ["鐑湜", "琛ㄨ揪", "鏄庝寒"],
  earth: ["瀹夌ǔ", "娌夌潃", "鎵庡疄"],
  metal: ["娓呮櫚", "杈圭晫", "涓撴敞"],
  water: ["娴佸姩", "鎰熷彈", "淇"]
};

const ELEMENT_ACTION: Record<FiveElement, string> = {
  wood: "缁欎粖澶╃珛涓€涓緢灏忕殑寮€濮嬶紝姣斿鍏堝畬鎴?10 鍒嗛挓鐨勪换鍔°€?,
  fire: "鍜屼竴涓俊浠荤殑浜鸿璇磋繎鍐碉紝璁╂儏缁湁鍑哄彛銆?,
  earth: "鏁寸悊涓€澶勫皬瑙掕惤锛屾妸蹇冧篃杞昏交褰掍綅銆?,
  metal: "鍏堝仛涓€浠舵渶閲嶈鐨勫皬浜嬶紝鍏朵粬鍏堟斁涓€鏀俱€?,
  water: "鎱㈡參鍛煎惛 6 娆★紝鍐嶇户缁鐞嗙溂鍓嶇殑浜嬫儏銆?
};

function loadSavedSigns(): SavedSign[] {
  try {
    const raw = localStorage.getItem(SIGN_STORE_KEY);
    const fallback = raw ?? localStorage.getItem(LEGACY_SIGN_STORE_KEY);
    if (!fallback) return [];
    const parsed = JSON.parse(fallback) as SavedSign[];
    if (!raw) localStorage.setItem(SIGN_STORE_KEY, fallback);
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
  if (first.luckyElement === second.luckyElement) return "涓ゅぉ鑺傚鎺ヨ繎锛岄€傚悎淇濇寔绋冲畾姝ヨ皟銆?;
  const left = ELEMENT_LABEL[first.luckyElement];
  const right = ELEMENT_LABEL[second.luckyElement];
  return `A 鏃ュ亸銆?{left}銆嶏紝B 鏃ュ亸銆?{right}銆嶏紝鍙互鎸夊績鎯呯伒娲诲垏鎹㈣妭濂忋€俙;
}

function bestDayHint(first: FortuneInsight, second: FortuneInsight): string {
  if (first.supportElement === second.supportElement) return "涓ゅぉ閮介€傚悎浣狅紝鎸夋棩绋嬭交鏉惧畨鎺掑氨濂姐€?;
  return first.supportElement === first.luckyElement
    ? `鏇存帹鑽?${first.dateKey}锛岃繖澶╂洿璐村悎浣犲綋涓嬬姸鎬併€俙
    : `鏇存帹鑽?${second.dateKey}锛岃繖澶╀細鏇撮『鎵嬩竴鐐广€俙;
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
    `鎴戠殑鏃惰壊绛綻,
    `A 鏃?${sign.firstDate}锛?{sign.firstColorName} ${sign.firstColorHex}`,
    `B 鏃?${sign.secondDate}锛?{sign.secondColorName} ${sign.secondColorHex}`,
    `浠婃棩寤鸿锛?{sign.advice}`,
    `鏉ヨ嚜羊卷岛`
  ].join("\n");
}

function ResultCard({ title, item }: { title: string; item: FortuneInsight }) {
  const moodWords = ELEMENT_MOOD[item.luckyElement];
  return (
    <article className="oracle-result-card">
      <p className="oracle-result-date">{title} 路 {item.dateKey}</p>
      <div className="oracle-color-row">
        <span style={{ backgroundColor: item.luckyColor.hex }} />
        <div>
          <b>{item.luckyColor.name}</b>
          <small>{item.luckyColor.hex}</small>
        </div>
      </div>
      <p className="oracle-tags">
        浠婃棩姘旀伅锛歿ELEMENT_LABEL[item.dayElement]} / 鏀寔鍏冪礌锛歿ELEMENT_LABEL[item.supportElement]} / 寤鸿鍋忓悜锛?
        {ELEMENT_LABEL[item.luckyElement]}
      </p>
      <div className="oracle-mood-chips">
        {moodWords.map((x) => (
          <span key={`${item.dateKey}-${x}`}>{x}</span>
        ))}
      </div>
      <p className="oracle-summary">{item.summary}</p>
      <p className="oracle-message">{item.luckyColor.message}</p>
      <p className="oracle-action">浠婃棩寤鸿锛歿ELEMENT_ACTION[item.luckyElement]}</p>
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
  // FEAT-06: 鍘嗗彶鍒楄〃 + FEAT-07: 琛ㄥ崟鎶樺彔
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
    setSavedHint(`宸蹭繚瀛樹粖鏃ユ椂鑹茬锛?{formatDayKey(new Date())}锛夈€俙);
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
        await navigator.share({ title: "鏃惰壊绛?, text, url: window.location.href });
        setShareHint("宸叉墦寮€鍒嗕韩闈㈡澘");
      } else {
        const ok = await copyTextFallback(`${text}\n${window.location.href}`);
        if (ok) {
          setShareHint("宸插鍒舵椂鑹茬鏂囨");
        } else {
          window.prompt("澶嶅埗杩欐鏃惰壊绛撅細", `${text}\n${window.location.href}`);
          setShareHint("宸蹭负浣犲噯澶囧ソ鍒嗕韩鍐呭");
        }
      }
    } catch (err) {
      const abort = err instanceof Error && err.name === "AbortError";
      if (abort) {
        setShareHint("浣犲彇娑堜簡鍒嗕韩锛屾病鍏崇郴銆?);
      } else {
        const ok = await copyTextFallback(`${text}\n${window.location.href}`);
        setShareHint(ok ? "鍒嗕韩闈㈡澘涓嶅彲鐢紝宸插府浣犲鍒躲€? : "杩欐鍏堜笉鍒嗕韩涔熸病鍏崇郴銆?);
      }
    }
    window.setTimeout(() => setShareHint(""), 2200);
  };

  return (
    <section id="oracle" className="section oracle-card">
      <h2>鏃惰壊绛?/h2>
      <p className="oracle-desc">杈撳叆鐢熸棩鍜屾椂娈碉紝鐪嬬湅杩欎袱澶╁悇鑷€傚悎鐨勫垢杩愰鑹层€傚畠涓嶆槸鏍囧噯绛旀锛岃€屾槸涓€浠芥煍鍜岀殑蹇冩儏鍙傝€冦€?/p>

      {/* FEAT-07: 琛ㄥ崟鎶樺彔/灞曞紑 */}
      {!formCollapsed ? (
        <div className="oracle-form-grid">
          <label>
            鐢熸棩
            <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          </label>

          <label>
            鍑虹敓鏃舵
            <select value={birthHour} onChange={(e) => setBirthHour(Number(e.target.value))}>
              <option value={0}>瀛愭椂锛?3:00-00:59锛?/option>
              <option value={2}>涓戞椂锛?1:00-02:59锛?/option>
              <option value={4}>瀵呮椂锛?3:00-04:59锛?/option>
              <option value={6}>鍗椂锛?5:00-06:59锛?/option>
              <option value={8}>杈版椂锛?7:00-08:59锛?/option>
              <option value={10}>宸虫椂锛?9:00-10:59锛?/option>
              <option value={12}>鍗堟椂锛?1:00-12:59锛?/option>
              <option value={14}>鏈椂锛?3:00-14:59锛?/option>
              <option value={16}>鐢虫椂锛?5:00-16:59锛?/option>
              <option value={18}>閰夋椂锛?7:00-18:59锛?/option>
              <option value={20}>鎴屾椂锛?9:00-20:59锛?/option>
              <option value={22}>浜ユ椂锛?1:00-22:59锛?/option>
            </select>
          </label>

          <label>
            瀵规瘮鏃ユ湡 A
            <input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
          </label>

          <label>
            瀵规瘮鏃ユ湡 B
            <input type="date" value={secondDate} onChange={(e) => setSecondDate(e.target.value)} />
          </label>
        </div>
      ) : (
        <div className="oracle-form-summary">
          <span>鐢熸棩 {birthday} 路 {birthHour}鏃?路 {firstDate} vs {secondDate}</span>
          <button type="button" className="oracle-reopen-btn" onClick={() => setFormCollapsed(false)}>
            閲嶆柊濉啓
          </button>
        </div>
      )}

      {result ? (
        <>
          <div className="oracle-compare-head oracle-compare-panel">
            <b>{result.sameColor ? "涓ゅぉ棰滆壊涓€鑷? : "涓ゅぉ棰滆壊涓嶅悓"}</b>
            <span>{compareTone(result.first, result.second)}</span>
            <p className="oracle-best-day">{bestDayHint(result.first, result.second)}</p>
            <div className="oracle-sign-actions">
              <button type="button" className="oracle-save-btn" onClick={onSaveTodaySign}>淇濆瓨浠婃棩鏃惰壊绛?/button>
              <button type="button" className="oracle-share-btn" onClick={onShareTodaySign}>鍒嗕韩浠婃棩鏃惰壊绛?/button>
              <button type="button" className="oracle-collapse-btn" onClick={() => setFormCollapsed(true)}>鏀惰捣鏉′欢</button>
              {savedHint ? <em>{savedHint}</em> : null}
              {shareHint ? <em>{shareHint}</em> : null}
            </div>
          </div>
          <div className="oracle-results-grid">
            <ResultCard title="鏃ユ湡 A" item={result.first} />
            <ResultCard title="鏃ユ湡 B" item={result.second} />
          </div>
        </>
      ) : null}

      {/* FEAT-06: 鏃惰壊绛惧巻鍙插垪琛?*/}
      {savedSigns.length > 0 && (
        <div className="oracle-saved-preview">
          <div className="oracle-saved-header">
            <b>鏃惰壊绛惧巻鍙诧紙{savedSigns.length} 鏉★級</b>
            {savedSigns.length > 1 && (
              <button type="button" className="oracle-history-toggle" onClick={() => setHistoryOpen(v => !v)}>
                {historyOpen ? "鏀惰捣" : "灞曞紑"}
              </button>
            )}
          </div>
          {/* 鏈€杩?鏉″缁堟樉绀?*/}
          <div className="oracle-saved-row oracle-saved-latest">
            <span className="oracle-saved-dot" style={{ background: savedSigns[0].firstColorHex }} />
            <span className="oracle-saved-dot" style={{ background: savedSigns[0].secondColorHex }} />
            <span className="oracle-saved-text">
              {savedSigns[0].firstDate} / {savedSigns[0].secondDate}
            </span>
            <small className="oracle-saved-meta">{savedSigns[0].firstColorName} 路 {savedSigns[0].secondColorName}</small>
          </div>
          {/* 灞曞紑鍚庢樉绀哄墿浣?*/}
          {historyOpen && savedSigns.slice(1).map(sign => (
            <div key={sign.id} className="oracle-saved-row">
              <span className="oracle-saved-dot" style={{ background: sign.firstColorHex }} />
              <span className="oracle-saved-dot" style={{ background: sign.secondColorHex }} />
              <span className="oracle-saved-text">{sign.firstDate} / {sign.secondDate}</span>
              <small className="oracle-saved-meta">{sign.firstColorName} 路 {sign.secondColorName}</small>
            </div>
          ))}
        </div>
      )}

      <p className="oracle-note">璇存槑锛氳繖鏄竴涓敤浜庢儏缁伒鎰熺殑杞婚噺鍔熻兘锛屼笉鏇夸唬浠讳綍涓撲笟寤鸿銆?/p>
    </section>
  );
}





