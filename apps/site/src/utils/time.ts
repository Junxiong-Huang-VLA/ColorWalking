import { formatDayKey } from "@colorwalking/shared";

export function nowIso(): string {
  return new Date().toISOString();
}

export function dayKeyOf(iso: string): string {
  return formatDayKey(new Date(iso));
}

export function todayKey(): string {
  return formatDayKey(new Date());
}

export function formatClock(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}
