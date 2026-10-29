import { Timestamp } from '@angular/fire/firestore';
import { GraphData } from './submission.model';

export type PromptType = 'text' | 'number' | 'short-answer' | 'table' | 'graph';

export interface TaskGraphConfig {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  maxPoints: number;
}

export interface TaskPrompt {
  /** Label shown above the input */
  label: string;
  type: PromptType;
  /** Optional small text shown above the input as guidance */
  subLabel?: string;
  /** If set, renders a divider (except for the first prompt) and a section heading before this prompt */
  sectionHeader?: string;
  /** Short label for the input field (mat-label). Falls back to `label` if not set. */
  inputLabel?: string;
  /** If true, render side-by-side with the previous prompt in the same card */
  inline?: boolean;
  /** For 'number': expected answer for auto-check */
  expectedAnswer?: number;
  /** For 'number': acceptable tolerance (default 0.01) */
  tolerance?: number;
  /** For 'table': column headers */
  columns?: string[];
  /** For 'table': let students edit the column headers */
  editableColumnHeaders?: boolean;
  /** For 'table': expected column headers, shown to coaches during review */
  expectedColumns?: string[];
  /** For 'table': number of data rows */
  rows?: number;
  /** For 'text': visible textarea rows */
  textRows?: number;
  /** For 'table': expected cell values (row-major) for auto-check. null = no check for that cell */
  expectedTableValues?: (string | null)[][];
  /** For 'table': pre-filled read-only cells (row-major). null = editable blank */
  prefilled?: (string | null)[][];
  /** For 'graph': fixed axis bounds and maximum number of plotted data points */
  graphConfig?: TaskGraphConfig;
}

export interface TaskDefinition {
  id: string;
  title: string;
  /** Archived tasks remain available for existing assignments and submissions. */
  archived?: boolean;
  /** Relative path to the markdown prompt file in public/ (legacy task format) */
  promptFile?: string;
  /** Ordered list of prompts/inputs the student must complete */
  prompts: TaskPrompt[];
  /** Markdown instructions shown beside their related prompts in newer tasks */
  sectionInstructions?: Record<string, string>;
  dueDate: string; // ISO date string, e.g. '2026-03-20'
  createdAt: string; // ISO date string
}

export interface PromptGrade {
  correct: boolean;
  comment?: string;
}

export interface TaskSubmission {
  id?: string;
  taskId: string;
  studentUid: string;
  studentDisplayName?: string;
  status: 'not-started' | 'in-progress' | 'submitted' | 'reviewed';
  /** One entry per prompt. Legacy tables are JSON matrices; editable-header tables and graphs are JSON objects. */
  responses: string[];
  coachFeedback: string;
  /** Per-prompt grades set by the coach during review. Optional for backwards compatibility. */
  promptGrades?: PromptGrade[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt: Timestamp | null;
  reviewedAt: Timestamp | null;
}

export function createInitialTaskResponse(prompt: TaskPrompt): string {
  if (prompt.type === 'table') {
    const rows = prompt.rows ?? 1;
    const cols = prompt.columns?.length ?? 1;
    const tableRows = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => prompt.prefilled?.[r]?.[c] ?? ''),
    );
    if (prompt.editableColumnHeaders) {
      return JSON.stringify({
        headers: Array.from({ length: cols }, () => ''),
        rows: tableRows,
      });
    }
    return JSON.stringify(tableRows);
  }
  if (prompt.type === 'graph') {
    const config = prompt.graphConfig;
    const initialGraph: GraphData = {
      title: '',
      xAxisLabel: '',
      yAxisLabel: '',
      xMin: config?.xMin ?? 0,
      xMax: config?.xMax ?? 10,
      yMin: config?.yMin ?? 0,
      yMax: config?.yMax ?? 10,
      points: [],
      lobfStart: null,
      lobfEnd: null,
      chartType: 'scatter',
    };
    return JSON.stringify(initialGraph);
  }
  return '';
}

export interface TaskTableResponse {
  headers: string[];
  rows: string[][];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isStringMatrix(value: unknown): value is string[][] {
  return Array.isArray(value) && value.every(isStringArray);
}

function normalizeTaskTableResponse(
  headers: string[],
  rows: string[][],
  prompt: TaskPrompt,
): TaskTableResponse {
  const columns = prompt.columns ?? [];
  const rowCount = prompt.rows ?? 1;
  const columnCount = columns.length || 1;
  return {
    headers: Array.from({ length: columnCount }, (_, col) => headers[col] ?? columns[col] ?? ''),
    rows: Array.from({ length: rowCount }, (_, row) =>
      Array.from(
        { length: columnCount },
        (_, col) => rows[row]?.[col] ?? prompt.prefilled?.[row]?.[col] ?? '',
      ),
    ),
  };
}

function isLegacyHeaderRow(row: string[], prompt: TaskPrompt): boolean {
  const expectedColumns = prompt.expectedColumns;
  if (
    expectedColumns?.length === row.length &&
    row.every(
      (cell, index) =>
        cell.trim().toLowerCase() === expectedColumns[index]?.trim().toLowerCase(),
    )
  ) {
    return true;
  }
  return row.some((cell) => cell.trim() !== '' && Number.isNaN(Number(cell)));
}

export function parseTaskTableResponse(raw: string, prompt: TaskPrompt): TaskTableResponse {
  const columns = prompt.columns ?? [];
  const rowCount = prompt.rows ?? 1;
  const columnCount = columns.length || 1;
  const fallback: TaskTableResponse = {
    headers: columns,
    rows: Array.from({ length: rowCount }, (_, r) =>
      Array.from({ length: columnCount }, (_, c) => prompt.prefilled?.[r]?.[c] ?? ''),
    ),
  };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const table = parsed as Record<string, unknown>;
      if (
        isStringArray(table['headers']) &&
        isStringMatrix(table['rows'])
      ) {
        return normalizeTaskTableResponse(table['headers'], table['rows'], prompt);
      }
    }
    if (isStringMatrix(parsed)) {
      const hasLegacyHeaderRow =
        prompt.editableColumnHeaders &&
        parsed.length > rowCount &&
        (parsed.length > rowCount + 1 || isLegacyHeaderRow(parsed[0], prompt));
      if (hasLegacyHeaderRow) {
        return normalizeTaskTableResponse(parsed[0], parsed.slice(1), prompt);
      }
      return normalizeTaskTableResponse(columns, parsed, prompt);
    }
  } catch {
    // Return configured blank cells when an existing response cannot be parsed.
  }

  return fallback;
}
