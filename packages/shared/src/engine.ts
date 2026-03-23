import { COLOR_PALETTE, type ColorItem } from "./colors";

export type DrawResult = {
  id: string;
  color: ColorItem;
  index: number;
  drawnAt: string;
  dayKey: string;
};

export type DrawEngine = {
  draw: () => DrawResult;
  drawDaily: (date?: Date) => DrawResult;
  palette: ColorItem[];
};

export function formatDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function dailyIndex(dayKey: string, length: number): number {
  return hashString(`colorwalking-${dayKey}`) % length;
}

export type HistoryStats = {
  totalDraws: number;
  streakDays: number;
  uniqueColors: number;
  topColor: { name: string; hex: string; count: number } | null;
};

export function computeHistoryStats(history: DrawResult[], today = new Date()): HistoryStats {
  const totalDraws = history.length;
  if (!totalDraws) {
    return { totalDraws: 0, streakDays: 0, uniqueColors: 0, topColor: null };
  }

  const colorCount = new Map<string, { name: string; hex: string; count: number }>();
  const daySet = new Set<string>();

  history.forEach((item) => {
    daySet.add(item.dayKey);
    const prev = colorCount.get(item.color.id);
    if (prev) {
      prev.count += 1;
    } else {
      colorCount.set(item.color.id, { name: item.color.name, hex: item.color.hex, count: 1 });
    }
  });

  let topColor: { name: string; hex: string; count: number } | null = null;
  colorCount.forEach((v) => {
    if (!topColor || v.count > topColor.count) topColor = v;
  });

  let streakDays = 0;
  const cursor = new Date(today);
  for (;;) {
    const key = formatDayKey(cursor);
    if (!daySet.has(key)) break;
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { totalDraws, streakDays, uniqueColors: colorCount.size, topColor };
}

export function createDrawEngine(
  palette: ColorItem[] = COLOR_PALETTE,
  random: () => number = Math.random
): DrawEngine {
  if (!palette.length) {
    throw new Error("Color palette cannot be empty.");
  }

  return {
    palette,
    draw: () => {
      const index = Math.floor(random() * palette.length);
      const now = new Date();
      return {
        id: `${now.getTime()}-${index}`,
        color: palette[index],
        index,
        drawnAt: now.toISOString(),
        dayKey: formatDayKey(now)
      };
    },
    drawDaily: (date = new Date()) => {
      const dayKey = formatDayKey(date);
      const index = dailyIndex(dayKey, palette.length);
      const now = new Date();
      return {
        id: `${dayKey}-daily-${index}`,
        color: palette[index],
        index,
        drawnAt: now.toISOString(),
        dayKey
      };
    }
  };
}
