import { useEffect, useMemo, useState, type FormEvent } from "react";
import { buildRelationshipNarrative, loadLifeState, onLifeStateUpdate, submitWaitlist } from "./digitalLifeState";
import { LiveXiaoYangJuan } from "./LiveXiaoYangJuan";
import { ROUTE_PATHS } from "./config/brandWorld";

export function FuturePage() {
  const [life, setLife] = useState(() => loadLifeState());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState("想参加首演体验");
  const [submitMsg, setSubmitMsg] = useState("");

  const narrative = useMemo(() => buildRelationshipNarrative(life), [life]);
  const latest = life.memoryState[0];

  useEffect(() => onLifeStateUpdate((state) => setLife(state)), []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setSubmitMsg("请先留下名字和邮箱。\n");
      return;
    }
    const next = submitWaitlist({ name: name.trim(), email: email.trim(), intent: intent.trim() || "想参加首演体验" });
    setLife(next);
    setSubmitMsg("已加入候补名单，小羊卷下一次成长会第一时间叫你。\n");
  };

  return (
    <div className="brand-shell growth-page">
      <section className="section growth-stage">
        <LiveXiaoYangJuan
          luckyColor={life.sheepState.luckyColorHex}
          mood={life.sheepState.mood}
          scene={life.sheepState.scene}
          statusLine={`${narrative.stageLine}。${narrative.nextLine}`}
          keyword={latest?.keyword ?? "陪伴持续发生"}
          size={228}
          metaHidden
        />
        <p className="growth-stage-line">{narrative.stageLine}</p>
        <p className="growth-next-line">{narrative.nextLine}</p>

        <div className="growth-traits">
          {life.growthState.traits.slice(0, 4).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <p className="growth-memory-anchor">
          {latest ? `最近一次你们共同经历：${latest.line}` : "你们还没有记忆沉淀，先从一次抽色开始。"}
        </p>
      </section>

      <section className="section growth-waitlist">
        <h2>下一次首演，想第一时间收到吗？</h2>
        <p>把邮箱留在这里，后续首演、内测和陪伴更新会优先通知你。</p>
        <form className="growth-waitlist-form" onSubmit={onSubmit}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的称呼"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            type="email"
          />
          <input
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="你更想看到什么陪伴能力"
          />
          <button type="submit">加入候补名单</button>
        </form>
        {submitMsg ? <p className="growth-waitlist-msg">{submitMsg}</p> : null}
      </section>

      <p className="growth-soft-links">
        <a href={ROUTE_PATHS.home}>回到生命舞台</a>
        <span>·</span>
        <a href={`${ROUTE_PATHS.home}?premiere=1`}>进入首演模式</a>
        <span>·</span>
        <a href={ROUTE_PATHS.about}>查看共同记忆</a>
      </p>
    </div>
  );
}
