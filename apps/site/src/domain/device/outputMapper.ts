import type { DeviceOutputState } from "@colorwalking/shared";
import type { SheepEmotionState, SheepVisualState } from "../../state/types";

export function composeDeviceOutput(
  emotionState: SheepEmotionState,
  visualState: SheepVisualState
): DeviceOutputState {
  return {
    emotion: emotionState.emotion,
    emotion_level: Math.round(emotionState.emotionLevel),
    eye_state: visualState.eyeState,
    eye_color_hex: visualState.eyeColorHex,
    scarf_color: visualState.scarfColorHex,
    scarf_color_hex: visualState.scarfColorHex,
    motion_template: visualState.motionTemplate,
    voice_style: visualState.voiceStyle
  };
}
