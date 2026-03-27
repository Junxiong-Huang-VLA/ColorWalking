export type LuckyMode = "daily" | "random";

export const RITUAL_LINES = [
  "先深呼吸一下，我们来揭晓今天的颜色。",
  "每天给自己十秒钟，也是一种温柔。",
  "转盘不是答案，它只是给今天一点光。"
] as const;

export const MODE_RITUAL_LINE: Record<LuckyMode, (hasCached: boolean) => string> = {
  daily: (hasCached) =>
    hasCached ? "今天已经抽过啦，点一下可以再看一次结果。" : "准备好就点一下，开始今天的小仪式。",
  random: () => "随机模式下，每一次转动都是新的相遇。"
};

export const COLOR_CARE: Record<string, string> = {
  "sunrise-coral": "今天适合先照顾心情，再照顾效率。",
  "golden-spark": "先完成一件小事，你已经在前进。",
  "mint-breath": "慢一点，也是在好好生活。",
  "river-blue": "遇到急事时，先稳住呼吸再决定。",
  "grape-night": "把担心写下来，心里会轻一点。",
  "peach-mist": "对自己说话时，可以更温柔一点。",
  "sky-foam": "先轻轻尝试，不必一开始就完美。",
  "rose-dawn": "今天也值得被喜欢，哪怕只是一瞬间。"
};

export function luckyReminderByColorId(colorId?: string): string {
  if (!colorId) return "今天不用急着变好，先让自己轻松一点。";
  return COLOR_CARE[colorId] ?? "今天也请和自己站在同一边。";
}

export function buildLuckyShareText(name: string, hex: string, message: string): string {
  return `我在 ColorWalking 抽到今日幸运色：${name} ${hex}。${message}`;
}
