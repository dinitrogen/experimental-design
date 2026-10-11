import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AI_DAILY_LIMIT,
  AiDailyLimitExceededError,
  AiUsageRecordError,
  nextDailyAiUsage,
} from "../lib/ai-usage.js";

describe("nextDailyAiUsage", () => {
  it("starts a new daily record and increments within the same UTC day", () => {
    const first = nextDailyAiUsage(undefined, "2026-10-11");
    const second = nextDailyAiUsage(first, "2026-10-11");

    assert.deepEqual(first, { date: "2026-10-11", count: 1 });
    assert.deepEqual(second, { date: "2026-10-11", count: 2 });
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
