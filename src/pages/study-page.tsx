import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout";
import { Badge, Button, Card, EmptyState, ProgressBar } from "../components/ui";
import { appendSessionToSnapshot, persistSession, updateSnapshotProgress } from "../lib/app-actions";
import { getItemsByScript } from "../lib/kana-data";
import { applyStudyFeedback, createDefaultProgress } from "../lib/progress";
import { createId, formatPercent } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";
import type { LearningAttempt, LearningSession, ScriptType } from "../types";

export function StudyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { script = "hiragana" } = useParams<{ script: ScriptType }>();
  const snapshot = useAppStore((state) => state.snapshot);
  const patchSnapshot = useAppStore((state) => state.patchSnapshot);
  const selectedIds = useAppStore((state) => state.selectedIds);
  const persistence = useAppStore((state) => state.persistence);
  const scriptItems = useMemo(
    () => getItemsByScript(script).filter((item) => selectedIds.includes(item.id)),
    [script, selectedIds],
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [attempts, setAttempts] = useState<LearningAttempt[]>([]);
  const [startedAt] = useState(() => new Date().toISOString());

  const currentItem = scriptItems[index];
  const progressMap = useMemo(() => new Map(snapshot.progress.map((entry) => [entry.itemId, entry])), [snapshot.progress]);
  const answeredCount = attempts.length;

  const recordFeedback = useCallback((remembered: boolean) => {
    if (!currentItem) return;
    const nextProgress = [...snapshot.progress];
    const existing = progressMap.get(currentItem.id) ?? createDefaultProgress(currentItem.id);
    const updated = applyStudyFeedback(existing, remembered);
    const existingIndex = nextProgress.findIndex((entry) => entry.itemId === currentItem.id);
    if (existingIndex >= 0) nextProgress[existingIndex] = updated;
    else nextProgress.push(updated);
    const sessionId = `study_draft_${script}`;
    const nextAttempts = [
      ...attempts,
      {
        id: createId("attempt"),
        sessionId,
        itemId: currentItem.id,
        promptType: "char_to_meaning" as const,
        selectedAnswer: remembered ? "remembered" : "not_remembered",
        correctAnswer: "remembered",
        isCorrect: remembered,
        remainingBefore: null,
        remainingAfter: null,
        answeredAt: new Date().toISOString(),
      },
    ];
    setAttempts(nextAttempts);
    patchSnapshot((previous) => updateSnapshotProgress(previous, nextProgress));
    if (index < scriptItems.length - 1) {
      setIndex(index + 1);
      setFlipped(false);
    }
  }, [attempts, currentItem, index, patchSnapshot, progressMap, script, scriptItems.length, snapshot.progress]);

  async function finishSession() {
    const session: LearningSession = {
      id: createId("session"),
      userId: persistence.userId ?? undefined,
      mode: "study",
      scriptType: script,
      selectionScope: scriptItems.map((item) => item.id),
      questionTypes: snapshot.preferences.reviewDefaults.promptTypes,
      startedAt,
      endedAt: new Date().toISOString(),
      durationSeconds: Math.max(5, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)),
      itemsTotal: scriptItems.length,
      itemsCompleted: attempts.length,
      correctCount: attempts.filter((entry) => entry.isCorrect).length,
      incorrectCount: attempts.filter((entry) => !entry.isCorrect).length,
    };
    const nextSnapshot = appendSessionToSnapshot(useAppStore.getState().snapshot, session, attempts);
    patchSnapshot(() => nextSnapshot);
    await persistSession(nextSnapshot, session, attempts, persistence.userId);
    void navigate("/progress");
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const { keyboardShortcuts } = snapshot.preferences;
      if (event.code === keyboardShortcuts.flip) {
        event.preventDefault();
        setFlipped((current) => !current);
      }
      if (event.code === keyboardShortcuts.next) {
        event.preventDefault();
        setIndex((current) => Math.min(current + 1, scriptItems.length - 1));
      }
      if (event.code === keyboardShortcuts.back) {
        event.preventDefault();
        setIndex((current) => Math.max(current - 1, 0));
      }
      if (event.code === keyboardShortcuts.remembered) {
        event.preventDefault();
        recordFeedback(true);
      }
      if (event.code === keyboardShortcuts.notRemembered) {
        event.preventDefault();
        recordFeedback(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [recordFeedback, scriptItems.length, snapshot.preferences]);

  if (scriptItems.length === 0) {
    return (
        <AppShell title={t("study.title")} subtitle={t("common.selectionRequired")}>
        <EmptyState title={t("study.emptyTitle")} description={t("study.emptyDescription")} action={<Button onClick={() => void navigate(`/scripts/${script}/select`)}>{t("study.backToSelection")}</Button>} />
      </AppShell>
    );
  }

  return (
    <AppShell title={t("study.title")} subtitle={t("study.flipHint")}>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.32fr]">
        <Card className="space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge>{currentItem.lessonGroup}</Badge>
            <div className="text-sm text-[var(--color-text-muted)]">
              {index + 1}/{scriptItems.length} · {answeredCount} {t("study.answered").toLowerCase()}
            </div>
          </div>
          <ProgressBar value={((index + 1) / scriptItems.length) * 100} />
          <div className="mx-auto w-full max-w-xl [perspective:1200px]">
            <AnimatePresence mode="wait">
              <motion.button
                key={`${currentItem.id}-${flipped ? "back" : "front"}`}
                type="button"
                className="surface-card flex min-h-[420px] w-full cursor-pointer flex-col items-center justify-center gap-5 rounded-[2rem] p-8 text-center"
                onClick={() => setFlipped((current) => !current)}
                initial={{ opacity: 0, rotateY: reduceMotion ? 0 : 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: reduceMotion ? 0 : -90 }}
                transition={{ duration: 0.28 }}
              >
                <Badge>{flipped ? t("study.cardBack") : t("study.cardFront")}</Badge>
                <div className="kana-text text-7xl font-semibold tracking-tight sm:text-8xl">
                  {flipped ? currentItem.romaji : currentItem.character}
                </div>
                <div className="max-w-md text-sm text-[var(--color-text-muted)]">
                  {flipped
                    ? snapshot.preferences.language === "vi"
                      ? currentItem.noteVi
                      : currentItem.noteEn
                    : t("study.flipHint")}
                </div>
              </motion.button>
            </AnimatePresence>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIndex((current) => Math.max(current - 1, 0))}>
                {t("common.back")}
              </Button>
              <Button variant="secondary" onClick={() => setFlipped((current) => !current)}>
                {snapshot.preferences.keyboardShortcuts.flip}
              </Button>
              <Button variant="ghost" onClick={() => setIndex((current) => Math.min(current + 1, scriptItems.length - 1))}>
                {t("common.next")}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => recordFeedback(false)}>
                {t("common.notRemembered")}
              </Button>
              <Button onClick={() => recordFeedback(true)}>{t("common.remembered")}</Button>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-[var(--font-heading)] text-lg font-semibold">{t("common.summary")}</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
            <p>{snapshot.preferences.keyboardShortcuts.flip} · {t("study.shortcutFlip")}</p>
            <p>{snapshot.preferences.keyboardShortcuts.next} · {t("study.shortcutNext")}</p>
            <p>{snapshot.preferences.keyboardShortcuts.back} · {t("study.shortcutBack")}</p>
            <p>{snapshot.preferences.keyboardShortcuts.remembered} · {t("study.shortcutRemembered")}</p>
            <p>{snapshot.preferences.keyboardShortcuts.notRemembered} · {t("study.shortcutNotRemembered")}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>{t("common.accuracy")}</span>
              <span>{formatPercent(answeredCount > 0 ? attempts.filter((entry) => entry.isCorrect).length / answeredCount : 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("common.studied")}</span>
              <span>{answeredCount}</span>
            </div>
          </div>
          <Button className="w-full" onClick={() => void finishSession()}>
            {t("study.sessionComplete")}
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
