import type { EyeState } from "@colorwalking/shared";
import { useId, type CSSProperties } from "react";
import type { InteractionScene, SheepEmotion, SheepExpression, SheepMotion } from "../../../state/types";
import { deriveEyeState } from "../stateLabels";
import { runtimeMotionClass, runtimeMotionHint, runtimeMotionProfile } from "./liveSheepMotion";
import { LIVE_EMOTION_VISUAL_MAP, LIVE_EXPRESSION_TAG_MAP, LIVE_SCENE_LABEL_MAP } from "./liveSheepVisualMap";

type LiveSheepRuntimeProps = {
  scarfColorHex: string;
  eyeColorHex: string;
  emotion: SheepEmotion;
  expression: SheepExpression;
  motion: SheepMotion;
  scene: InteractionScene;
  emotionLevel: number;
  eyeState?: EyeState;
  size?: "hero" | "compact";
  minimal?: boolean;
};

function eyeStateClass(eyeState: EyeState): string {
  if (eyeState === "closed") return "live-eye-closed";
  if (eyeState === "half_closed") return "live-eye-half";
  return "live-eye-open";
}

export function LiveSheepRuntime({
  scarfColorHex,
  eyeColorHex,
  emotion,
  expression,
  motion,
  scene,
  emotionLevel,
  eyeState,
  size = "compact",
  minimal = false
}: LiveSheepRuntimeProps) {
  const gradientIdSeed = useId().replace(/:/g, "_");
  const eyeGlowId = `${gradientIdSeed}-live-eye-glow`;
  const bodyGradId = `${gradientIdSeed}-live-body-grad`;
  const woolGradId = `${gradientIdSeed}-live-wool-grad`;
  const scarfGradId = `${gradientIdSeed}-live-scarf-grad`;

  const resolvedEyeState = eyeState ?? deriveEyeState(emotion, expression);
  const emotionVisual = LIVE_EMOTION_VISUAL_MAP[emotion];
  const motionHint = runtimeMotionHint(motion);
  const motionProfile = runtimeMotionProfile(motion);
  const sceneTag = LIVE_SCENE_LABEL_MAP[scene];

  const normalizedEnergy = Math.max(0.2, Math.min(1, emotionLevel / 100));
  const headTilt = motionProfile.headNodDeg + emotionVisual.headTiltDeg;

  const style = {
    "--live-eye-color": eyeColorHex,
    "--live-scarf-color": scarfColorHex,
    "--live-aura-color": emotionVisual.auraColor,
    "--live-eye-glow-opacity": emotionVisual.eyeGlowOpacity,
    "--live-blush-opacity": emotionVisual.blushOpacity,
    "--live-blush-color": emotionVisual.blushColor,
    "--live-energy": normalizedEnergy.toFixed(2),
    "--live-product-image": "url('/images/products/official/sheep-roll-official.jpg')",
    "--live-eye-scale": emotionVisual.eyeScale.toFixed(2),
    "--live-scarf-light-opacity": emotionVisual.scarfLightOpacity.toFixed(2),
    "--live-body-sway": `${motionProfile.bodySwayDeg.toFixed(2)}deg`,
    "--live-head-nod": `${headTilt.toFixed(2)}deg`,
    "--live-scarf-swing": `${motionProfile.scarfSwingDeg.toFixed(2)}deg`,
    "--live-bounce": `${motionProfile.bouncePx.toFixed(2)}px`,
    "--live-rig-tempo": `${motionProfile.rigTempoSec.toFixed(2)}s`
  } as CSSProperties;

  const mouthPath =
    emotionVisual.mouthCurvature >= 0
      ? `M 117 136 Q 132 ${146 - emotionVisual.mouthCurvature * 14} 147 136`
      : `M 117 142 Q 132 ${136 - emotionVisual.mouthCurvature * 15} 147 142`;

  return (
    <figure
      className={`live-sheep-runtime live-size-${size} scene-${sceneTag} ${runtimeMotionClass(motion)} ${eyeStateClass(resolvedEyeState)}`}
      style={style}
      role="img"
      aria-label="live-xiao-yang-juan"
      data-testid="live-sheep-runtime"
    >
      <div className="live-sheep-product-layer" aria-hidden="true" />
      <div className="live-sheep-aura" aria-hidden="true" />
      <div className="live-sheep-clouds" aria-hidden="true">
        <span className="cloud cloud-1" />
        <span className="cloud cloud-2" />
        <span className="cloud cloud-3" />
      </div>

      <div className="live-sheep-stage" aria-hidden="true">
        <div className="live-sheep-shadow" />
        <svg viewBox="0 0 280 240" className="live-sheep-svg">
          <defs>
            <radialGradient id={eyeGlowId} cx="50%" cy="50%" r="64%">
              <stop offset="0%" stopColor={eyeColorHex} stopOpacity="0.98" />
              <stop offset="100%" stopColor={eyeColorHex} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={bodyGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fffefb" />
              <stop offset="100%" stopColor="#f6ecdc" />
            </linearGradient>
            <linearGradient id={woolGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f5ecdf" />
            </linearGradient>
            <linearGradient id={scarfGradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff7f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor={scarfColorHex} stopOpacity="1" />
            </linearGradient>
          </defs>

          <g className="live-rig-root">
            <g className="live-bone-body">
              <ellipse cx="140" cy="154" rx="94" ry="66" fill={`url(#${bodyGradId})`} stroke="#e8ddce" strokeWidth="4" />
              <ellipse cx="140" cy="164" rx="63" ry="48" fill="#fff6e8" stroke="#e9ddcf" strokeWidth="3" />
              <ellipse cx="103" cy="206" rx="19" ry="11" fill="#f6ead9" stroke="#e6d9ca" strokeWidth="2" />
              <ellipse cx="178" cy="206" rx="19" ry="11" fill="#f6ead9" stroke="#e6d9ca" strokeWidth="2" />
              <ellipse cx="208" cy="166" rx="16" ry="22" fill="#f8eee1" stroke="#e9dece" strokeWidth="2.6" />
            </g>

            <g className="live-bone-head">
              <ellipse cx="95" cy="88" rx="17" ry="26" fill="#fbf2e5" stroke="#eadfcd" strokeWidth="2.8" />
              <ellipse cx="185" cy="88" rx="17" ry="26" fill="#fbf2e5" stroke="#eadfcd" strokeWidth="2.8" />

              <g className="live-wool-puffs">
                <circle cx="86" cy="70" r="18" fill={`url(#${woolGradId})`} stroke="#efe5d8" strokeWidth="3" />
                <circle cx="112" cy="56" r="21" fill={`url(#${woolGradId})`} stroke="#efe5d8" strokeWidth="3" />
                <circle cx="140" cy="52" r="24" fill={`url(#${woolGradId})`} stroke="#efe5d8" strokeWidth="3" />
                <circle cx="168" cy="56" r="21" fill={`url(#${woolGradId})`} stroke="#efe5d8" strokeWidth="3" />
                <circle cx="194" cy="70" r="18" fill={`url(#${woolGradId})`} stroke="#efe5d8" strokeWidth="3" />
              </g>

              <ellipse cx="140" cy="122" rx="60" ry="53" fill="#fffaf2" stroke="#ecdfce" strokeWidth="3.4" />

              <g className="live-eye-glow-layer" opacity="var(--live-eye-glow-opacity)">
                <circle cx="118" cy="120" r="22" fill={`url(#${eyeGlowId})`} />
                <circle cx="147" cy="120" r="22" fill={`url(#${eyeGlowId})`} />
              </g>

              <g className="live-eyes-layer">
                <ellipse className="live-eye-shape" cx="118" cy="120" rx="8" ry="10" fill={eyeColorHex} />
                <ellipse className="live-eye-shape" cx="147" cy="120" rx="8" ry="10" fill={eyeColorHex} />
                <circle cx="120" cy="118" r="2.2" fill="#ffffff" opacity="0.95" />
                <circle cx="149" cy="118" r="2.2" fill="#ffffff" opacity="0.95" />
              </g>

              <g className="live-blush-layer" opacity="var(--live-blush-opacity)">
                <ellipse cx="104" cy="136" rx="11" ry="5.5" fill="var(--live-blush-color)" />
                <ellipse cx="161" cy="136" rx="11" ry="5.5" fill="var(--live-blush-color)" />
              </g>

              <ellipse cx="132" cy="132" rx="2.6" ry="1.8" fill="#61525d" opacity="0.9" />
              <path d={mouthPath} fill="none" stroke="#4f4350" strokeWidth="3.4" strokeLinecap="round" />
            </g>

            <g className="live-bone-scarf">
              <path
                d="M74 146 C95 174, 186 174, 206 146"
                fill="none"
                stroke={scarfColorHex}
                strokeWidth="15"
                strokeLinecap="round"
              />
              <path
                d="M74 146 C95 174, 186 174, 206 146"
                fill="none"
                stroke={`url(#${scarfGradId})`}
                strokeWidth="10"
                strokeLinecap="round"
                opacity="var(--live-scarf-light-opacity)"
              />
              <path d="M124 148 L118 188" fill="none" stroke={scarfColorHex} strokeWidth="10" strokeLinecap="round" />
              <path d="M147 148 L158 186" fill="none" stroke={scarfColorHex} strokeWidth="10" strokeLinecap="round" />
            </g>
          </g>
        </svg>
      </div>

      <div className="live-sheep-gloss" aria-hidden="true" />

      {minimal ? null : (
        <figcaption className="live-sheep-caption">
          <span>{emotionVisual.statusTag}</span>
          <span>{LIVE_EXPRESSION_TAG_MAP[expression]}</span>
          <span>{motionHint}</span>
          <span>{sceneTag}</span>
        </figcaption>
      )}
    </figure>
  );
}
