import {
  createBlankManualCalcs,
  DataTableEntry,
  GraphData,
  GraphPoint,
  isGraphData,
  ManualCalculations,
} from '../../core/models/submission.model';

export interface ExtraStatistics {
  min: string;
  max: string;
  q1: string;
  q3: string;
}

export interface GuideWorkspace {
  independentVar: string;
  dependentVar: string;
  hypothesis: string;
  procedure: string;
  numTrials: number;
  dataTableIvHeader: string;
  dataTableDvHeader: string;
  dataTable: DataTableEntry[];
  statisticsNotes: string;
  manualCalculations: ManualCalculations;
  graphData: GraphData;
  extraStatistics: ExtraStatistics[];
}

export function blankExtraStatistics(): ExtraStatistics {
  return { min: '', max: '', q1: '', q3: '' };
}

export function createWorkspace(): GuideWorkspace {
  const row = (): DataTableEntry => ({
    ivValue: '', trial1: null, trial2: null, trial3: null, trial4: null, trial5: null, mean: null,
  });
  return {
    independentVar: '',
    dependentVar: '',
    hypothesis: '',
    procedure: '',
    numTrials: 3,
    dataTableIvHeader: '',
    dataTableDvHeader: '',
    dataTable: [row(), row(), row()],
    statisticsNotes: '',
    manualCalculations: createBlankManualCalcs(3, 3),
    graphData: {
      title: '', xAxisLabel: '', yAxisLabel: '', xMin: 0, xMax: 10, yMin: 0, yMax: 10,
      points: [], lobfStart: null, lobfEnd: null, chartType: 'scatter',
    },
    extraStatistics: [blankExtraStatistics(), blankExtraStatistics(), blankExtraStatistics()],
  };
}

export function exampleWorkspace(): GuideWorkspace {
  const workspace = createWorkspace();
  return {
    ...workspace,
    independentVar: 'Ramp height (cm)',
    dependentVar: 'Distance rolled (cm)',
    hypothesis: 'A higher ramp will make the car roll farther.',
    procedure: 'Release the same toy car from rest on the same ramp and measure its roll distance.',
    dataTableIvHeader: 'Ramp height (cm)',
    dataTableDvHeader: 'Distance rolled (cm)',
    dataTable: [
      { ivValue: '10', trial1: 42, trial2: 45, trial3: 48, trial4: null, trial5: null, mean: null },
      { ivValue: '20', trial1: 88, trial2: 92, trial3: 96, trial4: null, trial5: null, mean: null },
      { ivValue: '30', trial1: 130, trial2: 135, trial3: 140, trial4: null, trial5: null, mean: null },
    ],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown, keys: string[]): boolean {
  return isRecord(value) && keys.every((key) => typeof value[key] === 'string');
}

function isPoint(value: unknown): value is GraphPoint {
  return isRecord(value) && typeof value['x'] === 'number' && Number.isFinite(value['x']) &&
    typeof value['y'] === 'number' && Number.isFinite(value['y']);
}

export function isGuideWorkspace(value: unknown): value is GuideWorkspace {
  if (!isRecord(value) || !isStringRecord(value, [
    'independentVar', 'dependentVar', 'hypothesis', 'procedure', 'dataTableIvHeader',
    'dataTableDvHeader', 'statisticsNotes',
  ])) return false;
  const numTrials = value['numTrials'];
  if (typeof numTrials !== 'number' || !Number.isInteger(numTrials) || numTrials < 3 || numTrials > 5) return false;
  const rows = value['dataTable'];
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 5 || !rows.every((row: unknown) =>
    isRecord(row) && typeof row['ivValue'] === 'string' &&
    ['trial1', 'trial2', 'trial3', 'trial4', 'trial5', 'mean'].every((key) =>
      row[key] === null || (typeof row[key] === 'number' && Number.isFinite(row[key])),
    ),
  )) return false;
  const graph = value['graphData'];
  if (!isGraphData(graph) || ![graph.xMin, graph.xMax, graph.yMin, graph.yMax].every(Number.isFinite) ||
      !graph.points.every(isPoint) ||
      !(graph.lobfStart === null || isPoint(graph.lobfStart)) ||
      !(graph.lobfEnd === null || isPoint(graph.lobfEnd)) ||
      !(graph.chartType === undefined || graph.chartType === 'scatter' || graph.chartType === 'bar') ||
      (graph.bars !== undefined && (!Array.isArray(graph.bars) ||
        !graph.bars.every((bar: unknown) => isRecord(bar) &&
          typeof bar['label'] === 'string' && typeof bar['y'] === 'number' && Number.isFinite(bar['y']))))) return false;
  const calcs = value['manualCalculations'];
  if (!isRecord(calcs)) return false;
  const blank = createBlankManualCalcs(0, 0);
  if (!Object.entries(blank).every(([key, initial]) => {
    if (Array.isArray(initial)) return Array.isArray(calcs[key]);
    return typeof calcs[key] === typeof initial;
  })) return false;
  const summaries = calcs['summaryTable'];
  const deviations = calcs['stddevRows'];
  if (typeof calcs['exampleIvIndex'] !== 'number' || !Number.isInteger(calcs['exampleIvIndex']) ||
      calcs['exampleIvIndex'] < 0 || calcs['exampleIvIndex'] >= rows.length) return false;
  if (!Array.isArray(summaries) || !summaries.every((row: unknown) =>
    isStringRecord(row, ['mean', 'median', 'mode', 'range', 'iqr', 'stddev', 'variance']))) return false;
  if (!Array.isArray(deviations) || !deviations.every((row: unknown) =>
    isStringRecord(row, ['value', 'deviation', 'squared']))) return false;
  if (!['meanValues', 'medianSorted'].every((key) =>
    Array.isArray(calcs[key]) && (calcs[key] as unknown[]).every((item) => typeof item === 'string'),
  )) return false;
  const extra = value['extraStatistics'];
  return Array.isArray(extra) && extra.length === rows.length &&
    extra.every((row: unknown) => isStringRecord(row, ['min', 'max', 'q1', 'q3']));
}

export interface DrawnLine {
  slope: number;
  intercept: number;
}

export function drawnLine(start: GraphPoint | null, end: GraphPoint | null): DrawnLine | null {
  if (!start || !end || start.x === end.x) return null;
  const slope = (end.y - start.y) / (end.x - start.x);
  const intercept = start.y - slope * start.x;
  return Number.isFinite(slope) && Number.isFinite(intercept) ? { slope, intercept } : null;
}
