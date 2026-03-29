import { FormEvent, useMemo, useState } from "react";
import { FUTURE_LABS, FUTURE_ROADMAP } from "./config/brandWorld";

const WAITLIST_KEY = "colorwalking.future.waitlist.v1";

function readWaitlistCount(): number {
  try {
    const raw = localStorage.getItem(WAITLIST_KEY);
    if (!raw) return 0;
    const list = JSON.parse(raw) as Array<{ email: string; at: string }>;
    return list.length;
  } catch {
    return 0;
  }
}

export function FuturePage() {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState("");
  const [count, setCount] = useState(() => readWaitlistCount());
  const quarter = useMemo(() => Math.floor((new Date().getMonth() + 3) / 3), []);

  const onJoin = (e: FormEvent) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!mail || !mail.includes("@")) {
      setSaved("请输入可用邮箱。");
      return;
    }
    try {
      const raw = localStorage.getItem(WAITLIST_KEY);
      const list = raw ? (JSON.parse(raw) as Array<{ email: string; at: string }>) : [];
      if (!list.find((x) => x.email === mail)) {
        list.unshift({ email: mail, at: new Date().toISOString() });
        localStorage.setItem(WAITLIST_KEY, JSON.stringify(list.slice(0, 500)));
      }
      setCount(list.length);
      setSaved("已加入未来计划提醒名单。我们会在新企划上线时通知你。");
      setEmail("");
    } catch {
      setSaved("保存失败，请稍后重试。");
    }
  };

  return (
    <div className="cw-page-stack">
      <section className="section cw-card">
        <h2>Future / 陪伴未来</h2>
        <p>这一页是 ColorWalking 的商业延展承载层，先展示方向，后续逐步落地预约、发售与活动。</p>
      </section>

      <section className="section cw-card">
        <h2>路线图</h2>
        <div className="cw-roadmap">
          {FUTURE_ROADMAP.map((item) => (
            <article key={item.stage + item.title}>
              <span>{item.stage}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cw-future-grid">
          {FUTURE_LABS.map((item) => (
            <article key={item.title} className="cw-card">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section cw-card">
        <h2>企划提醒订阅（基础版）</h2>
        <p>当前季度：Q{quarter} · 已有 {count} 位用户加入提醒名单。</p>
        <form className="cw-waitlist-form" onSubmit={onJoin}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="输入邮箱，例如 you@example.com" />
          <button type="submit">加入提醒</button>
        </form>
        {saved ? <p className="cw-waitlist-msg">{saved}</p> : null}
      </section>
    </div>
  );
}
