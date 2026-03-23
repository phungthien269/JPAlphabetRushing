import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AppBootstrap,
  LearningAttempt,
  LearningSession,
  PromptType,
  PersistenceStatus,
  ProgressSnapshot,
  UserItemProgress,
  UserPreferences,
} from "../types";
import { env, hasSupabaseEnv } from "./env";

const SNAPSHOT_KEY = "kana-flow.snapshot.v1";
const STATUS_KEY = "kana-flow.status.v1";

const defaultPreferences: UserPreferences = {
  language: "vi",
  theme: "system",
  keyboardShortcuts: {
    flip: "Space",
    next: "ArrowRight",
    back: "ArrowLeft",
    remembered: "Digit1",
    notRemembered: "Digit2",
  },
  reviewDefaults: {
    promptTypes: ["char_to_meaning", "meaning_to_char"],
  },
};

const emptySnapshot: ProgressSnapshot = {
  preferences: defaultPreferences,
  progress: [],
  sessions: [],
  attempts: [],
};

let supabase: SupabaseClient | null = null;

type PreferenceRow = {
  language: UserPreferences["language"];
  theme: UserPreferences["theme"];
  keyboard_shortcuts: UserPreferences["keyboardShortcuts"];
  review_defaults: UserPreferences["reviewDefaults"];
};

type ProgressRow = {
  item_id: string;
  user_id: string;
  memory_level: number;
  status: UserItemProgress["status"];
  correct_count: number;
  incorrect_count: number;
  current_streak: number;
  completed_review_sessions: number;
  last_studied_at: string | null;
  last_reviewed_at: string | null;
  last_status_change_at: string | null;
  updated_at: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  mode: LearningSession["mode"];
  script_type: LearningSession["scriptType"];
  selection_scope: string[];
  question_types: PromptType[];
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  items_total: number;
  items_completed: number;
  correct_count: number;
  incorrect_count: number;
};

type AttemptRow = {
  id: string;
  session_id: string;
  item_id: string;
  prompt_type: LearningAttempt["promptType"];
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  remaining_before: number | null;
  remaining_after: number | null;
  answered_at: string;
};

function getClient() {
  if (!hasSupabaseEnv) return null;
  if (!supabase) {
    supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return supabase;
}

export function getDefaultPreferences() {
  return defaultPreferences;
}

export function getLocalSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? ({ ...emptySnapshot, ...JSON.parse(raw) } as ProgressSnapshot) : emptySnapshot;
  } catch {
    return emptySnapshot;
  }
}

export function saveSnapshotLocal(snapshot: ProgressSnapshot) {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function loadPersistenceStatus(): PersistenceStatus {
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    return raw
      ? (JSON.parse(raw) as PersistenceStatus)
      : {
          mode: hasSupabaseEnv ? "remote-ready" : "local-only",
          phase: "booting",
          userId: null,
          lastSyncedAt: null,
          lastError: null,
        };
  } catch {
    return {
      mode: hasSupabaseEnv ? "remote-ready" : "local-only",
      phase: "booting",
      userId: null,
      lastSyncedAt: null,
      lastError: null,
    };
  }
}

function savePersistenceStatus(status: PersistenceStatus) {
  localStorage.setItem(STATUS_KEY, JSON.stringify(status));
}

function commitPersistenceStatus(status: PersistenceStatus) {
  savePersistenceStatus(status);
  return status;
}

function getSyncErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Sync failed";
}

async function ensureAnonymousUser(client: SupabaseClient) {
  const existing = await client.auth.getSession();
  if (existing.data.session?.user) return existing.data.session.user.id;
  const created = await client.auth.signInAnonymously();
  if (created.error) throw created.error;
  return created.data.user?.id ?? null;
}

async function fetchRemoteSnapshot(client: SupabaseClient, userId: string): Promise<ProgressSnapshot> {
  const [prefs, progress, sessions, attempts] = await Promise.all([
    client.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
    client.from("user_item_progress").select("*").eq("user_id", userId),
    client.from("learning_sessions").select("*").eq("user_id", userId).order("ended_at", { ascending: false }),
    client.from("learning_attempts").select("*").order("answered_at", { ascending: false }).limit(200),
  ]);

  const prefsData = prefs.data as PreferenceRow | null;
  const progressData = (progress.data ?? []) as ProgressRow[];
  const sessionData = (sessions.data ?? []) as SessionRow[];
  const attemptData = (attempts.data ?? []) as AttemptRow[];

  return {
    preferences:
      prefsData && !prefs.error
        ? {
            language: prefsData.language,
            theme: prefsData.theme,
            keyboardShortcuts: prefsData.keyboard_shortcuts,
            reviewDefaults: prefsData.review_defaults,
          }
        : defaultPreferences,
    progress:
      progressData.map((entry) => ({
        itemId: entry.item_id,
        userId: entry.user_id,
        memoryLevel: entry.memory_level,
        status: entry.status,
        correctCount: entry.correct_count,
        incorrectCount: entry.incorrect_count,
        currentStreak: entry.current_streak,
        completedReviewSessions: entry.completed_review_sessions,
        lastStudiedAt: entry.last_studied_at,
        lastReviewedAt: entry.last_reviewed_at,
        lastStatusChangeAt: entry.last_status_change_at,
        updatedAt: entry.updated_at,
      })),
    sessions:
      sessionData.map((entry) => ({
        id: entry.id,
        userId: entry.user_id,
        mode: entry.mode,
        scriptType: entry.script_type,
        selectionScope: entry.selection_scope,
        questionTypes: entry.question_types,
        startedAt: entry.started_at,
        endedAt: entry.ended_at,
        durationSeconds: entry.duration_seconds,
        itemsTotal: entry.items_total,
        itemsCompleted: entry.items_completed,
        correctCount: entry.correct_count,
        incorrectCount: entry.incorrect_count,
      })),
    attempts:
      attemptData.map((entry) => ({
        id: entry.id,
        sessionId: entry.session_id,
        itemId: entry.item_id,
        promptType: entry.prompt_type,
        selectedAnswer: entry.selected_answer,
        correctAnswer: entry.correct_answer,
        isCorrect: entry.is_correct,
        remainingBefore: entry.remaining_before,
        remainingAfter: entry.remaining_after,
        answeredAt: entry.answered_at,
      })),
  };
}

function mergeById<T extends { id?: string; itemId?: string; updatedAt?: string }>(local: T[], remote: T[]) {
  const keyOf = (entry: T) => entry.id ?? entry.itemId ?? crypto.randomUUID();
  const merged = new Map<string, T>();
  for (const entry of [...local, ...remote]) {
    const key = keyOf(entry);
    const previous = merged.get(key);
    if (!previous) {
      merged.set(key, entry);
      continue;
    }
    const prevTime = previous.updatedAt ?? "";
    const nextTime = entry.updatedAt ?? "";
    if (nextTime >= prevTime) {
      merged.set(key, entry);
    }
  }
  return [...merged.values()];
}

export async function bootstrapPersistence(): Promise<AppBootstrap> {
  const localSnapshot = getLocalSnapshot();
  if (!hasSupabaseEnv) {
    const status = {
      mode: "local-only" as const,
      phase: "ready" as const,
      userId: null,
      lastSyncedAt: null,
      lastError: null,
    };
    savePersistenceStatus(status);
    return { snapshot: localSnapshot, syncMode: status.mode, syncPhase: status.phase, userId: null, lastError: null };
  }

  const client = getClient();
  if (!client) {
    return { snapshot: localSnapshot, syncMode: "local-only", syncPhase: "error", userId: null, lastError: "Supabase unavailable" };
  }

  try {
    const userId = await ensureAnonymousUser(client);
    if (!userId) {
      return { snapshot: localSnapshot, syncMode: "remote-offline", syncPhase: "error", userId: null, lastError: "Anonymous session failed" };
    }
    const remoteSnapshot = await fetchRemoteSnapshot(client, userId);
    const mergedSnapshot = {
      preferences: remoteSnapshot.preferences ?? localSnapshot.preferences,
      progress: mergeById(localSnapshot.progress, remoteSnapshot.progress),
      sessions: mergeById(localSnapshot.sessions, remoteSnapshot.sessions),
      attempts: mergeById(localSnapshot.attempts, remoteSnapshot.attempts),
    };
    saveSnapshotLocal(mergedSnapshot);
    const status = {
      mode: "remote-ready" as const,
      phase: "ready" as const,
      userId,
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
    };
    savePersistenceStatus(status);
    return { snapshot: mergedSnapshot, syncMode: status.mode, syncPhase: status.phase, userId, lastError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    const status = {
      mode: "remote-offline" as const,
      phase: "error" as const,
      userId: null,
      lastSyncedAt: null,
      lastError: message,
    };
    savePersistenceStatus(status);
    return { snapshot: localSnapshot, syncMode: status.mode, syncPhase: status.phase, userId: null, lastError: message };
  }
}

export async function syncPreferencesRemote(preferences: UserPreferences, userId: string | null) {
  const client = getClient();
  if (!client || !userId) return loadPersistenceStatus();

  const syncingStatus = commitPersistenceStatus({
    ...loadPersistenceStatus(),
    mode: "remote-ready",
    phase: "syncing",
    userId,
    lastError: null,
  });

  try {
    const { error } = await client.from("user_preferences").upsert({
      user_id: userId,
      language: preferences.language,
      theme: preferences.theme,
      keyboard_shortcuts: preferences.keyboardShortcuts,
      review_defaults: preferences.reviewDefaults,
    });
    if (error) throw error;
    return commitPersistenceStatus({
      ...syncingStatus,
      phase: "ready",
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
    });
  } catch (error) {
    return commitPersistenceStatus({
      ...syncingStatus,
      mode: "remote-offline",
      phase: "error",
      lastError: getSyncErrorMessage(error),
    });
  }
}

export async function syncProgressRemote(progressEntries: UserItemProgress[], userId: string | null) {
  const client = getClient();
  if (!client || !userId || progressEntries.length === 0) return loadPersistenceStatus();

  const syncingStatus = commitPersistenceStatus({
    ...loadPersistenceStatus(),
    mode: "remote-ready",
    phase: "syncing",
    userId,
    lastError: null,
  });

  try {
    const { error } = await client.from("user_item_progress").upsert(
      progressEntries.map((entry) => ({
        user_id: userId,
        item_id: entry.itemId,
        memory_level: entry.memoryLevel,
        status: entry.status,
        correct_count: entry.correctCount,
        incorrect_count: entry.incorrectCount,
        current_streak: entry.currentStreak,
        completed_review_sessions: entry.completedReviewSessions,
        last_studied_at: entry.lastStudiedAt,
        last_reviewed_at: entry.lastReviewedAt,
        last_status_change_at: entry.lastStatusChangeAt,
        updated_at: entry.updatedAt,
      })),
    );
    if (error) throw error;
    return commitPersistenceStatus({
      ...syncingStatus,
      phase: "ready",
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
    });
  } catch (error) {
    return commitPersistenceStatus({
      ...syncingStatus,
      mode: "remote-offline",
      phase: "error",
      lastError: getSyncErrorMessage(error),
    });
  }
}

export async function syncSessionRemote(session: LearningSession, attempts: LearningAttempt[], userId: string | null) {
  const client = getClient();
  if (!client || !userId) return loadPersistenceStatus();

  const syncingStatus = commitPersistenceStatus({
    ...loadPersistenceStatus(),
    mode: "remote-ready",
    phase: "syncing",
    userId,
    lastError: null,
  });

  try {
    const { error: sessionError } = await client.from("learning_sessions").insert({
      id: session.id,
      user_id: userId,
      mode: session.mode,
      script_type: session.scriptType,
      selection_scope: session.selectionScope,
      question_types: session.questionTypes,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      duration_seconds: session.durationSeconds,
      items_total: session.itemsTotal,
      items_completed: session.itemsCompleted,
      correct_count: session.correctCount,
      incorrect_count: session.incorrectCount,
    });
    if (sessionError) throw sessionError;

    if (attempts.length > 0) {
      const { error: attemptError } = await client.from("learning_attempts").insert(
        attempts.map((attempt) => ({
          id: attempt.id,
          session_id: session.id,
          item_id: attempt.itemId,
          prompt_type: attempt.promptType,
          selected_answer: attempt.selectedAnswer,
          correct_answer: attempt.correctAnswer,
          is_correct: attempt.isCorrect,
          remaining_before: attempt.remainingBefore,
          remaining_after: attempt.remainingAfter,
          answered_at: attempt.answeredAt,
        })),
      );
      if (attemptError) throw attemptError;
    }

    return commitPersistenceStatus({
      ...syncingStatus,
      phase: "ready",
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
    });
  } catch (error) {
    return commitPersistenceStatus({
      ...syncingStatus,
      mode: "remote-offline",
      phase: "error",
      lastError: getSyncErrorMessage(error),
    });
  }
}
