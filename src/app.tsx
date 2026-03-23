import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";
import i18n from "./lib/i18n";
import { bootstrapPersistence, loadPersistenceStatus } from "./lib/storage";
import { useAppStore } from "./store/use-app-store";
import { HomePage } from "./pages/home-page";
import { ProgressPage } from "./pages/progress-page";
import { ReviewPage } from "./pages/review-page";
import { ScriptSelectionPage } from "./pages/script-selection-page";
import { SelectionPage } from "./pages/selection-page";
import { SettingsPage } from "./pages/settings-page";
import { StudyPage } from "./pages/study-page";
import { AuthCallbackPage } from "./pages/auth-callback-page";

export function App() {
  const setHydrated = useAppStore((state) => state.setHydrated);
  const setSnapshot = useAppStore((state) => state.setSnapshot);
  const setPersistence = useAppStore((state) => state.setPersistence);
  const snapshot = useAppStore((state) => state.snapshot);
  const setInstallPromptEvent = useAppStore((state) => state.setInstallPromptEvent);

  const bootstrap = useQuery({
    queryKey: ["app-bootstrap"],
    queryFn: bootstrapPersistence,
  });

  useEffect(() => {
    if (!bootstrap.data) return;
    setSnapshot(bootstrap.data.snapshot);
    setPersistence({
      mode: bootstrap.data.syncMode,
      phase: bootstrap.data.syncPhase,
      userId: bootstrap.data.userId,
      lastSyncedAt: loadPersistenceStatus().lastSyncedAt,
      lastError: bootstrap.data.lastError,
    });
    setHydrated(true);
  }, [bootstrap.data, setHydrated, setPersistence, setSnapshot]);

  useEffect(() => {
    void i18n.changeLanguage(snapshot.preferences.language);
    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = snapshot.preferences.theme === "dark" || (snapshot.preferences.theme === "system" && systemDark);
    root.classList.toggle("dark", isDark);
  }, [snapshot.preferences.language, snapshot.preferences.theme]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as never);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [setInstallPromptEvent]);

  if (bootstrap.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-[var(--color-text-muted)]">
        {i18n.t("common.loading")}
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/scripts" element={<ScriptSelectionPage />} />
      <Route path="/scripts/:script/select" element={<SelectionPage />} />
      <Route path="/study/:script" element={<StudyPage />} />
      <Route path="/review/:script" element={<ReviewPage />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
    </Routes>
  );
}
