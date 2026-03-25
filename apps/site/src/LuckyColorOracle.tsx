import { useMemo, useState } from "react";
import {
  compareTwoDays,
  type BirthProfile,
  type FiveElement,
  type FortuneInsight
} from "@colorwalking/shared";

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

function ResultCard({ title, item }: { title: string; item: FortuneInsight }) {
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
        黄历日势：{ELEMENT_LABEL[item.dayElement]} / 日助：{ELEMENT_LABEL[item.supportElement]} / 建议：{ELEMENT_LABEL[item.luckyElement]}
      </p>
      <p className="oracle-summary">{item.summary}</p>
      <p className="oracle-message">{item.luckyColor.message}</p>
    </article>
  );
}

export function LuckyColorOracle() {
  const [birthday, setBirthday] = useState("1998-08-08");
  const [birthHour, setBirthHour] = useState(9);
  const [firstDate, setFirstDate] = useState(todayText(0));
  const [secondDate, setSecondDate] = useState(todayText(1));

  const result = useMemo(() => {
    if (!birthday || !firstDate || !secondDate) return null;
    const profile: BirthProfile = { birthday, birthHour };
    return compareTwoDays(profile, new Date(`${firstDate}T00:00:00`), new Date(`${secondDate}T00:00:00`));
  }, [birthday, birthHour, firstDate, secondDate]);

  return (
    <section id="oracle" className="section oracle-card">
      <h2>黄历 + 生辰幸运色</h2>
      <p className="oracle-desc">
        输入生日与出生时段，结合黄历日势做每日幸运色建议；可固定比较两天，观察情绪色彩变化。
      </p>

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

      {result ? (
        <>
          <div className="oracle-compare-head">
            <b>{result.sameColor ? "两天幸运色一致" : "两天幸运色不同"}</b>
            <span>{result.sameColor ? "适合建立连续习惯" : "适合做对比复盘"}</span>
          </div>
          <div className="oracle-results-grid">
            <ResultCard title="日期 A" item={result.first} />
            <ResultCard title="日期 B" item={result.second} />
          </div>
        </>
      ) : null}

      <p className="oracle-note">说明：本功能为文化灵感与情绪激励用途，不作为专业命理或医学建议。</p>
    </section>
  );
}
