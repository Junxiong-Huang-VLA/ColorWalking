import type { InteractionScene, SheepEmotion, SheepExpression, SheepMotion } from "../../state/types";
import { LiveSheepRuntime } from "./live/LiveSheepRuntime";

type SheepAvatarStageProps = {
  scarfColorHex: string;
  eyeColorHex: string;
  expression: SheepExpression;
  motion: SheepMotion;
  statusText: string;
  emotionLevel: number;
  emotion?: SheepEmotion;
  scene?: InteractionScene;
  size?: "hero" | "compact";
  minimal?: boolean;
};

export function SheepAvatarStage({
  scarfColorHex,
  eyeColorHex,
  expression,
  motion,
  statusText,
  emotionLevel,
  emotion = "calm",
  scene = "chat",
  size = "compact",
  minimal = false
}: SheepAvatarStageProps) {
  return (
    <article className={`card sheep-avatar-stage sheep-avatar-${size}${minimal ? " sheep-avatar-minimal" : ""}`}>
      <div className="sheep-avatar-top">
        <h2>{minimal ? "小羊卷" : "小羊卷当前状态"}</h2>
        <small>{statusText}</small>
      </div>

      <LiveSheepRuntime
        scarfColorHex={scarfColorHex}
        eyeColorHex={eyeColorHex}
        emotion={emotion}
        expression={expression}
        motion={motion}
        scene={scene}
        emotionLevel={emotionLevel}
        size={size}
        minimal={minimal}
      />

      {minimal ? null : <p className="sheep-avatar-note">围巾与眼睛会跟随幸运色变化，动作与表情跟随互动和情绪流动。</p>}
    </article>
  );
}
