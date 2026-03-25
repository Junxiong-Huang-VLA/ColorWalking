import { useMemo, useState } from "react";
import { COLOR_PALETTE, formatDayKey } from "@colorwalking/shared";

type PetState = {
  name: string;
  level: number;
  xp: number;
  hunger: number;
  energy: number;
  cleanliness: number;
  mood: number;
  favoriteColorId: string;
  lastUpdatedAt: string;
};

type WheelHistoryItem = {
  dayKey: string;
  color?: { id?: string; name?: string; hex?: string };
};

type PetAction = "idle" | "feed" | "play" | "rest" | "groom" | "pet";

const PET_KEY = "colorwalking.pet.v1";
const LEVEL_XP = 100;

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function calcMood(hunger: number, energy: number, cleanliness: number, level: number): number {
  const score = 20 + (100 - hunger) * 0.35 + energy * 0.3 + cleanliness * 0.25 + level * 1.2;
  return clamp(Math.round(score));
}

function defaultPet(): PetState {
  const favorite = COLOR_PALETTE[0]?.id ?? "sunrise-coral";
  return {
    name: "\u5c0f\u7f8a\u5377",
    level: 1,
    xp: 0,
    hunger: 25,
    energy: 75,
    cleanliness: 80,
    mood: 85,
    favoriteColorId: favorite,
    lastUpdatedAt: new Date().toISOString()
  };
}

function applyDecay(state: PetState): PetState {
  const now = Date.now();
  const prev = new Date(state.lastUpdatedAt).getTime();
  if (!Number.isFinite(prev) || prev >= now) return { ...state, lastUpdatedAt: new Date(now).toISOString() };

  const hours = (now - prev) / 3600000;
  if (hours < 0.01) return state;

  const hunger = clamp(state.hunger + hours * 3.4);
  const energy = clamp(state.energy - hours * 2.6);
  const cleanliness = clamp(state.cleanliness - hours * 2.2);
  const mood = calcMood(hunger, energy, cleanliness, state.level);

  return {
    ...state,
    hunger,
    energy,
    cleanliness,
    mood,
    lastUpdatedAt: new Date(now).toISOString()
  };
}

function loadPet(): PetState {
  try {
    const raw = localStorage.getItem(PET_KEY);
    if (!raw) return defaultPet();
    const parsed = JSON.parse(raw) as PetState;
    const merged: PetState = {
      ...defaultPet(),
      ...parsed
    };
    return applyDecay(merged);
  } catch {
    return defaultPet();
  }
}

function savePet(state: PetState) {
  localStorage.setItem(PET_KEY, JSON.stringify(state));
}

function gainXp(state: PetState, amount: number): PetState {
  let xp = state.xp + amount;
  let level = state.level;
  while (xp >= LEVEL_XP) {
    xp -= LEVEL_XP;
    level += 1;
  }
  return { ...state, level, xp };
}

function todayLuckyColorId(): string | null {
  try {
    const raw = localStorage.getItem("colorwalking.web.history.v1");
    if (!raw) return null;
    const list = JSON.parse(raw) as WheelHistoryItem[];
    const today = formatDayKey(new Date());
    const item = list.find((x) => x?.dayKey === today);
    return item?.color?.id ?? null;
  } catch {
    return null;
  }
}

function moodText(mood: number): string {
  if (mood >= 85) return "\u4eca\u5929\u7f8a\u5377\u8d85\u5f00\u5fc3\uff0c\u60f3\u8ddf\u4f60\u51fa\u95e8\u6563\u6b65\u3002";
  if (mood >= 65) return "\u72b6\u6001\u4e0d\u9519\uff0c\u518d\u7167\u987e\u4e00\u4e0b\u5c31\u66f4\u597d\u5566\u3002";
  if (mood >= 40) return "\u7f8a\u5377\u6709\u70b9\u7d2f\uff0c\u9700\u8981\u4f60\u55c2\u4e00\u55c2\u3002";
  return "\u7f8a\u5377\u60c5\u7eea\u4f4e\u843d\uff0c\u5feb\u55c2\u5b83\u3001\u966a\u5b83\u73a9\u3002";
}

function reactionByAction(action: PetAction): string {
  if (action === "feed") return "\ud83c\udf3f";
  if (action === "play") return "\ud83c\udf89";
  if (action === "rest") return "\ud83d\udca4";
  if (action === "groom") return "\u2728";
  return "\ud83d\udc95";
}

export function SheepPetGarden() {
  const [pet, setPet] = useState<PetState>(() => loadPet());
  const [hint, setHint] = useState("\u6b22\u8fce\u6765\u5230\u5c0f\u7f8a\u5377\u517b\u6210\u8231\uff0c\u6bcf\u5929\u6765\u4e00\u6b21\uff0c\u5b83\u4f1a\u66f4\u4f9d\u8d56\u4f60\u3002");
  const [petAction, setPetAction] = useState<PetAction>("idle");
  const [reaction, setReaction] = useState("");

  const favoriteColor = useMemo(
    () => COLOR_PALETTE.find((c) => c.id === pet.favoriteColorId) ?? COLOR_PALETTE[0],
    [pet.favoriteColorId]
  );

  const eyesClosed = pet.energy < 22;
  const smileWide = pet.mood >= 70;

  const triggerAction = (action: PetAction) => {
    setPetAction(action);
    setReaction(reactionByAction(action));
    window.setTimeout(() => setPetAction("idle"), 900);
    window.setTimeout(() => setReaction(""), 1100);
  };

  const runAction = (action: PetAction, updater: (state: PetState) => PetState, message: string) => {
    triggerAction(action);
    setPet((prev) => {
      const decayed = applyDecay(prev);
      const nextBase = updater(decayed);
      const mood = calcMood(nextBase.hunger, nextBase.energy, nextBase.cleanliness, nextBase.level);
      const next = { ...nextBase, mood, lastUpdatedAt: new Date().toISOString() };
      savePet(next);
      return next;
    });
    setHint(message);
  };

  const feed = () =>
    runAction(
      "feed",
      (s) => gainXp({ ...s, hunger: clamp(s.hunger - 24), energy: clamp(s.energy + 4) }, 14),
      "\u4f60\u559d\u4e86\u4e00\u7897\u5f69\u8679\u8349\u6599\uff0c\u5c0f\u7f8a\u5377\u7acb\u523b\u7cbe\u795e\u4e86\u3002"
    );

  const play = () =>
    runAction(
      "play",
      (s) =>
        gainXp(
          {
            ...s,
            hunger: clamp(s.hunger + 8),
            energy: clamp(s.energy - 14),
            cleanliness: clamp(s.cleanliness - 6)
          },
          20
        ),
      "\u4f60\u966a\u5b83\u8dd1\u5708\u73a9\u7403\uff0c\u6bdb\u5377\u98de\u8d77\u6765\u4e86\u3002"
    );

  const rest = () =>
    runAction(
      "rest",
      (s) => gainXp({ ...s, energy: clamp(s.energy + 26), hunger: clamp(s.hunger + 4) }, 10),
      "\u5c0f\u7f8a\u5377\u6253\u4e86\u4e2a\u5c0f\u76f9\uff0c\u72b6\u6001\u56de\u6765\u4e86\u3002"
    );

  const groom = () =>
    runAction(
      "groom",
      (s) => gainXp({ ...s, cleanliness: clamp(s.cleanliness + 24), mood: clamp(s.mood + 8) }, 12),
      "\u4f60\u5e2e\u5b83\u68b3\u7406\u4e86\u5377\u6bdb\uff0c\u5b83\u770b\u8d77\u6765\u95ea\u95ea\u53d1\u5149\u3002"
    );

  const petHead = () =>
    runAction(
      "pet",
      (s) => gainXp({ ...s, mood: clamp(s.mood + 6), energy: clamp(s.energy + 2) }, 6),
      "\u5c0f\u7f8a\u5377\u88ab\u4f60\u6478\u5f00\u5fc3\u4e86\uff0c\u5c3e\u5df4\u5728\u8f7b\u8f7b\u6447\u3002"
    );

  const syncLuckyColor = () => {
    const colorId = todayLuckyColorId();
    if (!colorId) {
      setHint("\u4eca\u5929\u8fd8\u6ca1\u6709\u62bd\u5e78\u8fd0\u8272\uff0c\u5148\u53bb\u8f6c\u76d8\u62bd\u4e00\u6b21\u5427\u3002");
      return;
    }

    runAction(
      "pet",
      (s) => gainXp({ ...s, favoriteColorId: colorId, mood: clamp(s.mood + 12) }, 18),
      "\u5c0f\u7f8a\u5377\u6234\u4e0a\u4e86\u4eca\u65e5\u5e78\u8fd0\u8272\u56f4\u5dfe\uff0c\u5fc3\u60c5\u7206\u68da\u3002"
    );
  };

  const xpPercent = Math.round((pet.xp / LEVEL_XP) * 100);

  return (
    <section id="pet" className="section pet-card">
      <h2>{"\u5c0f\u7f8a\u5377\u517b\u6210\u8231"}</h2>
      <p className="pet-desc">{"\u6bcf\u5929\u7167\u987e\u4e00\u4e0b\u4f60\u7684\u5c0f\u7f8a\u5377\uff0c\u5b83\u4f1a\u968f\u7740\u4f60\u7684\u966a\u4f34\u4e00\u8d77\u957f\u5927\u3002\u8bd5\u8bd5\u70b9\u51fb\u5b83\u6765\u6478\u5934\u4e92\u52a8\u3002"}</p>

      <div className="pet-layout">
        <div className="pet-avatar-box">
          <button
            type="button"
            className={`pet-avatar pet-${petAction}`}
            style={{ ["--accent" as string]: favoriteColor?.hex ?? "#ffd93d" }}
            onClick={petHead}
            aria-label={"\u6478\u6478\u5c0f\u7f8a\u5377"}
          >
            {reaction ? <span className="pet-reaction">{reaction}</span> : null}
            <svg viewBox="0 0 240 190" role="img" aria-label="sheep-roll">
              <ellipse cx="120" cy="108" rx="84" ry="62" fill="#fff" stroke="#e5ecf7" strokeWidth="4" />
              <circle cx="78" cy="78" r="16" fill="#f7f1e8" />
              <circle cx="162" cy="78" r="16" fill="#f7f1e8" />
              <circle cx="120" cy="108" r="42" fill="#fdfbf7" stroke="#edf2fb" strokeWidth="3" />
              {eyesClosed ? (
                <>
                  <path d="M101 102 L111 102" stroke="#1f2a44" strokeWidth="3" strokeLinecap="round" />
                  <path d="M129 102 L139 102" stroke="#1f2a44" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="106" cy="102" r="4" fill="#1f2a44" className="pet-eye" />
                  <circle cx="134" cy="102" r="4" fill="#1f2a44" className="pet-eye" />
                </>
              )}
              {smileWide ? (
                <path d="M102 120 Q120 142 138 120" fill="none" stroke="#1f2a44" strokeWidth="4" strokeLinecap="round" />
              ) : (
                <path d="M106 124 Q120 132 134 124" fill="none" stroke="#1f2a44" strokeWidth="4" strokeLinecap="round" />
              )}
              <path d="M63 52 C90 24, 150 24, 177 52" fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" />
              <path d="M95 56 C104 47, 113 47, 122 56" fill="none" stroke="#7db5ff" strokeWidth="5" strokeLinecap="round" />
              <path d="M118 58 C127 49, 136 49, 145 58" fill="none" stroke="#ffd76f" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </button>
          <p className="pet-name">{pet.name} · Lv.{pet.level}</p>
          <p className="pet-mood">{moodText(pet.mood)}</p>
        </div>

        <div className="pet-panel">
          <div className="pet-meter">
            <span>{"\u7ecf\u9a8c"}</span>
            <div><i style={{ width: `${xpPercent}%` }} /></div>
            <b>{pet.xp}/{LEVEL_XP}</b>
          </div>
          <div className="pet-meter">
            <span>{"\u5fc3\u60c5"}</span>
            <div><i style={{ width: `${pet.mood}%` }} /></div>
            <b>{pet.mood}</b>
          </div>
          <div className="pet-meter">
            <span>{"\u9965\u997f"}</span>
            <div><i style={{ width: `${pet.hunger}%` }} /></div>
            <b>{pet.hunger}</b>
          </div>
          <div className="pet-meter">
            <span>{"\u7cbe\u529b"}</span>
            <div><i style={{ width: `${pet.energy}%` }} /></div>
            <b>{pet.energy}</b>
          </div>
          <div className="pet-meter">
            <span>{"\u6f54\u51c0"}</span>
            <div><i style={{ width: `${pet.cleanliness}%` }} /></div>
            <b>{pet.cleanliness}</b>
          </div>

          <div className="pet-actions">
            <button type="button" onClick={feed}>{"\u5582\u98df"}</button>
            <button type="button" onClick={play}>{"\u73a9\u8013"}</button>
            <button type="button" onClick={rest}>{"\u4f11\u606f"}</button>
            <button type="button" onClick={groom}>{"\u68b3\u6bdb"}</button>
            <button type="button" className="pet-lucky" onClick={syncLuckyColor}>{"\u540c\u6b65\u4eca\u65e5\u5e78\u8fd0\u8272"}</button>
          </div>
          <p className="pet-hint">{hint}</p>
        </div>
      </div>
    </section>
  );
}
