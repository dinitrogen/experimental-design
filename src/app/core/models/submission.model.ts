import { Timestamp } from '@angular/fire/firestore';

export interface ReportSubmission {
  id?: string;
  studentUid: string;
  studentDisplayName?: string;
  practiceEventId: string;
  status: 'draft' | 'submitted' | 'reviewed';

  // Section data
  problemStatement: string;
  hypothesis: string;
  independentVar: string;
  ivOperationalDef: string;
  dependentVar: string;
  dvOperationalDef: string;
  ivLevels: string[];
  controlledVars: string[];
  materials: string;
  procedure: string;
  numTrials: number;
  dataTableIvHeader: string;
  dataTableDvHeader: string;
  dataTable: DataTableEntry[];
  qualitativeObsSetup: string;
  qualitativeObsProcedure: string;
  qualitativeObsResults: string;
  graphUrl: string;
  graphData?: GraphData;
  statisticsNotes: string;
  errors: ExperimentalError[];
  cerTrend: CerSection;
  cerVariation: CerSection;
  cerOutliers: CerSection;
  cerConclusion: CerSection;
  cerConclusionHypothesisRestated: string;
  improvements: string;
  applications: string;
  futureExperiments: string;
  manualCalculations: ManualCalculations;
  timerRemaining?: number;

  // Meta
  sectionScores: SectionScores;
  coachFeedback: string;
  score: number | null;
  isStateNational?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt: Timestamp | null;
  reviewedAt: Timestamp | null;
}

export interface DataTableEntry {
  ivValue: string;
  trial1: number | null;
  trial2: number | null;
  trial3: number | null;
  trial4: number | null;
  trial5: number | null;
  mean: number | null;
}

export interface ExperimentalError {
  type: 'random' | 'procedural' | 'systematic';
  description: string;
  specificError: string;
  resultImpact: string;
}

export interface CerSection {
  claim: string;
  evidence: string;
  reasoning: string;
}

export interface GraphPoint {
  x: number;
  y: number;
}

export interface BarPoint {
  label: string;
  y: number;
}

export interface GraphData {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  points: GraphPoint[];
  bars?: BarPoint[];
  lobfStart: GraphPoint | null;
  lobfEnd: GraphPoint | null;
  chartType?: 'scatter' | 'bar';
}

export interface SectionScores {
  problemStatement: number | null;
  hypothesis: number | null;
  variables: number | null;
  materials: number | null;
  procedureSetup: number | null;
  qualitativeObs: number | null;
  dataTable: number | null;
  graph: number | null;
  statistics: number | null;
  experimentalErrors: number | null;
  cer: number | null;
  conclusion: number | null;
  applicationsRecommendations: number | null;
}

export function createBlankSectionScores(): SectionScores {
  return {
    problemStatement: null,
    hypothesis: null,
    variables: null,
    materials: null,
    procedureSetup: null,
    qualitativeObs: null,
    dataTable: null,
    graph: null,
    statistics: null,
    experimentalErrors: null,
    cer: null,
    conclusion: null,
    applicationsRecommendations: null,
  };
}

export interface ManualCalculations {
  /** Per-IV-level summary table: one row per IV level */
  summaryTable: StatsSummaryRow[];

  /** Example calculations (for one IV level) */
  exampleIvIndex: number;

  // Mean example: sum trial values / count
  meanValues: string[];
  meanCount: string;
  meanResult: string;

  // Median example: sorted trial values + result
  medianSorted: string[];
  medianResult: string;

  // Mode
  modeResult: string;

  // Range
  rangeMax: string;
  rangeMin: string;
  rangeResult: string;

  // Standard Deviation
  stddevMean: string;
  stddevRows: StdDevWorkRow[];
  stddevSum: string;
  stddevDivisor: string;
  stddevVariance: string;
  stddevResult: string;

  // Quartiles & IQR
  q1Result: string;
  q3Result: string;
  iqrQ3: string;
  iqrQ1: string;
  iqrResult: string;

  // Line of Best Fit (two-point rise/run)
  lobfX1: string;
  lobfY1: string;
  lobfX2: string;
  lobfY2: string;
  lobfSlope: string;
  lobfIntercept: string;
  lobfIntY: string;
  lobfIntM: string;
  lobfIntX: string;
}

export interface StatsSummaryRow {
  mean: string;
  median: string;
  mode: string;
  range: string;
  iqr: string;
  stddev: string;
  variance: string;
}

export interface StdDevWorkRow {
  value: string;
  deviation: string;
  squared: string;
}

export function createBlankManualCalcs(numRows: number, numTrials = 5): ManualCalculations {
  const blankSummaryRow = (): StatsSummaryRow => ({
    mean: '', median: '', mode: '', range: '', iqr: '', stddev: '', variance: '',
  });
  return {
    summaryTable: Array.from({ length: numRows }, blankSummaryRow),
    exampleIvIndex: 0,
    meanValues: Array(numTrials).fill(''),
    meanCount: '',
    meanResult: '',
    medianSorted: Array(numTrials).fill(''),
    medianResult: '',
    modeResult: '',
    rangeMax: '',
    rangeMin: '',
    rangeResult: '',
    stddevMean: '',
    stddevRows: Array.from({ length: numTrials }, () => ({ value: '', deviation: '', squared: '' })),
    stddevSum: '',
    stddevDivisor: '',
    stddevVariance: '',
    stddevResult: '',
    q1Result: '',
    q3Result: '',
    iqrQ3: '',
    iqrQ1: '',
    iqrResult: '',
    lobfX1: '',
    lobfY1: '',
    lobfX2: '',
    lobfY2: '',
    lobfSlope: '',
    lobfIntercept: '',
    lobfIntY: '',
    lobfIntM: '',
    lobfIntX: '',
  };
}

/** Returns a blank submission for a new report */
export function createBlankSubmission(
  studentUid: string,
  practiceEventId: string,
  studentDisplayName = ''
): Omit<ReportSubmission, 'id'> {
  const now = Timestamp.now();
  return {
    studentUid,
    studentDisplayName,
    practiceEventId,
    status: 'draft',
    problemStatement: '',
    hypothesis: '',
    independentVar: '',
    ivOperationalDef: '',
    dependentVar: '',
    dvOperationalDef: '',
    ivLevels: ['', '', ''],
    controlledVars: ['', '', ''],
    materials: '',
    procedure: '',
    numTrials: 5,
    dataTableIvHeader: '',
    dataTableDvHeader: '',
    dataTable: [
      { ivValue: '', trial1: null, trial2: null, trial3: null, trial4: null, trial5: null, mean: null },
      { ivValue: '', trial1: null, trial2: null, trial3: null, trial4: null, trial5: null, mean: null },
      { ivValue: '', trial1: null, trial2: null, trial3: null, trial4: null, trial5: null, mean: null },
      { ivValue: '', trial1: null, trial2: null, trial3: null, trial4: null, trial5: null, mean: null },
    ],
    qualitativeObsSetup: '',
    qualitativeObsProcedure: '',
    qualitativeObsResults: '',
    graphUrl: '',
    statisticsNotes: '',
    errors: [
      { type: 'random', description: '', specificError: '', resultImpact: '' },
      { type: 'procedural', description: '', specificError: '', resultImpact: '' },
    ],
    cerTrend: { claim: '', evidence: '', reasoning: '' },
    cerVariation: { claim: '', evidence: '', reasoning: '' },
    cerOutliers: { claim: '', evidence: '', reasoning: '' },
    cerConclusion: { claim: '', evidence: '', reasoning: '' },
    cerConclusionHypothesisRestated: '',
    improvements: '',
    applications: '',
    futureExperiments: '',
    manualCalculations: createBlankManualCalcs(4),
    sectionScores: createBlankSectionScores(),
    coachFeedback: '',
    score: null,
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    reviewedAt: null,
  };
}
