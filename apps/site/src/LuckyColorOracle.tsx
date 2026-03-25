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
  wood: "\u6728",
  fire: "\u706b",
  earth: "\u571f",
  metal: "\u91d1",
  water: "\u6c34"
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
        {"\u9ec4\u5386\u65e5\u52bf\uff1a"}{ELEMENT_LABEL[item.dayElement]}{" / \u65e5\u52a9\uff1a"}
        {ELEMENT_LABEL[item.supportElement]}{" / \u5efa\u8bae\uff1a"}{ELEMENT_LABEL[item.luckyElement]}
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
      <h2>{"\u9ec4\u5386 + \u751f\u8fb0\u5e78\u8fd0\u8272"}</h2>
      <p className="oracle-desc">
        {
          "\u8f93\u5165\u751f\u65e5\u4e0e\u51fa\u751f\u65f6\u6bb5\uff0c\u7ed3\u5408\u9ec4\u5386\u65e5\u52bf\u505a\u6bcf\u65e5\u5e78\u8fd0\u8272\u5efa\u8bae\uff1b\u53ef\u56fa\u5b9a\u6bd4\u8f83\u4e24\u5929\uff0c\u89c2\u5bdf\u60c5\u7eea\u8272\u5f69\u53d8\u5316\u3002"
        }
      </p>

      <div className="oracle-form-grid">
        <label>
          {"\u751f\u65e5"}
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        </label>

        <label>
          {"\u51fa\u751f\u65f6\u6bb5"}
          <select value={birthHour} onChange={(e) => setBirthHour(Number(e.target.value))}>
            <option value={0}>{"\u5b50\u65f6\uff0823:00-00:59\uff09"}</option>
            <option value={2}>{"\u4e11\u65f6\uff0801:00-02:59\uff09"}</option>
            <option value={4}>{"\u5bc5\u65f6\uff0803:00-04:59\uff09"}</option>
            <option value={6}>{"\u536f\u65f6\uff0805:00-06:59\uff09"}</option>
            <option value={8}>{"\u8fb0\u65f6\uff0807:00-08:59\uff09"}</option>
            <option value={10}>{"\u5df3\u65f6\uff0809:00-10:59\uff09"}</option>
            <option value={12}>{"\u5348\u65f6\uff0811:00-12:59\uff09"}</option>
            <option value={14}>{"\u672a\u65f6\uff0813:00-14:59\uff09"}</option>
            <option value={16}>{"\u7533\u65f6\uff0815:00-16:59\uff09"}</option>
            <option value={18}>{"\u9149\u65f6\uff0817:00-18:59\uff09"}</option>
            <option value={20}>{"\u620c\u65f6\uff0819:00-20:59\uff09"}</option>
            <option value={22}>{"\u4ea5\u65f6\uff0821:00-22:59\uff09"}</option>
          </select>
        </label>

        <label>
          {"\u5bf9\u6bd4\u65e5\u671f A"}
          <input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
        </label>

        <label>
          {"\u5bf9\u6bd4\u65e5\u671f B"}
          <input type="date" value={secondDate} onChange={(e) => setSecondDate(e.target.value)} />
        </label>
      </div>

      {result ? (
        <>
          <div className="oracle-compare-head">
            <b>{result.sameColor ? "\u4e24\u5929\u5e78\u8fd0\u8272\u4e00\u81f4" : "\u4e24\u5929\u5e78\u8fd0\u8272\u4e0d\u540c"}</b>
            <span>{result.sameColor ? "\u9002\u5408\u5efa\u7acb\u8fde\u7eed\u4e60\u60ef" : "\u9002\u5408\u505a\u5bf9\u6bd4\u590d\u76d8"}</span>
          </div>
          <div className="oracle-results-grid">
            <ResultCard title={"\u65e5\u671f A"} item={result.first} />
            <ResultCard title={"\u65e5\u671f B"} item={result.second} />
          </div>
        </>
      ) : null}

      <p className="oracle-note">
        {"\u8bf4\u660e\uff1a\u672c\u529f\u80fd\u4e3a\u6587\u5316\u7075\u611f\u4e0e\u60c5\u7eea\u6fc0\u52b1\u7528\u9014\uff0c\u4e0d\u4f5c\u4e3a\u4e13\u4e1a\u547d\u7406\u6216\u533b\u5b66\u5efa\u8bae\u3002"}
      </p>
    </section>
  );
}
