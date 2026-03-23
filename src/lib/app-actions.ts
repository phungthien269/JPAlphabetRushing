import type { LearningAttempt, LearningSession, ProgressSnapshot, UserItemProgress, UserPreferences } from "../types";
import { saveSnapshotLocal, syncPreferencesRemote, syncProgressRemote, syncSessionRemote } from "./storage";
import { useAppStore } from "../store/use-app-store";

export function updateSnapshotPreferences(snapshot: ProgressSnapshot, preferences: UserPreferences) {
  return { ...snapshot, preferences };
}

export function updateSnapshotProgress(snapshot: ProgressSnapshot, nextProgress: UserItemProgress[]) {
  return { ...snapshot, progress: nextProgress };
}

export function appendSessionToSnapshot(snapshot: ProgressSnapshot, session: LearningSession, attempts: LearningAttempt[]) {
  return {
    ...snapshot,
    sessions: [session, ...snapshot.sessions],
    attempts: [...attempts, ...snapshot.attempts].slice(0, 500),
  };
}

export async function persistPreferences(snapshot: ProgressSnapshot, userId: string | null) {
  saveSnapshotLocal(snapshot);
  const status = await syncPreferencesRemote(snapshot.preferences, userId);
  useAppStore.getState().setPersistence(status);
}

export async function persistProgress(snapshot: ProgressSnapshot, userId: string | null) {
  saveSnapshotLocal(snapshot);
  const status = await syncProgressRemote(snapshot.progress, userId);
  useAppStore.getState().setPersistence(status);
}

export async function persistSession(snapshot: ProgressSnapshot, session: LearningSession, attempts: LearningAttempt[], userId: string | null) {
  saveSnapshotLocal(snapshot);
  const progressStatus = await syncProgressRemote(snapshot.progress, userId);
  useAppStore.getState().setPersistence(progressStatus);
  const sessionStatus = await syncSessionRemote(session, attempts, userId);
  useAppStore.getState().setPersistence(sessionStatus);
}
