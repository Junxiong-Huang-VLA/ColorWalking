import { AppShell } from "./app/AppShell";
import { AppStoreProvider } from "./state/store";

export function App() {
  return (
    <AppStoreProvider>
      <AppShell />
    </AppStoreProvider>
  );
}
