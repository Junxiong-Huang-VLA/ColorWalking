import { useMemo } from "react";

export const PIXEL_SHEEP_FRAMES = [
  "idle_a",
  "idle_b",
  "blink_a",
  "blink_b",
  "happy_a",
  "happy_b",
  "expecting_a",
  "expecting_b",
  "curious_a",
  "comfort_a",
  "sleepy_a",
  "sleepy_b",
  "press_a",
  "press_b",
  "jump_a",
  "jump_b",
  "jump_c",
  "notice_a",
  "notice_b",
  "turn_left",
  "turn_right",
  "back_a",
  "back_look"
] as const;

export type PixelSheepFrame = (typeof PIXEL_SHEEP_FRAMES)[number];

type Props = {
  frame: PixelSheepFrame;
  scarfColor: string;
  size?: number;
  className?: string;
};

type FaceMode = "open" | "blink" | "sleep";
type MouthMode = "neutral" | "softneutral" | "smile" | "tiny_o" | "comfort";
type TurnMode = "front" | "left" | "right" | "back" | "back_look";
type ExpressionMode = "calm" | "softHappy" | "softCurious";
type MicroAction = "default" | "pet" | "cuddle" | "near" | "bedtime";

type MicroFaceProfile = {
  action: MicroAction;
  earLeftOffset: number;
  earRightOffset: number;
  lidLeft: number;
  lidRight: number;
  mouthLeftOffset: number;
  mouthRightOffset: number;
};

const PALETTE = {
  // 羊毛主色 — 升级为棉花糖奶油白，更蓬松、更云感
  woolTop: "#fffdf8",
  woolMid: "#fdf9f2",
  woolShade: "#ede6d8",
  woolShadeDeep: "#e2d8c8",
  woolRim: "#ccd9f0",
  lineFace: "#cfdaea",
  lineOuter: "#c8d6ec",
  lineSoft: "#dce8f8",
  earOuter: "#faf4ea",
  earInner: "#fec8d8",   // 耳内更粉嫩、有活力
  eye: "#1e2e50",
  eyeLight: "#a0c0e8",   // 眼睛高光更亮
  // 腮红 — 升级为蜜桃珊瑚粉，更有元气
  blush: "#ff9eb5",
  blushSoft: "#ffc8d8",
  tail: "#d8cfbe",
  leg: "#cddaea",
  shadowSoft: "#d4e2f5",
  // 围巾点缀 — 升级为雾蓝+蜜桃粉多巴胺组合
  candyMist: "#a8cfe8",   // 雾蓝（替换薄荷）
  candyPeach: "#ffb8a0",  // 蜜桃粉（替换柠檬黄）
  candyMint: "#99e6da",   // 保留备用
  candyLemon: "#ffe08a",  // 保留备用
  charm: "#ffd665",
  // 幸运星 — 新增记忆点颜色
  starGold: "#ffcc44",
  starLight: "#fff4b0"
} as const;

function clampHexColor(input: string): string {
  const clean = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean;
  return "#7ea9df";
}

function expressionForFrame(frame: PixelSheepFrame): ExpressionMode {
  if (frame === "happy_a" || frame === "happy_b" || frame === "jump_a" || frame === "jump_b" || frame === "jump_c") return "softHappy";
  if (
    frame === "curious_a" ||
    frame === "notice_a" ||
    frame === "notice_b" ||
    frame === "expecting_a" ||
    frame === "expecting_b" ||
    frame === "turn_left" ||
    frame === "turn_right"
  ) {
    return "softCurious";
  }
  return "calm";
}

function microFaceForFrame(frame: PixelSheepFrame): MicroFaceProfile {
  if (frame === "happy_a" || frame === "happy_b" || frame === "jump_a" || frame === "jump_b" || frame === "jump_c") {
    return {
      action: "pet",
      earLeftOffset: -1,
      earRightOffset: -1,
      lidLeft: 0,
      lidRight: 0,
      mouthLeftOffset: -1,
      mouthRightOffset: -1
    };
  }

  if (frame === "comfort_a") {
    return {
      action: "cuddle",
      earLeftOffset: 1,
      earRightOffset: 1,
      lidLeft: 1,
      lidRight: 1,
      mouthLeftOffset: 0,
      mouthRightOffset: 0
    };
  }

  if (frame === "sleepy_a" || frame === "sleepy_b") {
    return {
      action: "bedtime",
      earLeftOffset: 2,
      earRightOffset: 2,
      lidLeft: 2,
      lidRight: 2,
      mouthLeftOffset: 1,
      mouthRightOffset: 1
    };
  }

  if (frame === "turn_left") {
    return {
      action: "near",
      earLeftOffset: 0,
      earRightOffset: 1,
      lidLeft: 1,
      lidRight: 0,
      mouthLeftOffset: 0,
      mouthRightOffset: -1
    };
  }

  if (frame === "turn_right") {
    return {
      action: "near",
      earLeftOffset: 1,
      earRightOffset: 0,
      lidLeft: 0,
      lidRight: 1,
      mouthLeftOffset: -1,
      mouthRightOffset: 0
    };
  }

  if (frame === "curious_a" || frame === "notice_a" || frame === "notice_b" || frame === "expecting_a" || frame === "expecting_b") {
    return {
      action: "near",
      earLeftOffset: 0,
      earRightOffset: 0,
      lidLeft: 1,
      lidRight: 1,
      mouthLeftOffset: 0,
      mouthRightOffset: 0
    };
  }

  return {
    action: "default",
    earLeftOffset: 0,
    earRightOffset: 0,
    lidLeft: 0,
    lidRight: 0,
    mouthLeftOffset: 0,
    mouthRightOffset: 0
  };
}

function framePreset(frame: PixelSheepFrame): {
  face: FaceMode;
  mouth: MouthMode;
  turn: TurnMode;
  bodyY: number;
  headY: number;
  squishX: number;
  squishY: number;
  blush: number;
  eyeShift: number;
  tuftY: number;
  earY: number;
  scarfSwing: number;
} {
  if (frame === "idle_b") return { face: "open", mouth: "softneutral", turn: "front", bodyY: 1, headY: 0, squishX: 1, squishY: 1, blush: 0.92, eyeShift: 0, tuftY: 1, earY: 1, scarfSwing: 1 };
  if (frame === "blink_a" || frame === "blink_b") return { face: "blink", mouth: "neutral", turn: "front", bodyY: 0, headY: 0, squishX: 1, squishY: 1, blush: 0.88, eyeShift: 0, tuftY: 0, earY: 0, scarfSwing: 0 };
  if (frame === "happy_a") return { face: "open", mouth: "smile", turn: "front", bodyY: -2, headY: -2, squishX: 1.02, squishY: 0.98, blush: 1, eyeShift: 0, tuftY: -2, earY: -1, scarfSwing: -1 };
  if (frame === "happy_b") return { face: "open", mouth: "smile", turn: "front", bodyY: -1, headY: -1, squishX: 1.01, squishY: 0.99, blush: 1, eyeShift: 0, tuftY: -1, earY: -1, scarfSwing: 1 };
  if (frame === "expecting_a") return { face: "open", mouth: "tiny_o", turn: "front", bodyY: -1, headY: -1, squishX: 1, squishY: 1, blush: 0.9, eyeShift: 1, tuftY: -1, earY: -1, scarfSwing: -1 };
  if (frame === "expecting_b") return { face: "open", mouth: "tiny_o", turn: "front", bodyY: 0, headY: 0, squishX: 1, squishY: 1, blush: 0.9, eyeShift: -1, tuftY: 0, earY: 0, scarfSwing: 1 };
  if (frame === "curious_a") return { face: "open", mouth: "neutral", turn: "right", bodyY: 0, headY: -1, squishX: 1, squishY: 1, blush: 0.9, eyeShift: 1, tuftY: -1, earY: -1, scarfSwing: -1 };
  if (frame === "comfort_a") return { face: "open", mouth: "comfort", turn: "front", bodyY: 0, headY: 0, squishX: 1, squishY: 1, blush: 0.8, eyeShift: 0, tuftY: 1, earY: 1, scarfSwing: 0 };
  if (frame === "sleepy_a") return { face: "sleep", mouth: "comfort", turn: "front", bodyY: 0, headY: 1, squishX: 1, squishY: 1, blush: 0.76, eyeShift: 0, tuftY: 1, earY: 1, scarfSwing: 0 };
  if (frame === "sleepy_b") return { face: "blink", mouth: "comfort", turn: "front", bodyY: 1, headY: 1, squishX: 1.01, squishY: 0.99, blush: 0.76, eyeShift: 0, tuftY: 2, earY: 1, scarfSwing: 1 };
  if (frame === "press_a") return { face: "open", mouth: "neutral", turn: "front", bodyY: 2, headY: 2, squishX: 1.08, squishY: 0.92, blush: 0.86, eyeShift: 0, tuftY: 1, earY: 2, scarfSwing: 0 };
  if (frame === "press_b") return { face: "blink", mouth: "neutral", turn: "front", bodyY: 1, headY: 1, squishX: 1.05, squishY: 0.95, blush: 0.86, eyeShift: 0, tuftY: 1, earY: 1, scarfSwing: 1 };
  if (frame === "jump_a") return { face: "open", mouth: "smile", turn: "front", bodyY: 2, headY: 1, squishX: 1.1, squishY: 0.9, blush: 1, eyeShift: 0, tuftY: 0, earY: 1, scarfSwing: 1 };
  if (frame === "jump_b") return { face: "open", mouth: "smile", turn: "front", bodyY: -4, headY: -4, squishX: 0.92, squishY: 1.1, blush: 1, eyeShift: 0, tuftY: -2, earY: -2, scarfSwing: -1 };
  if (frame === "jump_c") return { face: "open", mouth: "smile", turn: "front", bodyY: 0, headY: 0, squishX: 1, squishY: 1, blush: 0.95, eyeShift: 0, tuftY: 0, earY: 0, scarfSwing: 0 };
  if (frame === "notice_a") return { face: "open", mouth: "neutral", turn: "front", bodyY: -1, headY: -2, squishX: 1, squishY: 1, blush: 0.96, eyeShift: 1, tuftY: -1, earY: -1, scarfSwing: -1 };
  if (frame === "notice_b") return { face: "open", mouth: "neutral", turn: "front", bodyY: 0, headY: -1, squishX: 1, squishY: 1, blush: 0.96, eyeShift: -1, tuftY: 0, earY: -1, scarfSwing: 1 };
  if (frame === "turn_left") return { face: "open", mouth: "neutral", turn: "left", bodyY: 0, headY: 0, squishX: 1, squishY: 1, blush: 0.85, eyeShift: -1, tuftY: 0, earY: 0, scarfSwing: -1 };
  if (frame === "turn_right") return { face: "open", mouth: "neutral", turn: "right", bodyY: 0, headY: 0, squishX: 1, squishY: 1, blush: 0.85, eyeShift: 1, tuftY: 0, earY: 0, scarfSwing: 1 };
  if (frame === "back_a") return { face: "open", mouth: "neutral", turn: "back", bodyY: 0, headY: 0, squishX: 1, squishY: 1, blush: 0, eyeShift: 0, tuftY: 0, earY: 0, scarfSwing: 0 };
  if (frame === "back_look") return { face: "open", mouth: "neutral", turn: "back_look", bodyY: 0, headY: 0, squishX: 1, squishY: 1, blush: 0.72, eyeShift: -1, tuftY: 0, earY: 0, scarfSwing: -1 };
  // idle_a 默认帧 — softneutral 轻微上扬嘴角，更有元气感
  return { face: "open", mouth: "softneutral", turn: "front", bodyY: 0, headY: 0, squishX: 1, squishY: 1, blush: 0.92, eyeShift: 0, tuftY: 0, earY: 0, scarfSwing: 0 };
}

export function PixelSheepSprite({ frame, scarfColor, size = 64, className = "" }: Props) {
  const preset = framePreset(frame);
  const scarf = useMemo(() => clampHexColor(scarfColor), [scarfColor]);
  const expression = expressionForFrame(frame);
  const micro = microFaceForFrame(frame);

  if (preset.turn === "back" || preset.turn === "back_look") {
    const look = preset.turn === "back_look";
    const backScarfTailX = 34 + preset.scarfSwing;
    const backTuftY = preset.tuftY;
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        role="img"
        aria-label="pixel sheep back"
        shapeRendering="crispEdges"
        className={`pixel-sheep ${className}`.trim()}
      >
        <rect x="14" y="54" width="36" height="3" fill={PALETTE.shadowSoft} opacity="0.58" />

        <g className="pixel-sheep-body">
          <rect x="15" y="33" width="34" height="1" fill={PALETTE.lineOuter} />
          <rect x="13" y="38" width="1" height="13" fill={PALETTE.lineOuter} />
          <rect x="50" y="38" width="1" height="13" fill={PALETTE.lineOuter} />

          <rect x="16" y="34" width="32" height="20" fill={PALETTE.woolMid} />
          <rect x="14" y="38" width="36" height="14" fill={PALETTE.woolMid} />
          <rect x="16" y="48" width="32" height="6" fill={PALETTE.woolShade} />
          <rect x="48" y="41" width="6" height="4" fill={PALETTE.tail} />
        </g>

        <g className="pixel-sheep-scarf">
          <rect x="18" y="34" width="28" height="6" fill={scarf} />
          <rect x="20" y="40" width="23" height="2" fill={scarf} />
          <rect x={backScarfTailX} y="39" width="5" height="8" fill={scarf} />
        </g>

        <g className="pixel-sheep-head">
          <rect x="12" y="14" width="40" height="28" fill={PALETTE.woolMid} />
          <rect x="10" y="18" width="44" height="20" fill={PALETTE.woolMid} />
          <rect x="12" y="30" width="40" height="12" fill={PALETTE.woolShade} />
          <rect x="11" y="17" width="42" height="1" fill={PALETTE.woolRim} />
          <rect x="9" y="20" width="1" height="18" fill={PALETTE.woolRim} />
          <rect x="54" y="20" width="1" height="18" fill={PALETTE.woolRim} />

          <g className="pixel-sheep-tuft">
            <rect x="15" y={11 + backTuftY} width="9" height="6" fill={PALETTE.woolTop} />
            <rect x="23" y={8 + backTuftY} width="8" height="8" fill={PALETTE.woolTop} />
            <rect x="31" y={8 + backTuftY} width="8" height="8" fill={PALETTE.woolTop} />
            <rect x="39" y={11 + backTuftY} width="9" height="6" fill={PALETTE.woolTop} />
            <rect x="26" y={6 + backTuftY} width="12" height="4" fill={PALETTE.woolTop} />
            <rect x="18" y={15 + backTuftY} width="28" height="1" fill={PALETTE.woolRim} />
          </g>

          <g className="pixel-sheep-ears">
            <rect x="8" y="20" width="6" height="10" fill={PALETTE.earOuter} />
            <rect x="50" y="20" width="6" height="10" fill={PALETTE.earOuter} />
          </g>
        </g>

        {look ? (
          <>
            <rect x="20" y="27" width="2" height="2" fill={PALETTE.eye} />
            <rect x="18" y="33" width="4" height="2" fill={PALETTE.blush} opacity="0.56" />
            <rect x="24" y="33" width="4" height="1" fill={PALETTE.eye} />
          </>
        ) : null}
      </svg>
    );
  }

  const faceX = preset.turn === "left" ? 26 : preset.turn === "right" ? 30 : 28;
  const frontEyeLeft = expression === "softHappy" ? 26 : expression === "softCurious" ? 27 : 27;
  const frontEyeRight = expression === "softHappy" ? 34 : expression === "softCurious" ? 36 : 35;
  const eyeBaseLeft = preset.turn === "left" ? 24 : preset.turn === "right" ? 36 : frontEyeLeft;
  const eyeBaseRight = preset.turn === "left" ? 30 : preset.turn === "right" ? 40 : frontEyeRight;
  const eyeY = expression === "softHappy" ? 28 : expression === "softCurious" ? 27 : 28;
  const rightEyeYBias = expression === "calm" ? 1 : 0;
  const blushLeftX = expression === "softHappy" ? 23 : expression === "softCurious" ? 22 : 22;
  const blushRightX = expression === "softHappy" ? 37 : expression === "softCurious" ? 36 : 36;
  const blushY = expression === "softHappy" ? 34 : 33;
  const eyeShift = preset.eyeShift;
  const gy = 36 + preset.headY;
  const leftEarY = 21 + preset.earY + micro.earLeftOffset;
  const rightEarY = 21 + preset.earY + micro.earRightOffset;
  const tuftY = preset.tuftY;
  const scarfTailX = 34 + preset.scarfSwing;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="pixel sheep"
      shapeRendering="crispEdges"
      className={`pixel-sheep ${className}`.trim()}
    >
      <rect x="14" y="54" width="36" height="3" fill={PALETTE.shadowSoft} opacity="0.58" />

      <g className="pixel-sheep-body" transform={`translate(0 ${preset.bodyY}) scale(${preset.squishX} ${preset.squishY})`}>
        <rect x="15" y="35" width="34" height="1" fill={PALETTE.lineOuter} />
        <rect x="13" y="40" width="1" height="12" fill={PALETTE.lineOuter} />
        <rect x="50" y="40" width="1" height="12" fill={PALETTE.lineOuter} />

        <rect x="18" y="46" width="6" height="8" fill={PALETTE.leg} />
        <rect x="40" y="46" width="6" height="8" fill={PALETTE.leg} />

        <rect x="15" y="38" width="1" height="6" fill={PALETTE.woolMid} />
        <rect x="48" y="38" width="1" height="6" fill={PALETTE.woolMid} />
        <rect x="16" y="36" width="32" height="18" fill={PALETTE.woolMid} />
        <rect x="14" y="40" width="36" height="12" fill={PALETTE.woolMid} />
        <rect x="16" y="48" width="32" height="6" fill={PALETTE.woolShade} />
        <rect x="18" y="52" width="28" height="2" fill={PALETTE.woolShadeDeep} />
        <rect x="21" y="54" width="4" height="1" fill={PALETTE.woolShadeDeep} />
        <rect x="39" y="54" width="4" height="1" fill={PALETTE.woolShadeDeep} />
        <rect x="49" y="41" width="4" height="5" fill={PALETTE.woolShade} />
        <rect x="52" y="42" width="3" height="4" fill={PALETTE.tail} />

        <rect x="25" y="33" width="14" height="2" fill={PALETTE.woolMid} />
        <rect x="26" y="34" width="12" height="1" fill={PALETTE.woolRim} />

        <g className="pixel-sheep-scarf">
        <rect x="18" y="34" width="28" height="6" fill={scarf} />
        <rect x="17" y="35" width="1" height="3" fill={scarf} />
        <rect x="46" y="35" width="1" height="3" fill={scarf} />
        <rect x="20" y="40" width="23" height="2" fill={scarf} />
        <rect x={scarfTailX} y="39" width="5" height="8" fill={scarf} />
        {/* 围巾点缀 — 雾蓝+蜜桃粉多巴胺配色，带光晕感 */}
        <rect x="22" y="35" width="4" height="4" fill={PALETTE.candyMist} opacity="0.28" />
        <rect x="23" y="36" width="2" height="2" fill={PALETTE.candyMist} opacity="0.92" />
        <rect x="28" y="35" width="4" height="4" fill={PALETTE.candyPeach} opacity="0.28" />
        <rect x="29" y="36" width="2" height="2" fill={PALETTE.candyPeach} opacity="0.90" />
        <rect x="34" y="35" width="4" height="4" fill={PALETTE.candyMist} opacity="0.28" />
        <rect x="35" y="36" width="2" height="2" fill={PALETTE.candyMist} opacity="0.92" />
        <rect x="20" y="41" width="23" height="1" fill="#ffffff55" />
        <rect x="19" y="35" width="27" height="1" fill="#ffffff66" />
        <rect x="19" y="40" width="26" height="1" fill="#00000014" />
        {/* 幸运星徽章 — 5px像素五角星，围巾尾端记忆点 */}
        <rect x={scarfTailX + 1} y="42" width="5" height="1" fill={PALETTE.starLight} opacity="0.55" />
        <rect x={scarfTailX + 2} y="41" width="3" height="5" fill={PALETTE.starLight} opacity="0.55" />
        <rect x={scarfTailX + 1} y="42" width="5" height="1" fill={PALETTE.starGold} opacity="0.78" />
        <rect x={scarfTailX + 2} y="41" width="3" height="1" fill={PALETTE.starGold} opacity="0.78" />
        <rect x={scarfTailX + 2} y="45" width="3" height="1" fill={PALETTE.starGold} opacity="0.78" />
        <rect x={scarfTailX + 3} y="43" width="1" height="1" fill={PALETTE.starLight} />
        </g>
      </g>

      <g className="pixel-sheep-head" transform={`translate(0 ${preset.headY})`}>
        <rect x="12" y="14" width="40" height="28" fill={PALETTE.woolMid} />
        <rect x="10" y="18" width="44" height="20" fill={PALETTE.woolMid} />
        <rect x="12" y="30" width="40" height="12" fill={PALETTE.woolShade} />
        <rect x="14" y="34" width="36" height="8" fill={PALETTE.woolShadeDeep} opacity="0.24" />
        <rect x="11" y="17" width="42" height="1" fill={PALETTE.woolRim} />
        <rect x="9" y="20" width="1" height="18" fill={PALETTE.woolRim} />
        <rect x="54" y="20" width="1" height="18" fill={PALETTE.woolRim} />

        <g className="pixel-sheep-ears">
          <rect x="9" y={leftEarY} width="6" height="9" fill={PALETTE.earOuter} />
          <rect x="49" y={rightEarY} width="6" height="9" fill={PALETTE.earOuter} />
          <rect x="10" y={leftEarY + 2} width="4" height="5" fill={PALETTE.earInner} opacity="0.7" />
          <rect x="50" y={rightEarY + 2} width="4" height="5" fill={PALETTE.earInner} opacity="0.7" />
          {micro.action !== "default" ? (
            <>
              <rect x="10" y={leftEarY + 1} width="4" height="1" fill={PALETTE.lineSoft} opacity="0.55" />
              <rect x="50" y={rightEarY + 1} width="4" height="1" fill={PALETTE.lineSoft} opacity="0.55" />
            </>
          ) : null}
        </g>

        <g className="pixel-sheep-tuft">
        <rect x="15" y={11 + tuftY} width="9" height="6" fill={PALETTE.woolTop} />
        <rect x="23" y={8 + tuftY} width="8" height="8" fill={PALETTE.woolTop} />
        <rect x="31" y={8 + tuftY} width="8" height="8" fill={PALETTE.woolTop} />
        <rect x="39" y={11 + tuftY} width="9" height="6" fill={PALETTE.woolTop} />
        <rect x="26" y={6 + tuftY} width="12" height="4" fill={PALETTE.woolTop} />
        <rect x="18" y={15 + tuftY} width="28" height="1" fill={PALETTE.woolRim} />
        <rect x="18" y={13 + tuftY} width="28" height="2" fill="#ffffff77" />
        <rect x="24" y={14 + tuftY} width="1" height="2" fill={PALETTE.lineSoft} />
        <rect x="31" y={14 + tuftY} width="1" height="2" fill={PALETTE.lineSoft} />
        <rect x="38" y={14 + tuftY} width="1" height="2" fill={PALETTE.lineSoft} />
        </g>

        <g className="pixel-sheep-face">
        <rect x={faceX} y={gy} width="8" height="8" fill="#faf8f3" />
        <rect x={faceX - 1} y={gy + 1} width="10" height="6" fill="#f8f4ed" />
        <rect x={faceX} y={gy + 1} width="8" height="6" fill="#fbf8f2" />
        <rect x={faceX - 1} y={gy} width="1" height="8" fill={PALETTE.lineFace} />
        <rect x={faceX + 8} y={gy} width="1" height="8" fill={PALETTE.lineFace} />
        <rect x={faceX} y={gy + 8} width="8" height="1" fill={PALETTE.lineFace} />

        <rect x={faceX - 1} y={gy + 8} width="10" height="1" fill="#d7dfec" />
        </g>

        <g className="pixel-sheep-features">
        {preset.face === "blink" || preset.face === "sleep" ? (
          <>
            <rect x={eyeBaseLeft + eyeShift} y={eyeY + 1} width="2" height="1" fill={PALETTE.eye} />
            <rect x={eyeBaseRight + eyeShift} y={eyeY + 1 + rightEyeYBias} width="2" height="1" fill={PALETTE.eye} />
          </>
        ) : (
          <>
            <rect x={eyeBaseLeft + eyeShift} y={eyeY} width="2" height={expression === "softHappy" ? 1 : 2} fill={PALETTE.eye} />
            <rect x={eyeBaseRight + eyeShift} y={eyeY + rightEyeYBias} width="2" height={expression === "softHappy" ? 1 : 2} fill={PALETTE.eye} />
            {micro.lidLeft > 0 ? (
              <rect x={eyeBaseLeft + eyeShift} y={eyeY - 1} width="2" height={micro.lidLeft} fill="#f8f4ed" opacity="0.92" />
            ) : null}
            {micro.lidRight > 0 ? (
              <rect x={eyeBaseRight + eyeShift} y={eyeY - 1 + rightEyeYBias} width="2" height={micro.lidRight} fill="#f8f4ed" opacity="0.92" />
            ) : null}
            {expression === "softCurious" ? (
              <>
                <rect x={eyeBaseLeft + eyeShift} y={eyeY} width="1" height="1" fill={PALETTE.eyeLight} />
                <rect x={eyeBaseRight + eyeShift} y={eyeY + rightEyeYBias} width="1" height="1" fill={PALETTE.eyeLight} />
              </>
            ) : null}
            {expression === "softHappy" ? (
              <>
                <rect x={eyeBaseLeft + eyeShift} y={eyeY - 1} width="1" height="1" fill={PALETTE.eyeLight} />
                <rect x={eyeBaseRight + eyeShift} y={eyeY - 1 + rightEyeYBias} width="1" height="1" fill={PALETTE.eyeLight} />
              </>
            ) : null}
          </>
        )}

        {/* 腮红升级 — 三层渐变：外晕→中粉→核心蜜桃，更有元气感 */}
        <rect x={blushLeftX - 1} y={blushY - 1} width="7" height="4" fill={PALETTE.blushSoft} opacity={Math.min(1, preset.blush * 0.38)} />
        <rect x={blushLeftX} y={blushY} width="5" height="3" fill={PALETTE.blushSoft} opacity={Math.min(1, preset.blush * 0.62)} />
        <rect x={blushLeftX + 1} y={blushY} width="3" height="2" fill={PALETTE.blush} opacity={Math.min(1, preset.blush * 0.88)} />
        <rect x={blushRightX - 1} y={blushY - 1} width="7" height="4" fill={PALETTE.blushSoft} opacity={Math.min(1, preset.blush * 0.38)} />
        <rect x={blushRightX} y={blushY} width="5" height="3" fill={PALETTE.blushSoft} opacity={Math.min(1, preset.blush * 0.62)} />
        <rect x={blushRightX + 1} y={blushY} width="3" height="2" fill={PALETTE.blush} opacity={Math.min(1, preset.blush * 0.88)} />

        {preset.mouth === "smile" ? (
          <>
            <rect x="29" y="41" width="6" height="1" fill={PALETTE.eye} />
            <rect x="30" y="42" width="4" height="1" fill={PALETTE.eye} />
          </>
        ) : preset.mouth === "softneutral" ? (
          // 轻微上扬嘴角 — 比neutral更灵动，比smile更克制，日常治愈感
          <>
            <rect x="30" y="41" width="4" height="1" fill={PALETTE.eye} />
            <rect x="29" y="42" width="1" height="1" fill={PALETTE.eye} />
            <rect x="33" y="42" width="1" height="1" fill={PALETTE.eye} />
          </>
        ) : preset.mouth === "tiny_o" ? (
          <rect x="31" y="41" width="2" height="2" fill={PALETTE.eye} />
        ) : preset.mouth === "comfort" ? (
          <>
            <rect x="30" y="41" width="3" height="1" fill={PALETTE.eye} />
            <rect x="31" y="42" width="1" height="1" fill={PALETTE.eye} />
          </>
        ) : (
          <>
            <rect x="31" y="41" width="2" height="1" fill={PALETTE.eye} />
            <rect x="31" y="42" width="1" height="1" fill={PALETTE.eye} />
            <rect x="30" y="41" width="1" height="1" fill="#24324f88" />
          </>
        )}
        {(micro.mouthLeftOffset !== 0 || micro.mouthRightOffset !== 0) ? (
          <g className="pixel-sheep-mouth-corners">
            <rect x="29" y={42 + micro.mouthLeftOffset} width="1" height="1" fill={PALETTE.eye} opacity="0.9" />
            <rect x="34" y={42 + micro.mouthRightOffset} width="1" height="1" fill={PALETTE.eye} opacity="0.9" />
          </g>
        ) : null}
        </g>
      </g>
    </svg>
  );
}
