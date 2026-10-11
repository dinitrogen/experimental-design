import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AiDataValidationError,
  parseGenerateDataInput,
  parseGenerateDataResponse,
} from "../lib/ai-data.js";

const validRequest = {
  independentVar: "Water temperature",
  dependentVar: "Dissolving time",
  controlledVars: ["Water volume", "  "],
  hypothesis: "Warmer water may dissolve the material faster.",
  procedure: "Measure the dissolving time at each temperature.",
  ivValues: ["10 C", "20 C"],
  numTrials: 3,
};

function validResponse(input) {
  return {
    rows: input.ivValues.map((ivValue, index) => ({
      ivValue,
      trial1: 20 + index,
      trial2: 21 + index,
      trial3: 22 + index,
      trial4: null,
      trial5: null,
    })),
    notes: "The material dissolved gradually with small differences between trials.",
  };
}

describe("parseGenerateDataInput", () => {
  it("normalizes valid text and accepts supported trial counts", () => {
    const parsed = parseGenerateDataInput(validRequest);
    assert.equal(parsed.independentVar, "Water temperature");
    assert.deepEqual(parsed.controlledVars, ["Water volume"]);
    assert.deepEqual(parsed.ivValues, ["10 C", "20 C"]);
    assert.equal(parsed.numTrials, 3);
  });

  it("rejects missing or malformed experiment details", () => {
    assert.throws(() => parseGenerateDataInput(null), AiDataValidationError);
    assert.throws(
      () => parseGenerateDataInput({ ...validRequest, ivValues: ["10 C", " "] }),
      AiDataValidationError,
    );
    assert.throws(
      () => parseGenerateDataInput({ ...validRequest, numTrials: 6 }),
      AiDataValidationError,
    );
    assert.throws(
      () => parseGenerateDataInput({ ...validRequest, ivValues: Array(21).fill("level") }),
      AiDataValidationError,
    );
  });
});

describe("parseGenerateDataResponse", () => {
  it("accepts correctly ordered rows and nulls unused trials", () => {
    const input = parseGenerateDataInput(validRequest);
    const parsed = parseGenerateDataResponse(validResponse(input), input);
    assert.equal(parsed.rows.length, 2);
    assert.equal(parsed.rows[0].trial3, 22);
    assert.equal(parsed.rows[0].trial4, null);
    assert.equal(parsed.rows[0].trial5, null);
  });

  it("rejects missing rows, mismatched IV levels, and non-finite trial data", () => {
    const input = parseGenerateDataInput(validRequest);
    assert.throws(
      () => parseGenerateDataResponse({ ...validResponse(input), rows: [] }, input),
      AiDataValidationError,
    );

    const mismatched = validResponse(input);
    mismatched.rows[0].ivValue = "wrong level";
    assert.throws(
      () => parseGenerateDataResponse(mismatched, input),
      AiDataValidationError,
    );

    const nonFinite = validResponse(input);
    nonFinite.rows[0].trial1 = Number.POSITIVE_INFINITY;
    assert.throws(
      () => parseGenerateDataResponse(nonFinite, input),
      AiDataValidationError,
    );
  });

  it("requires active trials and bounded notes", () => {
    const input = parseGenerateDataInput({ ...validRequest, numTrials: 5 });
    const missingTrial = validResponse(input);
    delete missingTrial.rows[0].trial5;
    assert.throws(
      () => parseGenerateDataResponse(missingTrial, input),
      AiDataValidationError,
    );
    assert.throws(
      () => parseGenerateDataResponse({ ...validResponse(input), notes: "x".repeat(601) }, input),
      AiDataValidationError,
    );
  });
});
