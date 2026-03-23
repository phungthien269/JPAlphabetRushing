export type ScriptType = "hiragana" | "katakana";
export type VariantType =
  | "basic"
  | "dakuten"
  | "handakuten"
  | "youon"
  | "sokuon"
  | "long_vowel"
  | "loanword";
export type ItemStatus = "not_started" | "learning" | "learned" | "review_needed" | "mastered";
export type SessionMode = "study" | "review";
export type PromptType = "char_to_meaning" | "meaning_to_char";
export type LanguageCode = "en" | "vi";
export type ThemeMode = "light" | "dark" | "system";
export type SyncMode = "local-only" | "remote-ready" | "remote-offline";
export type SyncPhase = "booting" | "ready" | "syncing" | "error";

export interface LearningItem {
  id: string;
  scriptType: ScriptType;
  character: string;
  romaji: string;
  meaningEn: string;
  meaningVi: string;
  noteEn: string;
  noteVi: string;
  lessonGroup: string;
  subgroup: VariantType;
  vowelGroup: string;
  sortOrder: number;
  isEnabled: boolean;
}

export interface KeyboardShortcutMap {
  flip: string;
  next: string;
  back: string;
  remembered: string;
  notRemembered: string;
}

export interface UserPreferences {
  language: LanguageCode;
  theme: ThemeMode;
  keyboardShortcuts: KeyboardShortcutMap;
  reviewDefaults: {
    promptTypes: PromptType[];
  };
}

export interface UserItemProgress {
  userId?: string;
  itemId: string;
  memoryLevel: number;
  status: ItemStatus;
  correctCount: number;
  incorrectCount: number;
  currentStreak: number;
  completedReviewSessions: number;
  lastStudiedAt: string | null;
  lastReviewedAt: string | null;
  lastStatusChangeAt: string | null;
  updatedAt: string;
}

export interface LearningAttempt {
  id: string;
  sessionId: string;
  itemId: string;
  promptType: PromptType;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  remainingBefore: number | null;
  remainingAfter: number | null;
  answeredAt: string;
}

export interface LearningSession {
  id: string;
  userId?: string;
  mode: SessionMode;
  scriptType: ScriptType;
  selectionScope: string[];
  questionTypes: PromptType[];
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  itemsTotal: number;
  itemsCompleted: number;
  correctCount: number;
  incorrectCount: number;
}

export interface ProgressSnapshot {
  preferences: UserPreferences;
  progress: UserItemProgress[];
  sessions: LearningSession[];
  attempts: LearningAttempt[];
}

export interface ReviewStateItem {
  itemId: string;
  remaining: number;
}

export interface ReviewSessionState {
  items: Record<string, ReviewStateItem>;
  roundQueue: string[];
  questionTypes: PromptType[];
}

export interface ReviewQuestion {
  itemId: string;
  promptType: PromptType;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export interface AppBootstrap {
  snapshot: ProgressSnapshot;
  syncMode: SyncMode;
  syncPhase: SyncPhase;
  userId: string | null;
  lastError: string | null;
}

export interface PersistenceStatus {
  mode: SyncMode;
  phase: SyncPhase;
  userId: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
}
