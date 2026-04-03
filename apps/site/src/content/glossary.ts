import type { InteractionScene } from "../state/types";

export const TERM_GLOSSARY = {
  scene: "场景",
  bond: "关系",
  memory: "共同经历"
} as const;

export type GlossaryKey = keyof typeof TERM_GLOSSARY;

export function glossaryLabel(key: GlossaryKey): string {
  return TERM_GLOSSARY[key];
}

export function sceneLabel(scene: InteractionScene): string {
  if (scene === "chat") return "聊天";
  if (scene === "comfort") return "安抚";
  if (scene === "bedtime") return "睡前";
  if (scene === "mood") return "情绪";
  return "幸运色";
}

export const GLOSSARY_BADGE = [
  `${TERM_GLOSSARY.scene}（scene）`,
  `${TERM_GLOSSARY.bond}（bond）`,
  `${TERM_GLOSSARY.memory}（memory）`
] as const;
