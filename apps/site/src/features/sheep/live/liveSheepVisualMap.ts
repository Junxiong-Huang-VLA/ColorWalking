import type { InteractionScene, SheepEmotion, SheepExpression } from "../../../state/types";

export type LiveEmotionVisual = {
  eyeGlowOpacity: number;
  blushOpacity: number;
  blushColor: string;
  mouthCurvature: number;
  auraColor: string;
  statusTag: string;
  eyeScale: number;
  headTiltDeg: number;
  scarfLightOpacity: number;
};

export const LIVE_EMOTION_VISUAL_MAP: Record<SheepEmotion, LiveEmotionVisual> = {
  calm: {
    eyeGlowOpacity: 0.42,
    blushOpacity: 0.12,
    blushColor: "#f2bbc0",
    mouthCurvature: 0.1,
    auraColor: "#e4ecfb",
    statusTag: "平静",
    eyeScale: 0.96,
    headTiltDeg: 0.4,
    scarfLightOpacity: 0.32
  },
  soft: {
    eyeGlowOpacity: 0.52,
    blushOpacity: 0.24,
    blushColor: "#f3b0c3",
    mouthCurvature: 0.18,
    auraColor: "#f7e8f7",
    statusTag: "柔软",
    eyeScale: 1,
    headTiltDeg: 1.2,
    scarfLightOpacity: 0.4
  },
  happy: {
    eyeGlowOpacity: 0.62,
    blushOpacity: 0.3,
    blushColor: "#f5b09f",
    mouthCurvature: 0.34,
    auraColor: "#ffe9cf",
    statusTag: "开心",
    eyeScale: 1.06,
    headTiltDeg: 1.8,
    scarfLightOpacity: 0.48
  },
  sleepy: {
    eyeGlowOpacity: 0.34,
    blushOpacity: 0.14,
    blushColor: "#d9c6d3",
    mouthCurvature: 0.06,
    auraColor: "#dfe3f4",
    statusTag: "困倦",
    eyeScale: 0.82,
    headTiltDeg: -0.8,
    scarfLightOpacity: 0.26
  },
  shy: {
    eyeGlowOpacity: 0.48,
    blushOpacity: 0.36,
    blushColor: "#f4a7bc",
    mouthCurvature: 0.2,
    auraColor: "#f7e4ed",
    statusTag: "害羞",
    eyeScale: 0.92,
    headTiltDeg: 2.4,
    scarfLightOpacity: 0.42
  },
  sad: {
    eyeGlowOpacity: 0.28,
    blushOpacity: 0.1,
    blushColor: "#d2c7d0",
    mouthCurvature: -0.16,
    auraColor: "#d8dfef",
    statusTag: "难过",
    eyeScale: 0.78,
    headTiltDeg: -1.6,
    scarfLightOpacity: 0.24
  }
};

export const LIVE_SCENE_LABEL_MAP: Record<InteractionScene, string> = {
  chat: "chat",
  comfort: "comfort",
  bedtime: "bedtime",
  mood: "mood",
  color: "color"
};

export const LIVE_EXPRESSION_TAG_MAP: Record<SheepExpression, string> = {
  idle: "平静",
  blink: "眨眼",
  smile: "微笑",
  rest: "休息"
};
