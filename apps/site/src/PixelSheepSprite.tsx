import { useEffect, useMemo, useState } from "react";

type PixelMood = "enter" | "idle" | "notice" | "expecting" | "happy" | "comfort";

type Props = {
  mood: PixelMood;
  scarfColor: string;
};

function clampHexColor(input: string): string {
  const clean = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean;
  return "#7ea9df";
}

export function PixelSheepSprite({ mood, scarfColor }: Props) {
  const [blink, setBlink] = useState(false);
  const [lookRight, setLookRight] = useState(true);

  useEffect(() => {
    const blinkLoop = () => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 140);
      window.setTimeout(blinkLoop, 2600 + Math.round(Math.random() * 2600));
    };
    const t = window.setTimeout(blinkLoop, 1400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLookRight((v) => !v);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  const scarf = useMemo(() => clampHexColor(scarfColor), [scarfColor]);
  const eyeShift = lookRight ? 1 : -1;
  const mouthY = mood === "happy" ? 40 : mood === "comfort" ? 41 : 42;
  const blushOpacity = mood === "notice" || mood === "happy" ? 1 : 0.82;
  const sleepy = mood === "comfort";

  return (
    <svg
      viewBox="0 0 64 64"
      width="64"
      height="64"
      role="img"
      aria-label="像素小羊卷"
      shapeRendering="crispEdges"
      className={`pixel-sheep pixel-mood-${mood}${sleepy ? " is-sleepy" : ""}`}
    >
      <rect x="17" y="42" width="6" height="8" fill="#d7dfed" />
      <rect x="41" y="42" width="6" height="8" fill="#d7dfed" />

      <rect x="14" y="34" width="36" height="20" rx="4" fill="#f6f4ef" />
      <rect x="14" y="46" width="36" height="8" fill="#ece8df" />
      <rect x="50" y="40" width="4" height="6" fill="#ece8df" />
      <rect x="52" y="42" width="4" height="4" fill="#d8d2c6" />

      <rect x="18" y="34" width="28" height="8" fill={scarf} />
      <rect x="34" y="40" width="5" height="8" fill={scarf} />
      <rect x="19" y="35" width="27" height="1" fill="#ffffff66" />

      <rect x="12" y="14" width="40" height="30" rx="7" fill="#fbf9f4" />
      <rect x="12" y="30" width="40" height="14" fill="#efeae0" />

      <rect x="8" y="20" width="8" height="10" fill="#f6f1e8" />
      <rect x="48" y="20" width="8" height="10" fill="#f6f1e8" />
      <rect x="10" y="22" width="4" height="6" fill="#f7dfe5" />
      <rect x="50" y="22" width="4" height="6" fill="#f7dfe5" />

      <rect x="16" y="10" width="8" height="6" rx="2" fill="#fffdf8" />
      <rect x="24" y="8" width="8" height="8" rx="2" fill="#fffdf8" />
      <rect x="32" y="8" width="8" height="8" rx="2" fill="#fffdf8" />
      <rect x="40" y="10" width="8" height="6" rx="2" fill="#fffdf8" />
      <rect x="26" y="6" width="12" height="4" rx="2" fill="#fffcf7" />

      {blink ? (
        <>
          <rect x={25 + eyeShift} y="28" width="4" height="1" fill="#1f2a44" />
          <rect x={35 + eyeShift} y="28" width="4" height="1" fill="#1f2a44" />
        </>
      ) : (
        <>
          <rect x={25 + eyeShift} y="27" width="3" height="3" fill="#1f2a44" />
          <rect x={35 + eyeShift} y="27" width="3" height="3" fill="#1f2a44" />
        </>
      )}

      <rect x="23" y="33" width="5" height="3" fill="#f7b9c2" opacity={blushOpacity} />
      <rect x="37" y="33" width="5" height="3" fill="#f7b9c2" opacity={blushOpacity} />

      <rect x="31" y={mouthY} width="2" height="1" fill="#1f2a44" />
      <rect x="30" y={mouthY + 1} width="4" height="1" fill="#1f2a44" />
      {mood === "happy" ? <rect x="29" y={mouthY + 2} width="6" height="1" fill="#1f2a44" /> : null}
    </svg>
  );
}

