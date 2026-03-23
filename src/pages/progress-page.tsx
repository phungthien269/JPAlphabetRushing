import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/layout";
import { Badge, Card, MetricCard, ProgressBar, SectionHeader } from "../components/ui";
import { learningItems } from "../lib/kana-data";
import { getProgressByGroup, getProgressByScript, getRecentSessions, getWeakItems, summarizeSnapshot } from "../lib/progress";
import { formatDate, formatPercent } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";

export function ProgressPage() {
  const { t } = useTranslation();
  const snapshot = useAppStore((state) => state.snapshot);
  const summary = useMemo(() => summarizeSnapshot(snapshot, learningItems), [snapshot]);
  const byScript = useMemo(() => getProgressByScript(learningItems, snapshot.progress), [snapshot.progress]);
  const byHiraganaGroup = useMemo(() => getProgressByGroup(learningItems, snapshot.progress, "hiragana"), [snapshot.progress]);
  const byKatakanaGroup = useMemo(() => getProgressByGroup(learningItems, snapshot.progress, "katakana"), [snapshot.progress]);
  const recentSessions = useMemo(() => getRecentSessions(snapshot.sessions), [snapshot.sessions]);
  const weakItems = useMemo(() => getWeakItems(learningItems, snapshot.progress), [snapshot.progress]);

  return (
    <AppShell title={t("progress.title")} subtitle={t("progress.subtitle")}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("common.studied")} value={`${summary.totalStudied}`} />
        <MetricCard label={t("common.learned")} value={`${summary.learned}`} />
        <MetricCard label={t("common.mastered")} value={`${summary.mastered}`} />
        <MetricCard label={t("common.accuracy")} value={formatPercent(summary.accuracy)} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-4 p-5">
          <SectionHeader title={t("progress.byScript")} />
          <div className="space-y-4">
            {byScript.map((entry) => (
              <div key={entry.scriptType} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{entry.scriptType === "hiragana" ? t("scripts.hiragana") : t("scripts.katakana")}</span>
                  <span className="text-[var(--color-text-muted)]">
                    {entry.studied}/{entry.total}
                  </span>
                </div>
                <ProgressBar value={entry.ratio * 100} />
              </div>
            ))}
          </div>
          <SectionHeader title={t("common.reviewNeeded")} />
          <div className="grid gap-3 sm:grid-cols-2">
            {weakItems.slice(0, 4).map(({ item, progress }) => (
              <Card key={item.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="kana-text text-3xl">{item.character}</div>
                  <Badge>{t(`status.${progress.status}`)}</Badge>
                </div>
                <div className="text-sm">{item.romaji}</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {t("progress.memoryLabel")} {progress.memoryLevel}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <SectionHeader title={t("progress.byGroup")} />
          <div className="grid gap-4 lg:grid-cols-2">
            {[{ title: t("scripts.hiragana"), data: byHiraganaGroup }, { title: t("scripts.katakana"), data: byKatakanaGroup }].map((group) => (
              <div key={group.title} className="space-y-3">
                <div className="font-[var(--font-heading)] text-base font-semibold">{group.title}</div>
                {group.data.map((entry) => (
                  <div key={`${group.title}-${entry.group}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{entry.group}</span>
                      <span className="text-[var(--color-text-muted)]">
                        {entry.studied}/{entry.total}
                      </span>
                    </div>
                    <ProgressBar value={(entry.studied / entry.total) * 100} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card className="space-y-4 p-5">
          <SectionHeader title={t("progress.sessionHistory")} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <Card key={session.id} className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <Badge>{session.mode === "study" ? t("common.startStudy") : t("common.startReview")}</Badge>
                    <div className="text-xs text-[var(--color-text-muted)]">{formatDate(session.endedAt)}</div>
                  </div>
                  <div className="font-medium capitalize">{session.scriptType}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {t("stats.correctLine", {
                      correct: session.correctCount,
                      total: session.correctCount + session.incorrectCount,
                    })}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-sm text-[var(--color-text-muted)]">{t("progress.noSessions")}</div>
            )}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
