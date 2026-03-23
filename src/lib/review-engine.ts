import type { LearningItem, PromptType, ReviewQuestion, ReviewSessionState } from "../types";
import { shuffle } from "./utils";

export function createReviewSession(itemIds: string[], questionTypes: PromptType[]): ReviewSessionState {
  return {
    items: Object.fromEntries(itemIds.map((itemId) => [itemId, { itemId, remaining: 5 }])),
    roundQueue: shuffle(itemIds),
    questionTypes,
  };
}

export function getActiveItems(state: ReviewSessionState) {
  return Object.values(state.items)
    .filter((entry) => entry.remaining > 0)
    .map((entry) => entry.itemId);
}

export function buildRoundQueue(state: ReviewSessionState) {
  if (state.roundQueue.length > 0) return state;
  const activeItems = getActiveItems(state);
  if (activeItems.length === 0) return state;
  return { ...state, roundQueue: shuffle(activeItems) };
}

export function getNextItemId(state: ReviewSessionState) {
  const nextState = buildRoundQueue(state);
  const [itemId, ...rest] = nextState.roundQueue;
  return {
    state: {
      ...nextState,
      roundQueue: rest,
    },
    itemId: itemId ?? null,
  };
}

export function applyAnswer(state: ReviewSessionState, itemId: string, correct: boolean) {
  const entry = state.items[itemId];
  if (!entry) return state;
  return {
    ...state,
    items: {
      ...state.items,
      [itemId]: {
        ...entry,
        remaining: Math.max(0, entry.remaining + (correct ? -1 : 3)),
      },
    },
  };
}

export function isSessionComplete(state: ReviewSessionState) {
  return getActiveItems(state).length === 0;
}

function buildOptionLabel(item: LearningItem, promptType: PromptType, language: "en" | "vi") {
  if (promptType === "char_to_meaning") {
    return `${item.romaji} · ${language === "vi" ? item.meaningVi : item.meaningEn}`;
  }
  return item.character;
}

function pickPromptType(questionTypes: PromptType[]) {
  return shuffle(questionTypes)[0] ?? "char_to_meaning";
}

export function buildReviewQuestion(
  itemId: string,
  selectedItems: LearningItem[],
  corpus: LearningItem[],
  questionTypes: PromptType[],
  language: "en" | "vi",
): ReviewQuestion {
  const item = selectedItems.find((entry) => entry.id === itemId);
  if (!item) throw new Error(`Missing learning item for ${itemId}`);
  const promptType = pickPromptType(questionTypes);
  const focusedPool = corpus.filter(
    (candidate) =>
      candidate.id !== item.id &&
      candidate.scriptType === item.scriptType &&
      (candidate.subgroup === item.subgroup || candidate.lessonGroup === item.lessonGroup),
  );
  const fallbackPool = corpus.filter((candidate) => candidate.id !== item.id && candidate.scriptType === item.scriptType);
  const distractors = shuffle([...focusedPool, ...fallbackPool]).filter(
    (candidate, index, array) => array.findIndex((entry) => entry.id === candidate.id) === index,
  );
  const correctAnswer = buildOptionLabel(item, promptType, language);
  return {
    itemId,
    promptType,
    prompt: promptType === "char_to_meaning" ? item.character : `${item.romaji} · ${language === "vi" ? item.noteVi : item.noteEn}`,
    options: shuffle([
      correctAnswer,
      ...distractors.slice(0, 3).map((candidate) => buildOptionLabel(candidate, promptType, language)),
    ]),
    correctAnswer,
  };
}
