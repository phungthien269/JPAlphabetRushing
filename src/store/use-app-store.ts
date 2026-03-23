import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersistenceStatus, ProgressSnapshot, ScriptType } from "../types";

const defaultSnapshot: ProgressSnapshot = {
  preferences: {
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
  },
  progress: [],
  sessions: [],
  attempts: [],
};

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface AppState {
  hydrated: boolean;
  snapshot: ProgressSnapshot;
  persistence: PersistenceStatus;
  selectedScript: ScriptType;
  selectedIds: string[];
  currentMode: "study" | "review";
  installPromptEvent: InstallPromptEvent | null;
  setHydrated: (value: boolean) => void;
  setSnapshot: (snapshot: ProgressSnapshot) => void;
  patchSnapshot: (updater: (snapshot: ProgressSnapshot) => ProgressSnapshot) => void;
  setPersistence: (persistence: PersistenceStatus) => void;
  setSelectedScript: (script: ScriptType) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectedId: (id: string) => void;
  clearSelection: () => void;
  setCurrentMode: (mode: "study" | "review") => void;
  setInstallPromptEvent: (event: InstallPromptEvent | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      snapshot: defaultSnapshot,
      persistence: {
        mode: "local-only",
        phase: "booting",
        userId: null,
        lastSyncedAt: null,
        lastError: null,
      },
      selectedScript: "hiragana",
      selectedIds: [],
      currentMode: "study",
      installPromptEvent: null,
      setHydrated: (hydrated) => set({ hydrated }),
      setSnapshot: (snapshot) => set({ snapshot }),
      patchSnapshot: (updater) => set((state) => ({ snapshot: updater(state.snapshot) })),
      setPersistence: (persistence) => set({ persistence }),
      setSelectedScript: (selectedScript) => set({ selectedScript }),
      setSelectedIds: (selectedIds) => set({ selectedIds }),
      toggleSelectedId: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((entry) => entry !== id)
            : [...state.selectedIds, id],
        })),
      clearSelection: () => set({ selectedIds: [] }),
      setCurrentMode: (currentMode) => set({ currentMode }),
      setInstallPromptEvent: (installPromptEvent) => set({ installPromptEvent }),
    }),
    {
      name: "kana-flow.ui.v1",
      partialize: (state) => ({
        selectedScript: state.selectedScript,
        selectedIds: state.selectedIds,
        currentMode: state.currentMode,
      }),
    },
  ),
);
