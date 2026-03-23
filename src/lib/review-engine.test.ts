import { describe, expect, it } from "vitest";
import { buildReviewQuestion, createReviewSession, getNextItemId, applyAnswer, isSessionComplete } from "./review-engine";
import { learningItems } from "./kana-data";

describe("review engine", () => {
  it("starts every item at remaining 5", () => {
    const state = createReviewSession(["hiragana_a_a", "hiragana_ka_ka"], ["char_to_meaning"]);
    expect(state.items.hiragana_a_a?.remaining).toBe(5);
    expect(state.items.hiragana_ka_ka?.remaining).toBe(5);
  });

  it("decrements on correct and increments by 3 on wrong", () => {
    let state = createReviewSession(["hiragana_a_a"], ["char_to_meaning"]);
    state = applyAnswer(state, "hiragana_a_a", true);
    expect(state.items.hiragana_a_a?.remaining).toBe(4);
    state = applyAnswer(state, "hiragana_a_a", false);
    expect(state.items.hiragana_a_a?.remaining).toBe(7);
  });

  it("rebuilds the queue from active items only", () => {
    const session = createReviewSession(["hiragana_a_a", "hiragana_ka_ka"], ["char_to_meaning"]);
    const firstDraw = getNextItemId(session);
    const secondDraw = getNextItemId(firstDraw.state);
    const rebuilt = getNextItemId(secondDraw.state);
    expect(firstDraw.itemId).not.toBeNull();
    expect(secondDraw.itemId).not.toBeNull();
    expect(rebuilt.itemId).not.toBeNull();
  });

  it("marks completion only when all remaining values hit zero", () => {
    let state = createReviewSession(["hiragana_a_a"], ["char_to_meaning"]);
    expect(isSessionComplete(state)).toBe(false);
    for (let step = 0; step < 5; step += 1) {
      state = applyAnswer(state, "hiragana_a_a", true);
    }
    expect(isSessionComplete(state)).toBe(true);
  });

  it("builds 4-option questions", () => {
    const selected = learningItems.filter((item) => item.scriptType === "hiragana").slice(0, 5);
    const [firstItem] = selected;
    expect(firstItem).toBeDefined();
    const question = buildReviewQuestion(firstItem.id, selected, learningItems, ["char_to_meaning"], "en");
    expect(question.options).toHaveLength(4);
    expect(question.options).toContain(question.correctAnswer);
  });
});
