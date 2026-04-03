import type { AppTabKey } from "../state/types";

export type TabRoute = {
  key: AppTabKey;
  label: string;
};

export const TAB_ROUTES: TabRoute[] = [
  { key: "home", label: "首页" },
  { key: "interaction", label: "互动" },
  { key: "growth", label: "成长" },
  { key: "memory", label: "记忆" },
  { key: "validation", label: "候补" },
  { key: "product", label: "产品" },
  { key: "device", label: "设备" },
  { key: "progress", label: "进展" },
  { key: "story", label: "故事" },
  { key: "assets", label: "素材" }
];

export const PRIMARY_FLOW_TABS: AppTabKey[] = ["home", "interaction", "growth", "memory", "validation"];
export const SECONDARY_FLOW_TABS: AppTabKey[] = ["product", "device", "progress", "story", "assets"];
