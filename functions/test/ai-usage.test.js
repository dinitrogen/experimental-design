import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AI_DAILY_LIMIT,
  AiDailyLimitExceededError,
  AiUsageRecordError,
  nextAiReservation,
  nextDailyAiUsage,
} from "../lib/ai-usage.js";
import { GUIDE_THEMES, selectGuideTheme } from "../lib/ai-guide-themes.js";

describe("nextDailyAiUsage", () => {
  it("starts a new daily record and increments within the same UTC day", () => {
    const first = nextDailyAiUsage(undefined, "2026-10-11");
    const second = nextDailyAiUsage(first, "2026-10-11");

    assert.deepEqual(first, { date: "2026-10-11", count: 1 });
    assert.deepEqual(second, { date: "2026-10-11", count: 2 });
  });

  describe("guide experiment selection", () => {
    it("offers distinct experiment variables and excludes the previous theme", () => {
      assert.ok(GUIDE_THEMES.length >= AI_DAILY_LIMIT);
      assert.equal(new Set(GUIDE_THEMES.map((theme) => theme.id)).size, GUIDE_THEMES.length);
      assert.equal(new Set(GUIDE_THEMES.map((theme) => theme.independentVar)).size, GUIDE_THEMES.length);
      for (const previous of GUIDE_THEMES) {
        for (let index = 0; index < GUIDE_THEMES.length - 1; index++) {
          const selected = selectGuideTheme(previous.id, () => index);
          assert.notEqual(selected.id, previous.id);
        }
      }
    });

    it("preserves the last theme across unrelated generations and UTC days", () => {
      const first = nextAiReservation(undefined, "2026-10-11", true, () => 0);
      const practice = nextAiReservation(first.usage, "2026-10-11", false);
      assert.equal(practice.theme, undefined);
      assert.equal(practice.usage.lastGuideTheme, first.theme.id);
      const nextDay = nextAiReservation(practice.usage, "2026-10-12", true, () => 0);
      assert.notEqual(nextDay.theme.id, first.theme.id);
      assert.equal(nextDay.usage.count, 1);
      assert.equal(nextDay.usage.lastGuideTheme, nextDay.theme.id);
    });

    it("rejects invalid stored theme identifiers", () => {
      assert.throws(
        () => nextAiReservation({ date: "2026-10-11", count: 1, lastGuideTheme: "invalid" }, "2026-10-11", true),
        AiUsageRecordError,
      );
    });
  });

  it("resets the count when the UTC day changes", () => {
    const next = nextDailyAiUsage(
      { date: "2026-10-10", count: AI_DAILY_LIMIT },
      "2026-10-11",
    );

    assert.deepEqual(next, { date: "2026-10-11", count: 1 });
  });

  it("rejects requests beyond the daily limit", () => {
    assert.throws(
      () => nextDailyAiUsage(
        { date: "2026-10-11", count: AI_DAILY_LIMIT },
        "2026-10-11",
      ),
      AiDailyLimitExceededError,
    );
  });

  it("fails closed when the current usage record is malformed", () => {
    assert.throws(
      () => nextDailyAiUsage({ date: "2026-10-11", count: "10" }, "2026-10-11"),
      AiUsageRecordError,
    );
  });
});
