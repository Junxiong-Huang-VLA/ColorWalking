function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toHex(value: number): string {
  const safe = Math.round(Math.max(0, Math.min(255, value)));
  return safe.toString(16).padStart(2, "0");
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return { r: 247, g: 225, b: 181 };
  }
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function softenColor(hex: string, softness = 0.45): string {
  const clamped = clamp01(softness);
  const { r, g, b } = hexToRgb(hex);
  const mix = 255 * clamped;
  return rgbToHex(r + mix * 0.35, g + mix * 0.45, b + mix * 0.5);
}

export function moodThemeByColor(hex: string): "moon_warm" | "cloud_cool" | "mist_pastel" {
  const { r, g, b } = hexToRgb(hex);
  const average = (r + g + b) / 3;
  if (average > 190) return "mist_pastel";
  if (b >= r) return "cloud_cool";
  return "moon_warm";
}
