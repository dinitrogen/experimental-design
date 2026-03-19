/**
 * Pure statistics utility functions for experimental design reports.
 * All functions expect arrays of numbers and return numbers.
 */

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mode(values: number[]): number[] {
  if (values.length === 0) return [];
  const freq = new Map<number, number>();
  for (const v of values) {
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  const maxFreq = Math.max(...freq.values());
  if (maxFreq === 1) return []; // no mode
  return [...freq.entries()]
    .filter(([, count]) => count === maxFreq)
    .map(([val]) => val)
    .sort((a, b) => a - b);
}

export function range(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
}

export function stddev(values: number[]): number {
  return Math.sqrt(variance(values));
}

/** Returns Q1 (25th percentile) */
export function q1(values: number[]): number {
  if (values.length < 2) return values[0] ?? 0;
  const sorted = [...values].sort((a, b) => a - b);
  const lowerHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  return median(lowerHalf);
}

/** Returns Q3 (75th percentile) */
export function q3(values: number[]): number {
  if (values.length < 2) return values[0] ?? 0;
  const sorted = [...values].sort((a, b) => a - b);
  const upperHalf = sorted.slice(Math.ceil(sorted.length / 2));
  return median(upperHalf);
}

/** Interquartile Range = Q3 - Q1 */
export function iqr(values: number[]): number {
  return q3(values) - q1(values);
}

export interface LineOfBestFit {
  slope: number;
  intercept: number;
  equation: string;
}

/**
 * Calculates the least-squares line of best fit for (x, y) pairs.
 * Returns slope, intercept, and a formatted equation string.
 */
export function lineOfBestFit(
  xValues: number[],
  yValues: number[]
): LineOfBestFit {
  const n = Math.min(xValues.length, yValues.length);
  if (n < 2) return { slope: 0, intercept: 0, equation: 'y = 0' };

  const xMean = mean(xValues.slice(0, n));
  const yMean = mean(yValues.slice(0, n));

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  const slopeStr = round(slope, 3);
  const interceptStr = round(Math.abs(intercept), 3);
  const sign = intercept >= 0 ? '+' : '−';
  const equation = `y = ${slopeStr}x ${sign} ${interceptStr}`;

  return { slope, intercept, equation };
}

/** Round to a fixed number of decimal places */
export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Compute all statistics for a set of values, returned as a summary object */
export interface StatisticsSummary {
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  variance: number;
  stddev: number;
}

export function computeAll(values: number[]): StatisticsSummary {
  return {
    mean: round(mean(values), 3),
    median: round(median(values), 3),
    mode: mode(values),
    min: Math.min(...(values.length ? values : [0])),
    max: Math.max(...(values.length ? values : [0])),
    range: round(range(values), 3),
    q1: round(q1(values), 3),
    q3: round(q3(values), 3),
    iqr: round(iqr(values), 3),
    variance: round(variance(values), 3),
    stddev: round(stddev(values), 3),
  };
}
