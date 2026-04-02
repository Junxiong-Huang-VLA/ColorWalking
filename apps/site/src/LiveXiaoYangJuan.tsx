import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { PixelSheepSprite, type PixelSheepFrame } from "./PixelSheepSprite";

export type LiveMood = "calm" | "soft" | "happy" | "sleepy" | "shy" | "sad";
export type LiveScene = "chat" | "comfort" | "bedtime" | "mood" | "color";
export type LiveAction = "idle" | "pet" | "cuddle" | "near" | "bedtime";
export type LiveRitualPhase = "idle" | "prepare" | "drawing" | "reveal";

type Props = {
  luckyColor?: string;
  mood?: LiveMood;
  scene?: LiveScene;
  action?: LiveAction;
  statusLine: string;
  size?: number;
  ritualPhase?: LiveRitualPhase;
  keyword?: string;
  metaHidden?: boolean;
};

const SAFE_COLOR = "#7ea9df";
const MOOD_LABEL: Record<LiveMood, string> = {
  calm: "平静",
  soft: "柔和",
  happy: "开心",
  sleepy: "困困",
  shy: "害羞",
  sad: "低落"
};

const SCENE_LABEL: Record<LiveScene, string> = {
  chat: "聊天",
  comfort: "安慰",
  bedtime: "晚安",
  mood: "情绪",
  color: "幸运色"
};

function clampHexColor(input?: string): string {
  if (!input) return SAFE_COLOR;
  const clean = input.trim();
  return /^#[0-9a-fA-F]{6}$/.test(clean) ? clean : SAFE_COLOR;
}

function frameByRuntime(
  action: LiveAction,
  mood: LiveMood,
  tick: number,
  blink: boolean,
  ritualPhase: LiveRitualPhase
): PixelSheepFrame {
  if (ritualPhase === "prepare") return blink ? "blink_a" : tick % 2 === 0 ? "notice_a" : "notice_b";
  if (ritualPhase === "drawing") return tick % 2 === 0 ? "expecting_a" : "expecting_b";
  if (ritualPhase === "reveal" && action === "idle") return tick % 2 === 0 ? "happy_a" : "happy_b";

  if (action === "pet") return blink ? "blink_a" : tick % 2 === 0 ? "happy_a" : "happy_b";
  if (action === "cuddle") return blink ? "sleepy_b" : "comfort_a";
  if (action === "near") return tick % 2 === 0 ? "curious_a" : "turn_right";
  if (action === "bedtime") return tick % 2 === 0 ? "sleepy_a" : "sleepy_b";

  if (mood === "happy") return blink ? "blink_b" : tick % 3 === 0 ? "happy_a" : "idle_b";
  if (mood === "sleepy") return tick % 2 === 0 ? "sleepy_a" : "sleepy_b";
  if (mood === "sad") return blink ? "blink_a" : "comfort_a";
  if (mood === "shy") return tick % 2 === 0 ? "turn_left" : "curious_a";
  if (mood === "calm") return blink ? "blink_a" : tick % 2 === 0 ? "idle_a" : "idle_b";
  return blink ? "blink_b" : tick % 2 === 0 ? "idle_b" : "idle_a";
}

export function LiveXiaoYangJuan({
  luckyColor,
  mood = "soft",
  scene = "chat",
  action = "idle",
  statusLine,
  size = 250,
  ritualPhase = "idle",
  keyword = "",
  metaHidden = false
}: Props) {
  const [tick, setTick] = useState(0);
  const [blink, setBlink] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [responding, setResponding] = useState(false);

  const responseTimerRef = useRef<number | null>(null);
  const blinkTimerRef = useRef<number | null>(null);
  const blinkPulseRef = useRef<number | null>(null);
  const gazeTimerRef = useRef<number | null>(null);
  const lastResponseKeyRef = useRef("");

  const safeColor = useMemo(() => clampHexColor(luckyColor), [luckyColor]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((v) => v + 1), 460);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 1800 + Math.random() * 2900;
      blinkTimerRef.current = window.setTimeout(() => {
        setBlink(true);
        blinkPulseRef.current = window.setTimeout(() => {
          setBlink(false);
          if (Math.random() > 0.72) {
            window.setTimeout(() => setBlink(true), 180);
            window.setTimeout(() => setBlink(false), 330);
          }
          scheduleBlink();
        }, 120 + Math.random() * 80);
      }, delay);
    };

    scheduleBlink();
    return () => {
      if (blinkTimerRef.current) window.clearTimeout(blinkTimerRef.current);
      if (blinkPulseRef.current) window.clearTimeout(blinkPulseRef.current);
    };
  }, []);

  useEffect(() => {
    const scheduleGaze = () => {
      const delay = 1100 + Math.random() * 1500;
      gazeTimerRef.current = window.setTimeout(() => {
        const nextX = Math.round((Math.random() - 0.5) * 1.8);
        const nextY = Math.round((Math.random() - 0.5) * 1.2);
        setGaze({ x: nextX, y: nextY });
        scheduleGaze();
      }, delay);
    };

    scheduleGaze();
    return () => {
      if (gazeTimerRef.current) window.clearTimeout(gazeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const key = `${statusLine}|${safeColor}|${mood}|${scene}|${action}|${ritualPhase}|${keyword}`;
    if (lastResponseKeyRef.current === "") {
      lastResponseKeyRef.current = key;
      return;
    }
    if (lastResponseKeyRef.current === key) return;
    lastResponseKeyRef.current = key;
    setResponding(true);
    if (responseTimerRef.current) window.clearTimeout(responseTimerRef.current);
    responseTimerRef.current = window.setTimeout(() => setResponding(false), 820);
  }, [statusLine, safeColor, mood, scene, action, ritualPhase, keyword]);

  useEffect(() => {
    return () => {
      if (responseTimerRef.current) window.clearTimeout(responseTimerRef.current);
    };
  }, []);

  const frame = useMemo(
    () => frameByRuntime(action, mood, tick, blink, ritualPhase),
    [action, mood, tick, blink, ritualPhase]
  );

  const className = [
    "live-xyj",
    `live-mood-${mood}`,
    `live-scene-${scene}`,
    `live-action-${action}`,
    `ritual-${ritualPhase}`,
    responding ? "is-responding" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    "--lucky": safeColor,
    "--gaze-x": `${gaze.x}px`,
    "--gaze-y": `${gaze.y}px`
  } as CSSProperties;

  return (
    <figure className={className} style={style} aria-live="polite">
      <div className="live-xyj-atmo" aria-hidden="true" />
      <div className="live-xyj-fog" aria-hidden="true" />
      <div className="live-xyj-moon" aria-hidden="true" />
      <div className="live-xyj-core">
        <div className="live-xyj-lucky-halo" aria-hidden="true" />
        <div className="live-xyj-scarf-aura" aria-hidden="true" />
        <div className="live-xyj-rig" aria-hidden="true">
          <div className="live-xyj-rig-layer live-xyj-rig-body">
            <PixelSheepSprite frame={frame} scarfColor={safeColor} size={size} className="live-xyj-sprite live-xyj-sprite-body" />
          </div>

          <div className="live-xyj-rig-layer live-xyj-rig-scarf-chain">
            <div className="live-xyj-rig-scarf">
              <PixelSheepSprite frame={frame} scarfColor={safeColor} size={size} className="live-xyj-sprite live-xyj-sprite-scarf" />
            </div>
          </div>

          <div className="live-xyj-rig-layer live-xyj-rig-head-chain">
            <div className="live-xyj-rig-ears">
              <div className="live-xyj-rig-ear live-xyj-rig-ear-left">
                <PixelSheepSprite frame={frame} scarfColor={safeColor} size={size} className="live-xyj-sprite live-xyj-sprite-ear-left" />
              </div>
              <div className="live-xyj-rig-ear live-xyj-rig-ear-right">
                <PixelSheepSprite frame={frame} scarfColor={safeColor} size={size} className="live-xyj-sprite live-xyj-sprite-ear-right" />
              </div>
            </div>

            <div className="live-xyj-rig-head">
              <PixelSheepSprite frame={frame} scarfColor={safeColor} size={size} className="live-xyj-sprite live-xyj-sprite-head" />
            </div>
          </div>
        </div>
        <span className={`live-xyj-eye live-xyj-eye-left${blink ? " is-blink" : ""}`} aria-hidden="true" />
        <span className={`live-xyj-eye live-xyj-eye-right${blink ? " is-blink" : ""}`} aria-hidden="true" />
      </div>
      <figcaption className="live-xyj-caption">
        <p className="live-xyj-status">{statusLine}</p>
        {keyword ? <p className="live-xyj-keyword">今日关键词 · {keyword}</p> : null}
        {!metaHidden ? (
          <p className="live-xyj-meta">
            {MOOD_LABEL[mood]} · {SCENE_LABEL[scene]}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}
