export type DemoStep = "home" | "lucky" | "interaction" | "growth" | "memory" | "waitlist";

export type DemoFlags = {
  isDemoMode: boolean;
  isAutoplay: boolean;
  isInternal: boolean;
  step: DemoStep;
};

function safeStep(value: string | null): DemoStep {
  if (value === "home" || value === "lucky" || value === "interaction" || value === "growth" || value === "memory" || value === "waitlist") {
    return value;
  }
  return "home";
}

export function readDemoFlags(search: string): DemoFlags {
  const params = new URLSearchParams(search);
  return {
    isDemoMode: params.get("demo") === "1" || params.get("premiere") === "1",
    isAutoplay: params.get("autoplay") === "1",
    isInternal: params.get("internal") === "1",
    step: safeStep(params.get("step"))
  };
}

export function buildDemoHref(
  path: string,
  step: DemoStep,
  options?: { autoplay?: boolean; internal?: boolean }
): string {
  const params = new URLSearchParams();
  params.set("demo", "1");
  params.set("step", step);
  if (options?.autoplay ?? true) params.set("autoplay", "1");
  if (options?.internal) params.set("internal", "1");
  return `${path}?${params.toString()}`;
}
