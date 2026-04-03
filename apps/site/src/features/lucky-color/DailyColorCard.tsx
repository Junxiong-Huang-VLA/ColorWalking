import { ATMOSPHERE_THEME_MAP } from "./colorTheme";

type DailyColorCardProps = {
  dayKey: string;
  colorName: string;
  colorHex: string;
  eyeSoftHex: string;
  colorMessage: string;
  syncStatus: "idle" | "synced" | "pending_device";
  atmosphereTheme: "moon_warm" | "cloud_cool" | "mist_pastel";
  greeting: string;
  onDraw: () => void;
};

function syncLabel(status: DailyColorCardProps["syncStatus"]): string {
  if (status === "synced") return "已同步";
  if (status === "pending_device") return "等待设备同步";
  return "未同步";
}

export function DailyColorCard(props: DailyColorCardProps) {
  const { panel, hint } = ATMOSPHERE_THEME_MAP[props.atmosphereTheme];
  return (
    <article className={`card daily-color-card ${panel}`}>
      <header className="daily-color-head">
        <div>
          <h2>今日幸运色</h2>
          <small>{props.dayKey}</small>
        </div>
        <span className={`sync-pill ${props.syncStatus}`}>{syncLabel(props.syncStatus)}</span>
      </header>

      <div className="daily-color-row">
        <span className="daily-color-swatch" style={{ backgroundColor: props.colorHex }} />
        <div>
          <b>{props.colorName}</b>
          <p>{props.colorHex}</p>
        </div>
      </div>

      <div className="color-sync-preview">
        <div>
          <small>围巾</small>
          <span style={{ backgroundColor: props.colorHex }} />
        </div>
        <div>
          <small>眼睛</small>
          <span style={{ backgroundColor: props.eyeSoftHex }} />
        </div>
      </div>

      <p className="daily-color-message">{props.colorMessage}</p>
      <p className="daily-color-greeting">{props.greeting}</p>
      <p className="daily-color-meta">氛围：{hint}</p>

      <button type="button" className="primary-btn" onClick={props.onDraw}>
        领取今日幸运色
      </button>
    </article>
  );
}
