import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AiDataValidationError,
  parseGenerateDataInput,
  parseGenerateDataResponse,
  parseGenerateGuideDataInput,
  parseGenerateGuideDataResponse,
  parseGenerateGuideResponse,
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

  describe("parseGenerateGuideResponse", () => {
    function guideResponse() {
      const request = { ...validRequest, ivValues: ["10", "20", "30", "40"] };
      return {
        ...validResponse(request),
        independentVar: "Water temperature (C)",
        dependentVar: "Dissolving time (s)",
        hypothesis: "Warmer water may reduce dissolving time.",
        procedure: "Measure the time needed at each water temperature.",
      };
    }

    it("accepts a complete invented experiment with four graphable levels", () => {
      const parsed = parseGenerateGuideResponse(guideResponse());
      assert.equal(parsed.independentVar, "Water temperature (C)");
      assert.equal(parsed.rows.length, 4);
      assert.equal(parsed.rows[0].trial4, null);
      assert.equal(parsed.procedure, "Measure the time needed at each water temperature.");
    });

    it("rejects generated variables that do not match the selected experiment", () => {
      const expected = {
        independentVar: "Paper towel layers (layers)",
        dependentVar: "Water absorbed (mL)",
      };
      assert.throws(() => parseGenerateGuideResponse(guideResponse(), expected), AiDataValidationError);
    });

    it("rejects incomplete experiments and malformed or duplicate graph coordinates", () => {
      assert.throws(() => parseGenerateGuideResponse({ ...guideResponse(), procedure: "" }), AiDataValidationError);
      assert.throws(() => parseGenerateGuideResponse({ ...guideResponse(), rows: [] }), AiDataValidationError);
      for (const level of ["", "warm", "Infinity", "20"]) {
        const response = guideResponse();
        response.rows[0].ivValue = level;
        assert.throws(() => parseGenerateGuideResponse(response), AiDataValidationError);
      }
      const response = guideResponse();
      response.rows[0].trial3 = null;
      assert.throws(() => parseGenerateGuideResponse(response), AiDataValidationError);
    });
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

describe("guide data generation from student variables", () => {
  it("accepts optional details and generates graphable levels for the requested trial count", () => {
    const input = parseGenerateGuideDataInput({
      independentVar: "Water temperature (C)",
      dependentVar: "Dissolving time (s)",
      numLevels: 3,
      numTrials: 4,
    });
    const rows = ["10", "20", "30"].map((ivValue) => ({
      ivValue, trial1: 3, trial2: 4, trial3: 5, trial4: 6, trial5: null,
    }));
    const result = parseGenerateGuideDataResponse({ rows, notes: "Fictional values." }, input);
    assert.equal(input.hypothesis, "");
    assert.equal(input.procedure, "");
    assert.equal(result.rows.length, 3);
    assert.equal(result.rows[0].trial4, 6);
    assert.equal(result.rows[0].trial5, null);
  });

  it("rejects missing variables, invalid counts, duplicate levels and missing active trials", () => {
    const input = { ...validRequest, numLevels: 3, numTrials: 3 };
    for (const invalid of [
      { ...input, independentVar: "" },
      { ...input, numLevels: 0 },
      { ...input, numLevels: 6 },
      { ...input, numTrials: 2 },
    ]) {
      assert.throws(() => parseGenerateGuideDataInput(invalid), AiDataValidationError);
    }
    const parsed = parseGenerateGuideDataInput(input);
    const response = validResponse({ ivValues: ["10", "20", "30"] });
    response.rows[1].ivValue = "10";
    assert.throws(() => parseGenerateGuideDataResponse(response, parsed), AiDataValidationError);
    response.rows[1].ivValue = "20";
    response.rows[0].trial2 = null;
    assert.throws(() => parseGenerateGuideDataResponse(response, parsed), AiDataValidationError);
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
