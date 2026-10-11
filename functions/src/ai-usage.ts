export const AI_DAILY_LIMIT = 10;

export interface DailyAiUsageRecord {
  date: string;
  count: number;
}

export class AiDailyLimitExceededError extends Error {
  constructor() {
    super("Daily AI generation limit reached.");
    this.name = "AiDailyLimitExceededError";
  }
}

export class AiUsageRecordError extends Error {
  constructor() {
    super("Stored AI usage record is invalid.");
    this.name = "AiUsageRecordError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function nextDailyAiUsage(
  current: unknown,
  utcDate: string,
): DailyAiUsageRecord {
  if (current === undefined) {
    return { date: utcDate, count: 1 };
  }
  if (!isRecord(current) || typeof current["date"] !== "string") {
    throw new AiUsageRecordError();
  }
  if (current["date"] !== utcDate) {
    return { date: utcDate, count: 1 };
  }

  const count = current["count"];
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
    throw new AiUsageRecordError();
  }
  if (count >= AI_DAILY_LIMIT) {
    throw new AiDailyLimitExceededError();
  }
  return { date: utcDate, count: count + 1 };
}
