import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/layout";
import { Badge, Button, Card, SectionHeader } from "../components/ui";
import { persistPreferences, updateSnapshotPreferences } from "../lib/app-actions";
import { formatDate } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";
import type { ThemeMode } from "../types";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const snapshot = useAppStore((state) => state.snapshot);
  const persistence = useAppStore((state) => state.persistence);
  const installPromptEvent = useAppStore((state) => state.installPromptEvent);
  const patchSnapshot = useAppStore((state) => state.patchSnapshot);
  const [capturingKey, setCapturingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!capturingKey) return;
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      const nextSnapshot = updateSnapshotPreferences(snapshot, {
        ...snapshot.preferences,
        keyboardShortcuts: {
          ...snapshot.preferences.keyboardShortcuts,
          [capturingKey]: event.code,
        },
      });
      patchSnapshot(() => nextSnapshot);
      void persistPreferences(nextSnapshot, persistence.userId);
      setCapturingKey(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [capturingKey, patchSnapshot, persistence.userId, snapshot]);

  async function updateLanguage(language: "en" | "vi") {
    const nextSnapshot = updateSnapshotPreferences(snapshot, {
      ...snapshot.preferences,
      language,
    });
    patchSnapshot(() => nextSnapshot);
    await i18n.changeLanguage(language);
    await persistPreferences(nextSnapshot, persistence.userId);
  }

  async function updateTheme(theme: ThemeMode) {
    const nextSnapshot = updateSnapshotPreferences(snapshot, {
      ...snapshot.preferences,
      theme,
    });
    patchSnapshot(() => nextSnapshot);
    await persistPreferences(nextSnapshot, persistence.userId);
  }

  async function promptInstall() {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
  }

  return (
    <AppShell title={t("settings.title")} subtitle={t("settings.note")}>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4 p-5">
          <SectionHeader title={t("settings.language")} />
          <div className="flex gap-2">
            {(["vi", "en"] as const).map((language) => (
              <Button key={language} variant={snapshot.preferences.language === language ? "primary" : "secondary"} onClick={() => void updateLanguage(language)}>
                {language.toUpperCase()}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <SectionHeader title={t("settings.theme")} />
          <div className="flex flex-wrap gap-2">
            {(["light", "dark", "system"] as const).map((theme) => (
              <Button key={theme} variant={snapshot.preferences.theme === theme ? "primary" : "secondary"} onClick={() => void updateTheme(theme)}>
                {t(`common.${theme}`)}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <SectionHeader title={t("settings.shortcuts")} />
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(snapshot.preferences.keyboardShortcuts).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-[var(--color-border)] p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{t(`settings.shortcutLabels.${key}`)}</div>
                <div className="mt-2 font-medium">{value}</div>
                <Button className="mt-3 w-full" variant="secondary" size="sm" onClick={() => setCapturingKey(key)}>
                  {capturingKey === key ? t("settings.pressKey") : t("settings.remap")}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <SectionHeader title={t("settings.persistence")} />
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>{t("settings.mode")}</span>
              <Badge>{t(`settings.modeLabels.${persistence.mode}`)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("settings.phase")}</span>
              <Badge>{t(`settings.phaseLabels.${persistence.phase}`)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("settings.user")}</span>
              <Badge>{persistence.userId ? t("common.anonymous") : t("common.localOnly")}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("settings.lastSynced")}</span>
              <span>{formatDate(persistence.lastSyncedAt)}</span>
            </div>
            {persistence.lastError ? <p className="text-sm text-[var(--color-danger)]">{persistence.lastError}</p> : null}
          </div>
        </Card>

        <Card className="space-y-4 p-5 xl:col-span-2">
          <SectionHeader title={t("settings.install")} />
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <p>{installPromptEvent ? t("settings.installReady") : t("settings.installFallback")}</p>
            <Button disabled={!installPromptEvent} onClick={() => void promptInstall()}>
              {t("common.install")}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
