import { PRIMARY_FLOW_TABS, TAB_ROUTES } from "./routes";
import type { AppTabKey } from "../state/types";

type BottomTabsProps = {
  activeTab: AppTabKey;
  onChange: (tab: AppTabKey) => void;
};

function routeLabel(tab: AppTabKey): string {
  return TAB_ROUTES.find((item) => item.key === tab)?.label ?? tab;
}

export function BottomTabs({ activeTab, onChange }: BottomTabsProps) {
  return (
    <nav className="bottom-tabs" aria-label="主导航" data-testid="primary-bottom-tabs">
      <div className="bottom-tabs-primary">
        {PRIMARY_FLOW_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "bottom-tab active" : "bottom-tab"}
            onClick={() => onChange(tab)}
            aria-label={`切换到${routeLabel(tab)}`}
            data-testid={`tab-${tab}`}
          >
            {routeLabel(tab)}
          </button>
        ))}
      </div>
    </nav>
  );
}
