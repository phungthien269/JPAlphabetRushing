import { describe, expect, it } from "vitest";
import { applyReviewFeedback, applyStudyFeedback, createDefaultProgress, deriveStatus, markCompletedReviewSession } from "./progress";

describe("progress logic", () => {
  it("keeps untouched items as not_started", () => {
    const progress = createDefaultProgress("item-a");
    expect(deriveStatus(progress)).toBe("not_started");
  });

  it("moves into learning after first study feedback", () => {
    const progress = applyStudyFeedback(createDefaultProgress("item-a"), true);
    expect(progress.status).toBe("learning");
  });

  it("moves into learned at memory level 50", () => {
    let progress = createDefaultProgress("item-a");
    for (let step = 0; step < 17; step += 1) {
      progress = applyStudyFeedback(progress, true);
    }
    expect(progress.status).toBe("learned");
  });

  it("moves into mastered after enough memory and completed review sessions", () => {
    let progress = createDefaultProgress("item-a");
    for (let step = 0; step < 20; step += 1) {
      progress = applyReviewFeedback(progress, true);
    }
    progress = markCompletedReviewSession(progress);
    progress = markCompletedReviewSession(progress);
    progress = markCompletedReviewSession(progress);
    expect(progress.status).toBe("mastered");
  });

  it("drops learned items into review_needed when memory falls below 50", () => {
    let progress = createDefaultProgress("item-a");
    for (let step = 0; step < 17; step += 1) {
      progress = applyStudyFeedback(progress, true);
    }
    progress = applyReviewFeedback(progress, false);
    progress = applyReviewFeedback(progress, false);
    progress = applyReviewFeedback(progress, false);
    expect(progress.status).toBe("review_needed");
  });
});
