import { COLOR_PALETTE, type ColorItem } from "./colors";
import { formatDayKey } from "./engine";

export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";

export type BirthProfile = {
  birthday: string;
  birthHour: number;
};

export type FortuneInsight = {
  dateKey: string;
  dayElement: FiveElement;
  supportElement: FiveElement;
  luckyElement: FiveElement;
  luckyColor: ColorItem;
  summary: string;
};

const ELEMENT_ORDER: FiveElement[] = ["wood", "fire", "earth", "metal", "water"];

const ELEMENT_ZH: Record<FiveElement, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水"
};

const HOUR_ELEMENT: FiveElement[] = [
  "water",
  "water",
  "earth",
  "earth",
  "wood",
  "wood",
  "wood",
  "wood",
  "earth",
  "earth",
  "fire",
  "fire",
  "fire",
  "fire",
  "earth",
  "earth",
  "metal",
  "metal",
  "metal",
  "metal",
  "earth",
  "earth",
  "water",
  "water"
];

const COLOR_ELEMENT_MAP: Record<string, FiveElement> = {
  "sunrise-coral": "fire",
  "golden-spark": "earth",
  "mint-breath": "wood",
  "river-blue": "water",
  "grape-night": "water",
  "peach-mist": "earth",
  "sky-foam": "wood",
  "rose-dawn": "fire"
};

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function normalizedDate(input: string): Date {
  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid birthday format.");
  }
  return date;
}

function yearElement(year: number): FiveElement {
  const heavenlyStemIndex = ((year - 4) % 10 + 10) % 10;
  if (heavenlyStemIndex <= 1) return "wood";
  if (heavenlyStemIndex <= 3) return "fire";
  if (heavenlyStemIndex <= 5) return "earth";
  if (heavenlyStemIndex <= 7) return "metal";
  return "water";
}

function generatedBy(element: FiveElement): FiveElement {
  if (element === "wood") return "water";
  if (element === "fire") return "wood";
  if (element === "earth") return "fire";
  if (element === "metal") return "earth";
  return "metal";
}

function chooseLuckyElement(
  dayElement: FiveElement,
  birthYearElement: FiveElement,
  birthHourElement: FiveElement
): FiveElement {
  const weights = new Map<FiveElement, number>(
    ELEMENT_ORDER.map((element) => [element, 0])
  );

  weights.set(birthYearElement, (weights.get(birthYearElement) ?? 0) + 2);
  weights.set(birthHourElement, (weights.get(birthHourElement) ?? 0) + 1);
  weights.set(dayElement, (weights.get(dayElement) ?? 0) + 1);

  let best: FiveElement = "wood";
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const element of ELEMENT_ORDER) {
    const ownWeight = weights.get(element) ?? 0;
    const support = generatedBy(element);
    const supportWeight = weights.get(support) ?? 0;
    const score = (3 - ownWeight) * 2 + (2 - supportWeight);
    if (score > bestScore) {
      best = element;
      bestScore = score;
    }
  }
  return best;
}

function pickColorByElement(
  luckyElement: FiveElement,
  seed: string,
  palette: ColorItem[]
): ColorItem {
  const matches = palette.filter((item) => COLOR_ELEMENT_MAP[item.id] === luckyElement);
  if (!matches.length) {
    return palette[hashString(seed) % palette.length];
  }
  return matches[hashString(seed) % matches.length];
}

function dayElementForDate(dayKey: string): FiveElement {
  const idx = hashString(`huangli-${dayKey}`) % ELEMENT_ORDER.length;
  return ELEMENT_ORDER[idx];
}

function supportElementForDay(dayElement: FiveElement): FiveElement {
  return generatedBy(dayElement);
}

export function analyzeLuckyColorByBazi(
  profile: BirthProfile,
  date: Date,
  palette: ColorItem[] = COLOR_PALETTE
): FortuneInsight {
  const birthdayDate = normalizedDate(profile.birthday);
  const birthYearEl = yearElement(birthdayDate.getFullYear());
  const hour = Math.max(0, Math.min(23, Math.floor(profile.birthHour)));
  const birthHourEl = HOUR_ELEMENT[hour];
  const dateKey = formatDayKey(date);
  const dayElement = dayElementForDate(dateKey);
  const supportElement = supportElementForDay(dayElement);
  const luckyElement = chooseLuckyElement(dayElement, birthYearEl, birthHourEl);
  const luckyColor = pickColorByElement(luckyElement, `${dateKey}-${profile.birthday}-${hour}`, palette);

  return {
    dateKey,
    dayElement,
    supportElement,
    luckyElement,
    luckyColor,
    summary: `黄历日势偏${ELEMENT_ZH[dayElement]}，生辰时势偏${ELEMENT_ZH[birthHourEl]}，建议用${ELEMENT_ZH[luckyElement]}行色彩做平衡。`
  };
}

export function compareTwoDays(
  profile: BirthProfile,
  firstDate: Date,
  secondDate: Date,
  palette: ColorItem[] = COLOR_PALETTE
): { first: FortuneInsight; second: FortuneInsight; sameColor: boolean } {
  const first = analyzeLuckyColorByBazi(profile, firstDate, palette);
  const second = analyzeLuckyColorByBazi(profile, secondDate, palette);
  return {
    first,
    second,
    sameColor: first.luckyColor.id === second.luckyColor.id
  };
}
