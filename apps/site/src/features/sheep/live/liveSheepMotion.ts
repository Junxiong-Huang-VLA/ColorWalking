import type { SheepMotion } from "../../../state/types";

export type LiveMotionProfile = {
  className: string;
  hint: string;
  bodySwayDeg: number;
  headNodDeg: number;
  scarfSwingDeg: number;
  bouncePx: number;
  rigTempoSec: number;
};

export const LIVE_MOTION_PROFILE_MAP: Record<SheepMotion, LiveMotionProfile> = {
  idle_breathe: {
    className: "live-motion-breathe",
    hint: "轻呼吸",
    bodySwayDeg: 0.9,
    headNodDeg: 1.2,
    scarfSwingDeg: 2.8,
    bouncePx: 2,
    rigTempoSec: 3.2
  },
  nuzzle: {
    className: "live-motion-sway",
    hint: "蹭一蹭",
    bodySwayDeg: 2.4,
    headNodDeg: 2,
    scarfSwingDeg: 4.2,
    bouncePx: 3,
    rigTempoSec: 2.4
  },
  tiny_hop: {
    className: "live-motion-hop",
    hint: "小跳一下",
    bodySwayDeg: 1.6,
    headNodDeg: 3.2,
    scarfSwingDeg: 5.2,
    bouncePx: 8,
    rigTempoSec: 1.4
  },
  rest_pose: {
    className: "live-motion-drowse",
    hint: "轻点头",
    bodySwayDeg: 0.6,
    headNodDeg: 2.6,
    scarfSwingDeg: 2,
    bouncePx: 1,
    rigTempoSec: 3.6
  }
};

export function runtimeMotionClass(motion: SheepMotion): string {
  return LIVE_MOTION_PROFILE_MAP[motion].className;
}

export function runtimeMotionHint(motion: SheepMotion): string {
  return LIVE_MOTION_PROFILE_MAP[motion].hint;
}

export function runtimeMotionProfile(motion: SheepMotion): LiveMotionProfile {
  return LIVE_MOTION_PROFILE_MAP[motion];
}
