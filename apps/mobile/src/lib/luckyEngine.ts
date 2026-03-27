export type ColorItem = {
  id: string;
  name: string;
  hex: string;
  message: string;
};

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

export const COLOR_PALETTE: ColorItem[] = [
  { id: "sunrise-coral", name: "晨曦珊瑚", hex: "#FF6B6B", message: "今天你会被温柔看见。" },
  { id: "golden-spark", name: "金色闪光", hex: "#FFD93D", message: "你的努力会有回应。" },
  { id: "mint-breath", name: "薄荷呼吸", hex: "#6BCB77", message: "慢一点，也是在前进。" },
  { id: "river-blue", name: "河流蓝", hex: "#4D96FF", message: "清醒和坚定正在靠近你。" },
  { id: "grape-night", name: "葡萄夜", hex: "#845EC2", message: "你有独特的节奏与光芒。" },
  { id: "peach-mist", name: "蜜桃雾", hex: "#FF9671", message: "把今天过成你喜欢的样子。" },
  { id: "sky-foam", name: "天空泡沫", hex: "#00C9A7", message: "你会在轻盈中找到答案。" },
  { id: "rose-dawn", name: "玫瑰黎明", hex: "#F9A8D4", message: "浪漫和好运会一起出现。" }
];

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

function dailyIndex(dayKey: string, length: number): number {
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
  colorCount.forEach((value) => {
    if (!topColor || value.count > topColor.count) {
      topColor = value;
    }
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

export function createDrawEngine(palette: ColorItem[] = COLOR_PALETTE): DrawEngine {
  if (!palette.length) {
    throw new Error("Color palette cannot be empty.");
  }

  return {
    palette,
    draw: () => {
      const index = Math.floor(Math.random() * palette.length);
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
