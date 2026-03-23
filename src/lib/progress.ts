import type { LearningItem, LearningSession, ProgressSnapshot, UserItemProgress } from "../types";
import { clamp, getRelativeDays } from "./utils";

const REVIEW_STALE_DAYS = 14;

export function createDefaultProgress(itemId: string): UserItemProgress {
  return {
    itemId,
    memoryLevel: 0,
    status: "not_started",
    correctCount: 0,
    incorrectCount: 0,
    currentStreak: 0,
    completedReviewSessions: 0,
    lastStudiedAt: null,
    lastReviewedAt: null,
    lastStatusChangeAt: null,
    updatedAt: new Date().toISOString(),
  };
}

export function deriveStatus(progress: UserItemProgress) {
  if (!progress.lastStudiedAt && !progress.lastReviewedAt && progress.correctCount === 0 && progress.incorrectCount === 0) {
    return "not_started" as const;
  }
  if (
    (progress.status === "learned" || progress.status === "mastered" || progress.status === "review_needed") &&
    (progress.memoryLevel < 50 || getRelativeDays(progress.lastReviewedAt) > REVIEW_STALE_DAYS)
  ) {
    return "review_needed" as const;
  }
  if (progress.memoryLevel >= 85 && progress.completedReviewSessions >= 3) {
    return "mastered" as const;
  }
  if (progress.memoryLevel >= 50) {
    return "learned" as const;
  }
  return "learning" as const;
}

function finalizeProgress(progress: UserItemProgress) {
  const nextStatus = deriveStatus(progress);
  return {
    ...progress,
    status: nextStatus,
    lastStatusChangeAt: progress.status !== nextStatus ? new Date().toISOString() : progress.lastStatusChangeAt,
    updatedAt: new Date().toISOString(),
  };
}

export function applyStudyFeedback(progress: UserItemProgress, remembered: boolean): UserItemProgress {
  return finalizeProgress({
    ...progress,
    memoryLevel: clamp(progress.memoryLevel + (remembered ? 3 : -2), 0, 100),
    currentStreak: remembered ? progress.currentStreak + 1 : 0,
    correctCount: remembered ? progress.correctCount + 1 : progress.correctCount,
    incorrectCount: remembered ? progress.incorrectCount : progress.incorrectCount + 1,
    lastStudiedAt: new Date().toISOString(),
  });
}

export function applyReviewFeedback(progress: UserItemProgress, correct: boolean): UserItemProgress {
  return finalizeProgress({
    ...progress,
    memoryLevel: clamp(progress.memoryLevel + (correct ? 5 : -4), 0, 100),
    currentStreak: correct ? progress.currentStreak + 1 : 0,
    correctCount: correct ? progress.correctCount + 1 : progress.correctCount,
    incorrectCount: correct ? progress.incorrectCount : progress.incorrectCount + 1,
    lastReviewedAt: new Date().toISOString(),
  });
}

export function markCompletedReviewSession(progress: UserItemProgress): UserItemProgress {
  return finalizeProgress({
    ...progress,
    completedReviewSessions: progress.completedReviewSessions + 1,
    lastReviewedAt: new Date().toISOString(),
  });
}

export function summarizeSnapshot(snapshot: ProgressSnapshot, items: LearningItem[]) {
  const progressMap = new Map(snapshot.progress.map((entry) => [entry.itemId, entry]));
  const entries = items.map((item) => progressMap.get(item.id) ?? createDefaultProgress(item.id));
  const total = entries.length;
  const totalStudied = entries.filter((entry) => entry.status !== "not_started").length;
  const learned = entries.filter((entry) => entry.status === "learned").length;
  const mastered = entries.filter((entry) => entry.status === "mastered").length;
  const reviewNeeded = entries.filter((entry) => entry.status === "review_needed").length;
  const correct = entries.reduce((sum, entry) => sum + entry.correctCount, 0);
  const incorrect = entries.reduce((sum, entry) => sum + entry.incorrectCount, 0);
  return {
    total,
    totalStudied,
    learned,
    mastered,
    reviewNeeded,
    accuracy: correct + incorrect > 0 ? correct / (correct + incorrect) : 0,
  };
}

export function getWeakItems(items: LearningItem[], progress: UserItemProgress[], limit = 8) {
  const progressMap = new Map(progress.map((entry) => [entry.itemId, entry]));
  return items
    .map((item) => ({ item, progress: progressMap.get(item.id) ?? createDefaultProgress(item.id) }))
    .filter(({ progress: entry }) => entry.status !== "not_started")
    .sort((left, right) => left.progress.memoryLevel - right.progress.memoryLevel || right.progress.updatedAt.localeCompare(left.progress.updatedAt))
    .slice(0, limit);
}

export function getProgressByScript(items: LearningItem[], progress: UserItemProgress[]) {
  const progressMap = new Map(progress.map((entry) => [entry.itemId, entry]));
  return ["hiragana", "katakana"].map((scriptType) => {
    const scriptItems = items.filter((item) => item.scriptType === scriptType);
    const studied = scriptItems.filter((item) => (progressMap.get(item.id) ?? createDefaultProgress(item.id)).status !== "not_started").length;
    return {
      scriptType,
      total: scriptItems.length,
      studied,
      ratio: scriptItems.length > 0 ? studied / scriptItems.length : 0,
    };
  });
}

export function getProgressByGroup(items: LearningItem[], progress: UserItemProgress[], scriptType: string) {
  const progressMap = new Map(progress.map((entry) => [entry.itemId, entry]));
  const groups = new Map<string, { group: string; total: number; studied: number }>();
  for (const item of items.filter((entry) => entry.scriptType === scriptType)) {
    const existing = groups.get(item.lessonGroup) ?? { group: item.lessonGroup, total: 0, studied: 0 };
    existing.total += 1;
    if ((progressMap.get(item.id) ?? createDefaultProgress(item.id)).status !== "not_started") {
      existing.studied += 1;
    }
    groups.set(item.lessonGroup, existing);
  }
  return [...groups.values()].sort((left, right) => left.group.localeCompare(right.group));
}

export function getRecentSessions(sessions: LearningSession[], limit = 8) {
  return [...sessions].sort((left, right) => right.endedAt.localeCompare(left.endedAt)).slice(0, limit);
}
