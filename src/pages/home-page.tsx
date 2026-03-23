import { ArrowRight, BookOpenText, ChartNoAxesCombined, Languages, TimerReset } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout";
import { Badge, Button, Card, MetricCard, SectionHeader } from "../components/ui";
import { learningItems } from "../lib/kana-data";
import { getWeakItems, summarizeSnapshot } from "../lib/progress";
import { formatPercent } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";

export function HomePage() {
  const { t } = useTranslation();
  const snapshot = useAppStore((state) => state.snapshot);
  const persistence = useAppStore((state) => state.persistence);
  const setSelectedScript = useAppStore((state) => state.setSelectedScript);
  const setCurrentMode = useAppStore((state) => state.setCurrentMode);
  const summary = useMemo(() => summarizeSnapshot(snapshot, learningItems), [snapshot]);
  const weakItems = useMemo(() => getWeakItems(learningItems, snapshot.progress), [snapshot.progress]);

  return (
    <AppShell>
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="space-y-6 overflow-hidden p-6">
          <Badge>{t("home.quickStart")}</Badge>
          <div className="space-y-3">
            <h1 className="font-[var(--font-heading)] text-4xl font-semibold tracking-tight">{t("home.headline")}</h1>
            <p className="max-w-2xl text-base text-[var(--color-text-muted)]">{t("home.subheadline")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/scripts/hiragana/select" onClick={() => setSelectedScript("hiragana")}>
              <Card className="h-full space-y-3 p-5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <Badge>{t("scripts.hiragana")}</Badge>
                  <Languages className="h-5 w-5 text-[var(--color-text-muted)]" />
                </div>
                <div className="kana-text text-4xl">あ い う え お</div>
                <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                  <span>{t("home.hiraganaMeta")}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
            <Link to="/scripts/katakana/select" onClick={() => setSelectedScript("katakana")}>
              <Card className="h-full space-y-3 p-5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <Badge>{t("scripts.katakana")}</Badge>
                  <Languages className="h-5 w-5 text-[var(--color-text-muted)]" />
                </div>
                <div className="kana-text text-4xl">ア イ ウ エ オ</div>
                <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                  <span>{t("home.katakanaMeta")}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          </div>
          <div className="space-y-3">
            <div className="text-sm font-medium text-[var(--color-text-muted)]">{t("home.quickActions")}</div>
            <div className="flex flex-wrap gap-3">
              <Link to="/scripts" onClick={() => setCurrentMode("study")}>
                <Button>{t("common.startStudy")}</Button>
              </Link>
              <Link to="/scripts" onClick={() => setCurrentMode("review")}>
                <Button variant="secondary">{t("common.startReview")}</Button>
              </Link>
              <Link to="/progress">
                <Button variant="ghost">{t("nav.progress")}</Button>
              </Link>
              <Link to="/settings">
                <Button variant="ghost">{t("nav.settings")}</Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <SectionHeader title={t("home.syncStatus")} />
          <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
            <div className="flex items-center justify-between gap-3">
              <span>{persistence.mode === "remote-ready" ? t("common.remoteReady") : persistence.mode === "remote-offline" ? t("common.remoteOffline") : t("common.localOnly")}</span>
              <Badge>{persistence.userId ? t("common.anonymous") : t("common.localOnly")}</Badge>
            </div>
            {persistence.lastError ? <p className="text-[var(--color-danger)]">{persistence.lastError}</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <MetricCard label={t("common.studied")} value={`${summary.totalStudied}/${summary.total}`} />
            <MetricCard label={t("common.accuracy")} value={formatPercent(summary.accuracy)} />
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("common.studied")} value={`${summary.totalStudied}`} accent={<BookOpenText className="h-4 w-4 text-[var(--color-accent)]" />} />
        <MetricCard label={t("common.learned")} value={`${summary.learned}`} accent={<Languages className="h-4 w-4 text-[var(--color-accent)]" />} />
        <MetricCard label={t("common.mastered")} value={`${summary.mastered}`} accent={<ChartNoAxesCombined className="h-4 w-4 text-[var(--color-accent)]" />} />
        <MetricCard label={t("common.reviewNeeded")} value={`${summary.reviewNeeded}`} accent={<TimerReset className="h-4 w-4 text-[var(--color-accent)]" />} />
      </section>

      <section className="mt-6">
        <SectionHeader title={t("home.recentWeakItems")} />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {weakItems.length > 0 ? (
            weakItems.map(({ item, progress }) => (
              <Card key={item.id} className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="kana-text text-3xl">{item.character}</div>
                  <Badge>{t(`status.${progress.status}`)}</Badge>
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">{item.romaji}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{snapshot.preferences.language === "vi" ? item.noteVi : item.noteEn}</div>
              </Card>
            ))
          ) : (
            <Card className="p-5 text-sm text-[var(--color-text-muted)]">{t("home.emptyWeakItems")}</Card>
          )}
        </div>
      </section>
    </AppShell>
  );
}
