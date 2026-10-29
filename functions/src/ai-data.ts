export interface GenerateDataInput {
  independentVar: string;
  dependentVar: string;
  controlledVars: string[];
  hypothesis: string;
  procedure: string;
  ivValues: string[];
  numTrials: number;
}

export interface GenerateDataResponse {
  rows: {
    ivValue: string;
    trial1: number;
    trial2: number;
    trial3: number;
    trial4: number | null;
    trial5: number | null;
  }[];
  notes: string;
}

export interface GenerateGuideResponse extends GenerateDataResponse {
  independentVar: string;
  dependentVar: string;
  hypothesis: string;
  procedure: string;
}

export interface GenerateGuideDataInput extends Omit<GenerateDataInput, "ivValues"> {
  numLevels: number;
}

export class AiDataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiDataValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readActiveTrial(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || Math.abs(value) > 1_000_000_000_000
  ) {
    throw new AiDataValidationError("Generated trial data must be finite numbers.");
  }
  return value;
}

function readText(
  data: Record<string, unknown>,
  key: string,
  maximumLength: number,
  required = false,
): string {
  const value = data[key];
  if (value === undefined && !required) {
    return "";
  }
  if (typeof value !== "string") {
    throw new AiDataValidationError(`Invalid ${key}.`);
  }

  const text = value.trim();
  if (text.length > maximumLength || (required && text.length === 0)) {
    throw new AiDataValidationError(`Invalid ${key}.`);
  }
  return text;
}

export function parseGenerateDataInput(data: unknown): GenerateDataInput {
  if (!isRecord(data)) {
    throw new AiDataValidationError("Expected an experiment data request.");
  }

  const independentVar = readText(data, "independentVar", 200, true);
  const dependentVar = readText(data, "dependentVar", 200, true);
  const hypothesis = readText(data, "hypothesis", 2000);
  const procedure = readText(data, "procedure", 4000);
  const controlledVarsValue = data["controlledVars"] ?? [];
  if (!Array.isArray(controlledVarsValue) || controlledVarsValue.length > 20) {
    throw new AiDataValidationError("Invalid controlled variables.");
  }
  const controlledVars = controlledVarsValue.map((value) => {
    if (typeof value !== "string" || value.trim().length > 200) {
      throw new AiDataValidationError("Invalid controlled variables.");
    }
    return value.trim();
  }).filter(Boolean);

  const ivValuesValue = data["ivValues"];
  if (
    !Array.isArray(ivValuesValue)
    || ivValuesValue.length === 0
    || ivValuesValue.length > 20
  ) {
    throw new AiDataValidationError("Provide between 1 and 20 IV levels.");
  }
  const ivValues = ivValuesValue.map((value) => {
    if (
      typeof value !== "string"
      || value.trim().length === 0
      || value.trim().length > 120
    ) {
      throw new AiDataValidationError("Each IV level must contain 1 to 120 characters.");
    }
    return value.trim();
  });

  const numTrials = data["numTrials"];
  if (
    typeof numTrials !== "number"
    || !Number.isInteger(numTrials)
    || numTrials < 3
    || numTrials > 5
  ) {
    throw new AiDataValidationError("Trial count must be an integer from 3 to 5.");
  }

  return {
    independentVar,
    dependentVar,
    controlledVars,
    hypothesis,
    procedure,
    ivValues,
    numTrials,
  };
}

export function parseGenerateGuideDataInput(data: unknown): GenerateGuideDataInput {
  if (!isRecord(data) || typeof data["numLevels"] !== "number" ||
      !Number.isInteger(data["numLevels"]) || data["numLevels"] < 1 || data["numLevels"] > 5) {
    throw new AiDataValidationError("Provide between 1 and 5 IV levels.");
  }
  const { ivValues: _, ...input } = parseGenerateDataInput({
    ...data,
    ivValues: Array.from({ length: data["numLevels"] }, (_, index) => String(index)),
  });
  return { ...input, numLevels: data["numLevels"] };
}

export function parseGenerateDataResponse(
  response: unknown,
  input: GenerateDataInput,
): GenerateDataResponse {
  if (
    !isRecord(response)
    || !Array.isArray(response["rows"])
    || response["rows"].length !== input.ivValues.length
    || typeof response["notes"] !== "string"
  ) {
    throw new AiDataValidationError("Invalid generated data.");
  }

  const rows = response["rows"].map((value, index) => {
    if (
      !isRecord(value)
      || typeof value["ivValue"] !== "string"
      || value["ivValue"].trim() !== input.ivValues[index]
    ) {
      throw new AiDataValidationError("Generated IV levels did not match the request.");
    }

    return {
      ivValue: input.ivValues[index],
      trial1: readActiveTrial(value, "trial1"),
      trial2: readActiveTrial(value, "trial2"),
      trial3: readActiveTrial(value, "trial3"),
      trial4: input.numTrials >= 4 ? readActiveTrial(value, "trial4") : null,
      trial5: input.numTrials >= 5 ? readActiveTrial(value, "trial5") : null,
    };
  });

  const notes = response["notes"].trim();
  if (notes.length === 0 || notes.length > 600) {
    throw new AiDataValidationError("Generated notes must contain 1 to 600 characters.");
  }

  return { rows, notes };
}

function generatedIvValues(response: unknown, numLevels: number): string[] {
  if (!isRecord(response) || !Array.isArray(response["rows"]) || response["rows"].length !== numLevels) {
    throw new AiDataValidationError("Generated data has an unexpected number of levels.");
  }
  const ivValues = response["rows"].map((row: unknown) => {
    if (!isRecord(row) || typeof row["ivValue"] !== "string" || !row["ivValue"].trim()) {
      throw new AiDataValidationError("Generated IV levels must be numbers.");
    }
    const level = Number(row["ivValue"]);
    if (!Number.isFinite(level) || Math.abs(level) > 1_000_000_000_000) {
      throw new AiDataValidationError("Generated IV levels must be finite numbers.");
    }
    return row["ivValue"].trim();
  });
  if (new Set(ivValues.map(Number)).size !== ivValues.length) {
    throw new AiDataValidationError("Generated IV levels must be distinct.");
  }
  return ivValues;
}

export function parseGenerateGuideDataResponse(
  response: unknown,
  input: GenerateGuideDataInput,
): GenerateDataResponse {
  const ivValues = generatedIvValues(response, input.numLevels);
  return parseGenerateDataResponse(response, { ...input, ivValues });
}

export function parseGenerateGuideResponse(
  response: unknown,
  expected?: { independentVar: string; dependentVar: string },
): GenerateGuideResponse {
  if (!isRecord(response)) throw new AiDataValidationError("Invalid generated experiment.");
  const independentVar = readText(response, "independentVar", 200, true);
  const dependentVar = readText(response, "dependentVar", 200, true);
  if (expected && (independentVar !== expected.independentVar || dependentVar !== expected.dependentVar)) {
    throw new AiDataValidationError("Generated variables did not match the requested experiment.");
  }
  const hypothesis = readText(response, "hypothesis", 2000, true);
  const procedure = readText(response, "procedure", 4000, true);
  const ivValues = generatedIvValues(response, 4);
  const input = parseGenerateDataInput({
    independentVar, dependentVar, hypothesis, procedure, controlledVars: [], ivValues, numTrials: 3,
  });
  return {
    independentVar, dependentVar, hypothesis, procedure,
    ...parseGenerateDataResponse(response, input),
  };
}
