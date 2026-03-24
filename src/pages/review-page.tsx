import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout";
import { Badge, Button, Card, EmptyState, ProgressBar } from "../components/ui";
import { appendSessionToSnapshot, persistSession, updateSnapshotProgress } from "../lib/app-actions";
import { getItemsByScript, learningItems } from "../lib/kana-data";
import { applyReviewFeedback, createDefaultProgress, markCompletedReviewSession } from "../lib/progress";
import { applyAnswer, buildReviewQuestion, createReviewSession, getNextItemId, isSessionComplete } from "../lib/review-engine";
import { createId, formatPercent } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";
import type { LearningAttempt, LearningSession, ReviewQuestion, ReviewSessionState, ScriptType } from "../types";

export function ReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { script = "hiragana" } = useParams<{ script: ScriptType }>();
  const snapshot = useAppStore((state) => state.snapshot);
  const patchSnapshot = useAppStore((state) => state.patchSnapshot);
  const selectedIds = useAppStore((state) => state.selectedIds);
  const persistence = useAppStore((state) => state.persistence);
  const selectedItems = useMemo(() => getItemsByScript(script).filter((item) => selectedIds.includes(item.id)), [script, selectedIds]);
  const initialReviewModel = useMemo(() => {
    if (selectedItems.length === 0) {
      return { sessionState: null, currentQuestion: null };
    }
    const baseState = createReviewSession(
      selectedItems.map((item) => item.id),
      snapshot.preferences.reviewDefaults.promptTypes,
    );
    const { state, itemId } = getNextItemId(baseState);
    return {
      sessionState: state,
      currentQuestion: itemId
        ? buildReviewQuestion(itemId, selectedItems, learningItems, state.questionTypes, snapshot.preferences.language)
        : null,
    };
  }, [selectedItems, snapshot.preferences.language, snapshot.preferences.reviewDefaults.promptTypes]);
  const [sessionState, setSessionState] = useState<ReviewSessionState | null>(() => initialReviewModel.sessionState);
  const [currentQuestion, setCurrentQuestion] = useState<ReviewQuestion | null>(() => initialReviewModel.currentQuestion);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string; selectedAnswer: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [attempts, setAttempts] = useState<LearningAttempt[]>([]);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [startedAt] = useState(() => new Date().toISOString());
  const suppressSpaceKeyUpRef = useRef(false);

  const progressMap = useMemo(() => new Map(snapshot.progress.map((entry) => [entry.itemId, entry])), [snapshot.progress]);

  const handleAnswer = useCallback((option: string) => {
    if (!currentQuestion || !sessionState || feedback) return;
    const itemId = currentQuestion.itemId;
    const remainingBefore = sessionState.items[itemId]?.remaining ?? 0;
    const correct = option === currentQuestion.correctAnswer;
    const nextState = applyAnswer(sessionState, itemId, correct);
    const remainingAfter = nextState.items[itemId]?.remaining ?? 0;
    if (remainingBefore > 0 && remainingAfter === 0) {
      setCompletedItems((previous) => new Set(previous).add(itemId));
    }
    setSessionState(nextState);
    setFeedback({ correct, correctAnswer: currentQuestion.correctAnswer, selectedAnswer: option });
    setAttempts((previous) => [
      ...previous,
      {
        id: createId("attempt"),
        sessionId: `review_draft_${script}`,
        itemId,
        promptType: currentQuestion.promptType,
        selectedAnswer: option,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: correct,
        remainingBefore,
        remainingAfter,
        answeredAt: new Date().toISOString(),
      },
    ]);
  }, [currentQuestion, feedback, script, sessionState]);

  const continueFlow = useCallback(async () => {
    if (!sessionState) return;
    if (isSessionComplete(sessionState)) {
      const nextProgress = [...snapshot.progress];
      const touchedItemIds = new Set(attempts.map((attempt) => attempt.itemId));
      for (const itemId of touchedItemIds) {
        const existing = progressMap.get(itemId) ?? createDefaultProgress(itemId);
        const relevantAttempts = attempts.filter((attempt) => attempt.itemId === itemId);
        let updated = existing;
        for (const attempt of relevantAttempts) {
          updated = applyReviewFeedback(updated, attempt.isCorrect);
        }
        if (completedItems.has(itemId)) {
          updated = markCompletedReviewSession(updated);
        }
        const index = nextProgress.findIndex((entry) => entry.itemId === itemId);
        if (index >= 0) nextProgress[index] = updated;
        else nextProgress.push(updated);
      }
      const progressSnapshot = updateSnapshotProgress(snapshot, nextProgress);
      const session: LearningSession = {
        id: createId("session"),
        userId: persistence.userId ?? undefined,
        mode: "review",
        scriptType: script,
        selectionScope: selectedItems.map((item) => item.id),
        questionTypes: snapshot.preferences.reviewDefaults.promptTypes,
        startedAt,
        endedAt: new Date().toISOString(),
        durationSeconds: Math.max(5, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)),
        itemsTotal: selectedItems.length,
        itemsCompleted: completedItems.size,
        correctCount: attempts.filter((attempt) => attempt.isCorrect).length,
        incorrectCount: attempts.filter((attempt) => !attempt.isCorrect).length,
      };
      const nextSnapshot = appendSessionToSnapshot(progressSnapshot, session, attempts);
      patchSnapshot(() => nextSnapshot);
      await persistSession(nextSnapshot, session, attempts, persistence.userId);
      void navigate("/progress");
      return;
    }

    const { state, itemId } = getNextItemId(sessionState);
    setSessionState(state);
    setFeedback(null);
    setRevealed(false);
    if (itemId) {
      setCurrentQuestion(buildReviewQuestion(itemId, selectedItems, learningItems, state.questionTypes, snapshot.preferences.language));
    }
  }, [
    attempts,
    completedItems,
    navigate,
    patchSnapshot,
    persistence.userId,
    progressMap,
    script,
    selectedItems,
    sessionState,
    startedAt,
    snapshot,
  ]);

  useEffect(() => {
    if (!feedback) return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }, [feedback]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        event.stopPropagation();
      }

      if (!feedback && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code) && currentQuestion) {
        const index = Number(event.code.replace("Digit", "")) - 1;
        const option = currentQuestion.options[index];
        if (option) handleAnswer(option);
        return;
      }

      if (!feedback) return;

      if ((event.key === "Control" || event.ctrlKey) && !feedback.correct && !revealed) {
        event.preventDefault();
        event.stopPropagation();
        setRevealed(true);
        return;
      }

      if (event.code === "Space") {
        suppressSpaceKeyUpRef.current = true;
        void continueFlow();
      }
    };
    const onKeyPress = (event: KeyboardEvent) => {
      if (feedback && event.code === "Space") {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" && suppressSpaceKeyUpRef.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressSpaceKeyUpRef.current = false;
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keypress", onKeyPress, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("keypress", onKeyPress, { capture: true });
      window.removeEventListener("keyup", onKeyUp, { capture: true });
    };
  }, [continueFlow, currentQuestion, feedback, handleAnswer, revealed]);

  if (selectedItems.length === 0) {
    return (
      <AppShell title={t("review.title")} subtitle={t("common.selectionRequired")}>
        <EmptyState title={t("review.emptyTitle")} description={t("review.emptyDescription")} action={<Button onClick={() => void navigate(`/scripts/${script}/select`)}>{t("study.backToSelection")}</Button>} />
      </AppShell>
    );
  }

  if (!currentQuestion || !sessionState) {
    return (
      <AppShell title={t("review.title")} subtitle={t("common.loading")}>
        <Card className="p-8 text-center text-sm text-[var(--color-text-muted)]">{t("common.loading")}</Card>
      </AppShell>
    );
  }

  const activeRemaining = Object.values(sessionState.items).reduce((sum, entry) => sum + entry.remaining, 0);
  const reviewAccuracy = attempts.length > 0 ? attempts.filter((attempt) => attempt.isCorrect).length / attempts.length : 0;

  return (
    <AppShell title={t("review.title")} subtitle={t("review.finalMessage")}>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.32fr]">
        <Card className="space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge>{currentQuestion.promptType === "char_to_meaning" ? t("review.queueLabelCharToMeaning") : t("review.queueLabelMeaningToChar")}</Badge>
            <div className="text-sm text-[var(--color-text-muted)]">
              {t("review.remaining")}: {activeRemaining}
            </div>
          </div>
          <ProgressBar value={selectedItems.length > 0 ? ((selectedItems.length - Object.values(sessionState.items).filter((entry) => entry.remaining > 0).length) / selectedItems.length) * 100 : 0} />
          <div className="surface-card space-y-5 rounded-[2rem] p-8 text-center">
            <div className="kana-text text-6xl font-semibold sm:text-7xl">{currentQuestion.prompt}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option) => (
                <Button key={option} variant={feedback?.selectedAnswer === option ? (feedback.correct ? "primary" : "danger") : "secondary"} className="min-h-14 justify-start text-left" onClick={() => handleAnswer(option)} disabled={Boolean(feedback)}>
                  {option}
                </Button>
              ))}
            </div>
            {feedback ? (
              <div className="space-y-3 rounded-[1.5rem] border border-[var(--color-border)] bg-white/40 p-4 text-left dark:bg-slate-950/20">
                <div className={feedback.correct ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
                  {feedback.correct ? t("review.correct") : t("review.incorrect")}
                </div>
                {!feedback.correct && !revealed ? (
                  <Button variant="secondary" onClick={() => setRevealed(true)}>
                    {t("common.revealAnswer")}
                  </Button>
                ) : null}
                {revealed || feedback.correct ? (
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {currentQuestion.correctAnswer}
                  </div>
                ) : null}
                <Button onClick={() => void continueFlow()}>{t("common.continue")}</Button>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-[var(--font-heading)] text-lg font-semibold">{t("common.summary")}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>{t("common.accuracy")}</span>
              <span>{formatPercent(reviewAccuracy)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("common.studied")}</span>
              <span>{attempts.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("common.mastered")}</span>
              <span>{completedItems.size}</span>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
