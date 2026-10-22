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
        return {
          headers: table['headers'],
          rows: table['rows'],
        };
      }
    }
    if (isStringMatrix(parsed)) {
      if (prompt.editableColumnHeaders && parsed.length === rowCount + 1) {
        return { headers: parsed[0], rows: parsed.slice(1) };
      }
      return { headers: columns, rows: parsed };
    }
  } catch {
    // Return configured blank cells when an existing response cannot be parsed.
  }

  return fallback;
}

/** Shared response boxes for the "Report Writing Practice: Sections A–E" task versions. */
const REPORT_SECTIONS_A_E_PROMPTS: TaskPrompt[] = [
  {
    sectionHeader: 'A. Statement of the Problem',
    label: 'Statement of the Problem',
    type: 'text',
    subLabel:
      'Write one question that names your IV and DV with units. It must not be a yes/no question.',
  },
  {
    sectionHeader: 'B. Hypothesis',
    label: 'Hypothesis',
    type: 'text',
    subLabel: 'If [IV] increases, then [DV] will [increase/decrease], because [scientific reason].',
  },
  {
    sectionHeader: 'C. Variables',
    label: 'Independent Variable (IV)',
    type: 'text',
    subLabel:
      'Operationally define it: what you change, how you change it, the tool used, and the units.',
  },
  {
    label: 'Levels of the IV',
    type: 'text',
    subLabel: 'List at least 3 levels, with units.',
  },
  {
    label: 'Dependent Variable (DV)',
    type: 'text',
    subLabel:
      'Operationally define it: what you measure, when and how you measure it, the tool used, and the units.',
  },
  {
    label: 'Controlled Variables (CV)',
    type: 'text',
    subLabel:
      'List 3 controlled variables and describe how each one is kept the same. Do not include the IV or DV.',
  },
  {
    sectionHeader: 'D. Materials',
    label: 'Materials',
    type: 'text',
    subLabel:
      'List every item you use with its quantity. Include measuring tools. Do not list items you do not use.',
  },
  {
    sectionHeader: 'E. Procedure and Set-Up Diagrams',
    label: 'Procedure',
    type: 'text',
    subLabel:
      'Write a numbered list of steps, including repeated trials and clean-up. Then draw at least 2 labeled diagrams of your set-up (such as a side view and a top view) on a separate sheet, labeling the materials, IV levels, tools, and where each team member stands.',
  },
];

/**
 * Static task registry. New tasks are added here.
 * Tasks are ordered newest-first for display.
 */
export const TASK_DEFINITIONS: TaskDefinition[] = [
  {
    id: 'task-020-report-sections-g-i',
    title: 'Report Writing Practice: Sections G–I (Toy Car Ramp)',
    sectionInstructions: {
      'G. Quantitative Data': `A toy car was released from a ramp at different heights. The team measured how far it rolled across the floor after leaving the ramp.

**Independent variable:** ramp height (cm). **Dependent variable:** distance rolled (cm). There were five trials at each height.

Notebook measurements (in trial order):

| Ramp height (cm) | Trial 1 | Trial 2 | Trial 3 | Trial 4 | Trial 5 |
|:--:|--:|--:|--:|--:|--:|
| 10 | 45 | 42 | 48 | 45 | 50 |
| 20 | 92 | 88 | 95 | 92 | 93 |
| 30 | 135 | 130 | 138 | 142 | 135 |
| 40 | 165 | 160 | 172 | 170 | 163 |

Fill in the column-heading fields directly in both tables. Use clear labels with units. The raw table should contain every measurement; the condensed table should contain only the means you will graph. Show one sample mean calculation.`,
      'H. Graph': `Make a scatter plot of the mean distance for each ramp height from your condensed table. Give the graph a descriptive title, label both axes with units, and add the four data points. Draw a single line of best fit (do not connect the points). Click the graph to place points, or focus it and use the arrow keys plus Enter. Hold Shift with an arrow key for a larger step. Switch to line mode and add two endpoints to draw the best-fit line.`,
      'I. Statistics — Sample Calculation at 30 cm': `Calculate the statistics for the 30 cm ramp height using these five distances: **135, 130, 138, 142, 135 cm**. Mean, median, mode, minimum, maximum, range, Q1, Q3, and IQR are required. **Optional challenge:** calculate the variance and sample standard deviation; for sample standard deviation, divide by **n − 1**. To find quartiles with five values, sort the data, leave out the median, then find the median of each half. Round to one decimal place where needed. Include units in your work; variance is in cm².`,
      'I. Statistics — Results for the Other IV Levels': `Complete the required statistics table for the remaining ramp heights. Q1, Q3, and IQR are required; variance and standard deviation are optional challenges. Use these trial results:

| Ramp height (cm) | Distances (cm) |
|:--:|:--|
| 10 | 45, 42, 48, 45, 50 |
| 20 | 92, 88, 95, 92, 93 |
| 40 | 165, 160, 172, 170, 163 |

Write **none** if there is no mode. Round to one decimal place where needed.`,
      'I. Statistics — Interpret Your Results': `Use your calculated range and IQR to compare how consistent the distances were at each ramp height. If you completed the optional challenge, you may also use standard deviation. Remember that variance is expressed in squared units.`,
    },
    prompts: [
      // ── G. Quantitative Data ──
      {
        sectionHeader: 'G. Quantitative Data',
        label: 'Raw Data Table',
        type: 'table',
        subLabel: 'Enter clear column headings with units, then enter the four IV levels and all five trials.',
        columns: ['', '', '', '', '', ''],
        editableColumnHeaders: true,
        expectedColumns: [
          'Ramp Height (cm)',
          'Trial 1 (cm)',
          'Trial 2 (cm)',
          'Trial 3 (cm)',
          'Trial 4 (cm)',
          'Trial 5 (cm)',
        ],
        rows: 4,
        prefilled: [
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
        ],
        expectedTableValues: [
          ['10', '45', '42', '48', '45', '50'],
          ['20', '92', '88', '95', '92', '93'],
          ['30', '135', '130', '138', '142', '135'],
          ['40', '165', '160', '172', '170', '163'],
        ],
      },
      {
        label: 'Condensed Data Table',
        type: 'table',
        subLabel: 'Enter clear column headings with units. Include only the means you will graph.',
        columns: ['', ''],
        editableColumnHeaders: true,
        expectedColumns: ['Ramp Height (cm)', 'Mean Distance (cm)'],
        rows: 4,
        prefilled: [
          ['10', null],
          ['20', null],
          ['30', null],
          ['40', null],
        ],
        expectedTableValues: [
          ['10', '46.0'],
          ['20', '92.0'],
          ['30', '136.0'],
          ['40', '166.0'],
        ],
      },
      {
        label: 'Sample Calculation — Mean',
        type: 'text',
        subLabel:
          'Show how you calculated the mean distance at 20 cm. Include the measurements, division, and units.',
      },

      // ── H. Graph ──
      {
        sectionHeader: 'H. Graph',
        label: 'Build Your Graph',
        type: 'graph',
        graphConfig: { xMin: 0, xMax: 50, yMin: 0, yMax: 200, maxPoints: 4 },
      },

      // ── I. Statistics: sample calculations at 30 cm (135, 130, 138, 142, 135) ──
      {
        sectionHeader: 'I. Statistics — Sample Calculation at 30 cm',
        label: 'Mean (cm)',
        type: 'number',
        subLabel: 'Data: 135, 130, 138, 142, 135 cm',
        expectedAnswer: 136.0,
        tolerance: 0.1,
      },
      {
        label: 'Median (cm)',
        type: 'number',
        expectedAnswer: 135,
        tolerance: 0.1,
      },
      {
        label: 'Mode (cm)',
        type: 'number',
        expectedAnswer: 135,
        tolerance: 0.1,
      },
      {
        label: 'Minimum (cm)',
        type: 'number',
        expectedAnswer: 130,
        tolerance: 0.1,
      },
      {
        label: 'Maximum (cm)',
        type: 'number',
        expectedAnswer: 142,
        tolerance: 0.1,
      },
      {
        label: 'Range (cm)',
        type: 'number',
        expectedAnswer: 12,
        tolerance: 0.1,
      },
      {
        label: 'Optional Challenge — Deviations Table (30 cm)',
        type: 'table',
        subLabel: 'Optional challenge: use the mean you found above to calculate each deviation and squared deviation.',
        columns: ['Data Value (cm)', 'Deviation (cm)', 'Squared Deviation (cm²)'],
        rows: 5,
        prefilled: [
          ['135', null, null],
          ['130', null, null],
          ['138', null, null],
          ['142', null, null],
          ['135', null, null],
        ],
        expectedTableValues: [
          ['135', '-1', '1'],
          ['130', '-6', '36'],
          ['138', '2', '4'],
          ['142', '6', '36'],
          ['135', '-1', '1'],
        ],
      },
      {
        label: 'Optional Challenge — Variance (cm²)',
        type: 'number',
        subLabel: 'Divide the sum of the squared deviations by n − 1.',
        expectedAnswer: 19.5,
        tolerance: 0.1,
      },
      {
        label: 'Optional Challenge — Standard Deviation (cm)',
        type: 'number',
        expectedAnswer: 4.4,
        tolerance: 0.1,
      },
      {
        label: 'Q1 (cm)',
        type: 'number',
        expectedAnswer: 132.5,
        tolerance: 0.1,
      },
      {
        label: 'Q3 (cm)',
        type: 'number',
        expectedAnswer: 140,
        tolerance: 0.1,
      },
      {
        label: 'IQR (cm)',
        type: 'number',
        expectedAnswer: 7.5,
        tolerance: 0.1,
      },

      // ── I. Statistics: remaining IV levels ──
      {
        sectionHeader: 'I. Statistics — Results for the Other IV Levels',
        label: 'Central Tendency and Range',
        type: 'table',
        subLabel:
          'Calculate these statistics for each remaining ramp height. Write "none" if there is no mode. Round to one decimal place. The 30 cm level is done above.',
        columns: [
          'Ramp Height (cm)',
          'Mean (cm)',
          'Median (cm)',
          'Mode (cm)',
          'Min (cm)',
          'Max (cm)',
          'Range (cm)',
        ],
        rows: 3,
        prefilled: [
          ['10', null, null, null, null, null, null],
          ['20', null, null, null, null, null, null],
          ['40', null, null, null, null, null, null],
        ],
        expectedTableValues: [
          ['10', '46', '45', '45', '42', '50', '8'],
          ['20', '92', '92', '92', '88', '95', '7'],
          ['40', '166', '165', 'none', '160', '172', '12'],
        ],
      },
      {
        label: 'Quartiles and Variation',
        type: 'table',
        subLabel:
          'Required: calculate Q1, Q3, and IQR for each ramp height. Optional challenge: calculate the sample variance and sample standard deviation.',
        columns: [
          'Ramp Height (cm)',
          'Q1 (cm)',
          'Q3 (cm)',
          'IQR (cm)',
          'Variance (cm²)',
          'Std. Dev. (cm)',
        ],
        rows: 3,
        prefilled: [
          ['10', null, null, null, null, null],
          ['20', null, null, null, null, null],
          ['40', null, null, null, null, null],
        ],
        expectedTableValues: [
          ['10', '43.5', '49', '5.5', '9.5', '3.1'],
          ['20', '90', '94', '4', '6.5', '2.5'],
          ['40', '161.5', '171', '9.5', '24.5', '4.9'],
        ],
      },

      // ── I. Statistics: interpretation ──
      {
        sectionHeader: 'I. Statistics — Interpret Your Results',
        label: 'Units of Variance',
        type: 'short-answer',
        subLabel: 'What are the units of the variance when the data is in cm?',
        inputLabel: 'Units',
      },
      {
        label: 'Consistency Across Levels',
        type: 'text',
        subLabel:
          'Which ramp height gave the most consistent distances, and which gave the least consistent? Use range and IQR as evidence. If you completed the optional challenge, you may also use standard deviation.',
      },
    ],
    dueDate: '',
    createdAt: '2026-10-22',
  },
  {
    id: 'task-019-report-sections-a-e-buoyancy',
    title: 'Report Writing Practice: Sections A–E (Buoyancy)',
    promptFile: 'tasks/task-019-report-sections-a-e-buoyancy.md',
    prompts: REPORT_SECTIONS_A_E_PROMPTS,
    dueDate: '',
    createdAt: '2026-10-15',
  },
  {
    id: 'task-018-report-sections-a-e-pendulum',
    title: 'Report Writing Practice: Sections A–E (Pendulum)',
    promptFile: 'tasks/task-018-report-sections-a-e-pendulum.md',
    prompts: REPORT_SECTIONS_A_E_PROMPTS,
    dueDate: '',
    createdAt: '2026-10-15',
  },
  {
    id: 'task-017-report-sections-a-e',
    title: 'Report Writing Practice: Sections A–E (Friction)',
    promptFile: 'tasks/task-017-report-sections-a-e.md',
    prompts: REPORT_SECTIONS_A_E_PROMPTS,
    dueDate: '',
    createdAt: '2026-10-15',
  },
  {
    id: 'task-016-improvements-salt-ice',
    title: 'Improvements, Applications & Recommendations: Salt and Ice Melting',
    promptFile: 'tasks/task-016-improvements-salt-ice.md',
    prompts: [
      {
        label: 'Improvements',
        type: 'text',
        subLabel:
          'What specific changes could make this experiment more accurate or reliable? List at least 3–4.',
      },
      {
        label: 'Applications',
        type: 'text',
        subLabel: 'How could these findings be useful in the real world? List at least 3–4.',
      },
      {
        label: 'Recommendations for Future Experiments',
        type: 'text',
        subLabel: 'What follow-up experiments could extend these findings? Suggest at least 3–4.',
      },
    ],
    dueDate: '',
    createdAt: '2026-04-16',
  },
  {
    id: 'task-015-qual-obs-baking-soda',
    title: 'Qualitative Observations Practice: Baking Soda Reactions',
    promptFile: 'tasks/task-015-qual-obs-baking-soda.md',
    prompts: [
      {
        label: 'Setup Observations',
        type: 'text',
        subLabel:
          'Describe what you observed about the physical setup before the experiment began (equipment, materials, environment).',
      },
      {
        label: 'Procedure Observations',
        type: 'text',
        subLabel:
          'Describe what you noticed during the experiment while carrying out the procedure (how things were done, any difficulties).',
      },
      {
        label: 'Results Observations',
        type: 'text',
        subLabel:
          'Describe what you observed about the outcomes — appearance, smell, sound, texture, or behavior of the reactions.',
      },
    ],
    dueDate: '',
    createdAt: '2026-04-16',
  },
  {
    id: 'task-014-error-analysis',
    title: 'Error Analysis Practice',
    promptFile: 'tasks/task-014-error-analysis.md',
    prompts: [
      // ── Scenario 1: Candle Burn Time ──
      {
        label: 'Error 1 — Type',
        type: 'short-answer',
        sectionHeader: 'Scenario 1 — Candle Burn Time Under Different Jar Sizes',
        subLabel: 'Is this error systematic, procedural, or random?',
      },
      {
        label: 'Error 1 — Description',
        type: 'text',
        subLabel: 'Describe the specific error in the experiment.',
      },
      {
        label: 'Error 1 — Effect on Results',
        type: 'text',
        subLabel: 'How does this error specifically affect the data?',
      },
      {
        label: 'Error 2 — Type',
        type: 'short-answer',
        subLabel: 'Is this error systematic, procedural, or random?',
      },
      {
        label: 'Error 2 — Description',
        type: 'text',
        subLabel: 'Describe the specific error in the experiment.',
      },
      {
        label: 'Error 2 — Effect on Results',
        type: 'text',
        subLabel: 'How does this error specifically affect the data?',
      },
      // ── Scenario 2: Paper Airplane Distance ──
      {
        label: 'Error 1 — Type',
        type: 'short-answer',
        sectionHeader: 'Scenario 2 — Paper Airplane Distance by Number of Wing Folds',
        subLabel: 'Is this error systematic, procedural, or random?',
      },
      {
        label: 'Error 1 — Description',
        type: 'text',
        subLabel: 'Describe the specific error in the experiment.',
      },
      {
        label: 'Error 1 — Effect on Results',
        type: 'text',
        subLabel: 'How does this error specifically affect the data?',
      },
      {
        label: 'Error 2 — Type',
        type: 'short-answer',
        subLabel: 'Is this error systematic, procedural, or random?',
      },
      {
        label: 'Error 2 — Description',
        type: 'text',
        subLabel: 'Describe the specific error in the experiment.',
      },
      {
        label: 'Error 2 — Effect on Results',
        type: 'text',
        subLabel: 'How does this error specifically affect the data?',
      },
      // ── Scenario 3: Tea Steeping Color ──
      {
        label: 'Error 1 — Type',
        type: 'short-answer',
        sectionHeader: 'Scenario 3 — Tea Steeping Color Intensity',
        subLabel: 'Is this error systematic, procedural, or random?',
      },
      {
        label: 'Error 1 — Description',
        type: 'text',
        subLabel: 'Describe the specific error in the experiment.',
      },
      {
        label: 'Error 1 — Effect on Results',
        type: 'text',
        subLabel: 'How does this error specifically affect the data?',
      },
      {
        label: 'Error 2 — Type',
        type: 'short-answer',
        subLabel: 'Is this error systematic, procedural, or random?',
      },
      {
        label: 'Error 2 — Description',
        type: 'text',
        subLabel: 'Describe the specific error in the experiment.',
      },
      {
        label: 'Error 2 — Effect on Results',
        type: 'text',
        subLabel: 'How does this error specifically affect the data?',
      },
    ],
    dueDate: '',
    createdAt: '2026-04-16',
  },
  {
    id: 'task-013-stats-catapult',
    title: 'Full Statistics Practice: Catapult Projectile Distance',
    promptFile: 'tasks/task-013-stats-catapult.md',
    prompts: [
      // ── IV Level 1 (20°): 84, 78, 84 → mean=82.0 ──
      {
        label: 'IV Level 1 — Mean (20°)',
        type: 'number',
        sectionHeader: 'IV Level 1 — 20°',
        expectedAnswer: 82.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — Median',
        type: 'number',
        expectedAnswer: 84,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 1 — Mode',
        type: 'number',
        expectedAnswer: 84,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 1 — Range',
        type: 'number',
        expectedAnswer: 6,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 1 — Deviations Table',
        type: 'table',
        columns: ['Data Value (cm)', 'Deviation (cm)', 'Squared Deviation (cm²)'],
        rows: 3,
        prefilled: [
          ['84', null, null],
          ['78', null, null],
          ['84', null, null],
        ],
        expectedTableValues: [
          ['84', '2', '4'],
          ['78', '-4', '16'],
          ['84', '2', '4'],
        ],
      },
      {
        label: 'IV Level 1 — Variance',
        type: 'number',
        expectedAnswer: 12.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — Standard Deviation',
        type: 'number',
        expectedAnswer: 3.5,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — Q1',
        type: 'number',
        expectedAnswer: 78.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — Q3',
        type: 'number',
        expectedAnswer: 84.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — IQR',
        type: 'number',
        expectedAnswer: 6.0,
        tolerance: 0.1,
      },

      // ── IV Level 2 (45°): 126, 138, 126 → mean=130.0 ──
      {
        label: 'IV Level 2 — Mean (45°)',
        type: 'number',
        sectionHeader: 'IV Level 2 — 45°',
        expectedAnswer: 130.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — Median',
        type: 'number',
        expectedAnswer: 126,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 2 — Mode',
        type: 'number',
        expectedAnswer: 126,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 2 — Range',
        type: 'number',
        expectedAnswer: 12,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 2 — Deviations Table',
        type: 'table',
        columns: ['Data Value (cm)', 'Deviation (cm)', 'Squared Deviation (cm²)'],
        rows: 3,
        prefilled: [
          ['126', null, null],
          ['138', null, null],
          ['126', null, null],
        ],
        expectedTableValues: [
          ['126', '-4', '16'],
          ['138', '8', '64'],
          ['126', '-4', '16'],
        ],
      },
      {
        label: 'IV Level 2 — Variance',
        type: 'number',
        expectedAnswer: 48.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — Standard Deviation',
        type: 'number',
        expectedAnswer: 6.9,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — Q1',
        type: 'number',
        expectedAnswer: 126.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — Q3',
        type: 'number',
        expectedAnswer: 138.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — IQR',
        type: 'number',
        expectedAnswer: 12.0,
        tolerance: 0.1,
      },

      // ── IV Level 3 (70°): 63, 57, 63 → mean=61.0 ──
      {
        label: 'IV Level 3 — Mean (70°)',
        type: 'number',
        sectionHeader: 'IV Level 3 — 70°',
        expectedAnswer: 61.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — Median',
        type: 'number',
        expectedAnswer: 63,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 3 — Mode',
        type: 'number',
        expectedAnswer: 63,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 3 — Range',
        type: 'number',
        expectedAnswer: 6,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 3 — Deviations Table',
        type: 'table',
        columns: ['Data Value (cm)', 'Deviation (cm)', 'Squared Deviation (cm²)'],
        rows: 3,
        prefilled: [
          ['63', null, null],
          ['57', null, null],
          ['63', null, null],
        ],
        expectedTableValues: [
          ['63', '2', '4'],
          ['57', '-4', '16'],
          ['63', '2', '4'],
        ],
      },
      {
        label: 'IV Level 3 — Variance',
        type: 'number',
        expectedAnswer: 12.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — Standard Deviation',
        type: 'number',
        expectedAnswer: 3.5,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — Q1',
        type: 'number',
        expectedAnswer: 57.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — Q3',
        type: 'number',
        expectedAnswer: 63.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — IQR',
        type: 'number',
        expectedAnswer: 6.0,
        tolerance: 0.1,
      },
    ],
    dueDate: '',
    createdAt: '2026-04-16',
  },
  {
    id: 'task-012-cer-helicopter',
    title: 'Full CER Practice: Paper Helicopter Experiment',
    promptFile: 'tasks/task-012-cer-helicopter.md',
    prompts: [
      // ── Data Trend CER ──
      {
        label: 'Claim',
        type: 'text',
        sectionHeader: 'Data Trend CER',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
      // ── Variation CER ──
      {
        label: 'Claim',
        type: 'text',
        sectionHeader: 'Variation CER',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
      // ── Outliers CER ──
      {
        label: 'Claim',
        type: 'text',
        sectionHeader: 'Outliers CER',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
      // ── Conclusion CER ──
      {
        label: 'Hypothesis (Restated)',
        type: 'text',
        sectionHeader: 'Conclusion CER',
      },
      {
        label: 'Claim',
        type: 'text',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
    ],
    dueDate: '',
    createdAt: '2026-04-16',
  },
  {
    id: 'task-011-quick-design-states',
    title: 'Quick Design Challenge: States Prep',
    promptFile: 'tasks/task-011-quick-design-states.md',
    prompts: [
      // ── Topic 1: Evaporative Cooling ──
      {
        label: 'Statement of Problem',
        type: 'text',
        sectionHeader: 'Topic 1 — Evaporative Cooling',
        subLabel:
          'Write a testable question about evaporative cooling using the provided materials.',
      },
      {
        label: 'Hypothesis',
        type: 'text',
        subLabel: 'If... then... because...',
      },
      {
        label: 'Independent Variable',
        type: 'short-answer',
        subLabel: 'What would you change between trials? Include at least 3 levels and units.',
      },
      {
        label: 'Dependent Variable',
        type: 'short-answer',
        subLabel: 'What would you measure? Include units.',
      },
      {
        label: 'Controlled Variable 1',
        type: 'short-answer',
        subLabel: 'Name the variable and how you would control it.',
      },
      {
        label: 'Controlled Variable 2',
        type: 'short-answer',
        subLabel: 'Name the variable and how you would control it.',
      },
      {
        label: 'Controlled Variable 3',
        type: 'short-answer',
        subLabel: 'Name the variable and how you would control it.',
      },
      // ── Topic 2: Structural Load-Bearing ──
      {
        label: 'Statement of Problem',
        type: 'text',
        sectionHeader: 'Topic 2 — Structural Load-Bearing',
        subLabel:
          'Write a testable question about structural load-bearing using the provided materials.',
      },
      {
        label: 'Hypothesis',
        type: 'text',
        subLabel: 'If... then... because...',
      },
      {
        label: 'Independent Variable',
        type: 'short-answer',
        subLabel: 'What would you change between trials? Include at least 3 levels and units.',
      },
      {
        label: 'Dependent Variable',
        type: 'short-answer',
        subLabel: 'What would you measure? Include units.',
      },
      {
        label: 'Controlled Variable 1',
        type: 'short-answer',
        subLabel: 'Name the variable and how you would control it.',
      },
      {
        label: 'Controlled Variable 2',
        type: 'short-answer',
        subLabel: 'Name the variable and how you would control it.',
      },
      {
        label: 'Controlled Variable 3',
        type: 'short-answer',
        subLabel: 'Name the variable and how you would control it.',
      },
      // ── Topic 3: Static Electricity ──
      {
        label: 'Statement of Problem',
        type: 'text',
        sectionHeader: 'Topic 3 — Static Electricity',
        subLabel:
          'Write a testable question about static electricity using the provided materials.',
      },
      {
        label: 'Hypothesis',
        type: 'text',
        subLabel: 'If... then... because...',
      },
      {
        label: 'Independent Variable',
        type: 'short-answer',
        subLabel: 'What would you change between trials? Include at least 3 levels and units.',
      },
      {
        label: 'Dependent Variable',
        type: 'short-answer',
        subLabel: 'What would you measure? Include units.',
      },
      {
        label: 'Controlled Variable 1',
        type: 'short-answer',
        subLabel: 'Name the variable and how you would control it.',
      },
      {
        label: 'Controlled Variable 2',
        type: 'short-answer',
        subLabel: 'Name the variable and how you would control it.',
      },
      {
        label: 'Controlled Variable 3',
        type: 'short-answer',
        subLabel: 'Name the variable and how you would control it.',
      },
    ],
    dueDate: '',
    createdAt: '2026-04-16',
  },
  {
    id: 'task-010-full-statistics',
    title: 'Full Statistics Practice: Sugar Dissolving Experiment',
    promptFile: 'tasks/task-010-full-statistics.md',
    prompts: [
      // ── IV Level 1 (20 °C): 98, 98, 112 → mean=102.7 ──
      {
        label: 'IV Level 1 — Mean (20 °C)',
        type: 'number',
        sectionHeader: 'IV Level 1 — 20 °C',
        expectedAnswer: 102.7,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — Median',
        type: 'number',
        expectedAnswer: 98,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 1 — Mode',
        type: 'number',
        expectedAnswer: 98,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 1 — Range',
        type: 'number',
        expectedAnswer: 14,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 1 — Deviations Table',
        type: 'table',
        columns: ['Data Value (s)', 'Deviation (s)', 'Squared Deviation (s²)'],
        rows: 3,
        prefilled: [
          ['98', null, null],
          ['98', null, null],
          ['112', null, null],
        ],
      },
      {
        label: 'IV Level 1 — Variance',
        type: 'number',
        expectedAnswer: 65.3,
        tolerance: 0.2,
      },
      {
        label: 'IV Level 1 — Standard Deviation',
        type: 'number',
        expectedAnswer: 8.1,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — Q1',
        type: 'number',
        expectedAnswer: 98.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — Q3',
        type: 'number',
        expectedAnswer: 112.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — IQR',
        type: 'number',
        expectedAnswer: 14.0,
        tolerance: 0.1,
      },

      // ── IV Level 2 (40 °C): 57, 57, 65 → mean=59.7 ──
      {
        label: 'IV Level 2 — Mean (40 °C)',
        type: 'number',
        sectionHeader: 'IV Level 2 — 40 °C',
        expectedAnswer: 59.7,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — Median',
        type: 'number',
        expectedAnswer: 57,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 2 — Mode',
        type: 'number',
        expectedAnswer: 57,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 2 — Range',
        type: 'number',
        expectedAnswer: 8,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 2 — Deviations Table',
        type: 'table',
        columns: ['Data Value (s)', 'Deviation (s)', 'Squared Deviation (s²)'],
        rows: 3,
        prefilled: [
          ['57', null, null],
          ['57', null, null],
          ['65', null, null],
        ],
      },
      {
        label: 'IV Level 2 — Variance',
        type: 'number',
        expectedAnswer: 21.3,
        tolerance: 0.2,
      },
      {
        label: 'IV Level 2 — Standard Deviation',
        type: 'number',
        expectedAnswer: 4.6,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — Q1',
        type: 'number',
        expectedAnswer: 57.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — Q3',
        type: 'number',
        expectedAnswer: 65.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — IQR',
        type: 'number',
        expectedAnswer: 8.0,
        tolerance: 0.1,
      },

      // ── IV Level 3 (60 °C): 34, 34, 40 → mean=36.0 ──
      {
        label: 'IV Level 3 — Mean (60 °C)',
        type: 'number',
        sectionHeader: 'IV Level 3 — 60 °C',
        expectedAnswer: 36.0,
        tolerance: 0.05,
      },
      {
        label: 'IV Level 3 — Median',
        type: 'number',
        expectedAnswer: 34,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 3 — Mode',
        type: 'number',
        expectedAnswer: 34,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 3 — Range',
        type: 'number',
        expectedAnswer: 6,
        tolerance: 0.5,
      },
      {
        label: 'IV Level 3 — Deviations Table',
        type: 'table',
        columns: ['Data Value (s)', 'Deviation (s)', 'Squared Deviation (s²)'],
        rows: 3,
        prefilled: [
          ['34', null, null],
          ['34', null, null],
          ['40', null, null],
        ],
        expectedTableValues: [
          ['34', '-2', '4'],
          ['34', '-2', '4'],
          ['40', '4', '16'],
        ],
      },
      {
        label: 'IV Level 3 — Variance',
        type: 'number',
        expectedAnswer: 12.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — Standard Deviation',
        type: 'number',
        expectedAnswer: 3.5,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — Q1',
        type: 'number',
        expectedAnswer: 34.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — Q3',
        type: 'number',
        expectedAnswer: 40.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — IQR',
        type: 'number',
        expectedAnswer: 6.0,
        tolerance: 0.1,
      },
    ],
    dueDate: '2026-04-27',
    createdAt: '2026-04-13',
  },
  {
    id: 'task-009-cer-dissolving',
    title: 'Full CER Practice: Sugar Dissolving Experiment',
    promptFile: 'tasks/task-009-cer-dissolving.md',
    prompts: [
      // ── Data Trend CER ──
      {
        label: 'Claim',
        type: 'text',
        sectionHeader: 'Data Trend CER',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
      // ── Variation CER ──
      {
        label: 'Claim',
        type: 'text',
        sectionHeader: 'Variation CER',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
      // ── Outliers CER ──
      {
        label: 'Claim',
        type: 'text',
        sectionHeader: 'Outliers CER',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
      // ── Conclusion CER ──
      {
        label: 'Hypothesis (Restated)',
        type: 'text',
        sectionHeader: 'Conclusion CER',
      },
      {
        label: 'Claim',
        type: 'text',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
    ],
    dueDate: '2026-04-27',
    createdAt: '2026-04-13',
  },
  {
    id: 'task-008-cer-practice',
    title: 'Full CER Practice: Bounce Height Experiment',
    promptFile: 'tasks/task-008-cer-practice.md',
    prompts: [
      // ── Data Trend CER ──
      {
        label: 'Claim',
        type: 'text',
        sectionHeader: 'Data Trend CER',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
      // ── Variation CER ──
      {
        label: 'Claim',
        type: 'text',
        sectionHeader: 'Variation CER',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
      // ── Outliers CER ──
      {
        label: 'Claim',
        type: 'text',
        sectionHeader: 'Outliers CER',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
      // ── Conclusion CER ──
      {
        label: 'Hypothesis (Restated)',
        type: 'text',
        sectionHeader: 'Conclusion CER',
      },
      {
        label: 'Claim',
        type: 'text',
      },
      {
        label: 'Evidence',
        type: 'text',
      },
      {
        label: 'Reasoning',
        type: 'text',
      },
    ],
    dueDate: '2026-04-20',
    createdAt: '2026-04-05',
  },
  {
    id: 'task-007-quick-design',
    title: 'Quick Design Challenge',
    promptFile: 'tasks/task-007-quick-design.md',
    prompts: [
      // ── Topic 1: Elasticity ──
      {
        label: 'Statement of Problem',
        type: 'text',
        sectionHeader: 'Topic 1 — Elasticity',
        subLabel: 'Write a testable question about elasticity using the provided materials.',
      },
      {
        label: 'Independent Variable',
        type: 'short-answer',
        subLabel: 'What would you change between trials?',
      },
      {
        label: 'Dependent Variable',
        type: 'short-answer',
        subLabel: 'What would you measure?',
      },
      // ── Topic 2: Capillary Action ──
      {
        label: 'Statement of Problem',
        type: 'text',
        sectionHeader: 'Topic 2 — Capillary Action',
        subLabel: 'Write a testable question about capillary action using the provided materials.',
      },
      {
        label: 'Independent Variable',
        type: 'short-answer',
        subLabel: 'What would you change between trials?',
      },
      {
        label: 'Dependent Variable',
        type: 'short-answer',
        subLabel: 'What would you measure?',
      },
      // ── Topic 3: Magnetism ──
      {
        label: 'Statement of Problem',
        type: 'text',
        sectionHeader: 'Topic 3 — Magnetism',
        subLabel: 'Write a testable question about magnetism using the provided materials.',
      },
      {
        label: 'Independent Variable',
        type: 'short-answer',
        subLabel: 'What would you change between trials?',
      },
      {
        label: 'Dependent Variable',
        type: 'short-answer',
        subLabel: 'What would you measure?',
      },
    ],
    dueDate: '2026-04-13',
    createdAt: '2026-04-01',
  },
  {
    id: 'task-006-qual-obs-applications-alt',
    title: 'Qualitative Observations & Applications: Density',
    promptFile: 'tasks/task-006-qual-obs-applications-alt.md',
    prompts: [
      // ── Part 1: Qualitative Observations ──
      {
        label: 'Setup Observations',
        type: 'text',
        sectionHeader: 'Part 1 — Qualitative Observations',
        subLabel:
          'Describe what you observed about the physical setup before the experiment began (equipment, materials, environment).',
      },
      {
        label: 'Procedure Observations',
        type: 'text',
        subLabel:
          'Describe what you noticed during the experiment while carrying out the procedure (how things were done, any difficulties).',
      },
      {
        label: 'Results Observations',
        type: 'text',
        subLabel:
          'Describe what you observed about the outcomes — how the liquids looked, felt, smelled, or behaved during and after the experiment.',
      },
      // ── Part 2: Applications & Recommendations ──
      {
        label: 'Improvements',
        type: 'text',
        sectionHeader: 'Part 2 — Applications & Recommendations',
        subLabel:
          'What could be changed to make this experiment more accurate or reliable? Consider sources of error and how to fix them.',
      },
      {
        label: 'Practical Applications',
        type: 'text',
        subLabel:
          'How could the findings from this experiment be applied in the real world? Think about cooking, oil spills, recycling, or other examples.',
      },
      {
        label: 'Future Experiments',
        type: 'text',
        subLabel:
          'What follow-up experiments could extend or build on these findings? Suggest a new IV or a variation on the design.',
      },
    ],
    dueDate: '2026-04-06',
    createdAt: '2026-03-26',
  },
  {
    id: 'task-005-qual-obs-applications',
    title: 'Qualitative Observations & Applications: Ink Separation',
    promptFile: 'tasks/task-005-qual-obs-applications.md',
    prompts: [
      // ── Part 1: Qualitative Observations ──
      {
        label: 'Setup Observations',
        type: 'text',
        sectionHeader: 'Part 1 — Qualitative Observations',
        subLabel:
          'Describe what you observed about the physical setup before the experiment began (equipment, materials, environment).',
      },
      {
        label: 'Procedure Observations',
        type: 'text',
        subLabel:
          'Describe what you noticed during the experiment while carrying out the procedure (how things were done, any difficulties).',
      },
      {
        label: 'Results Observations',
        type: 'text',
        subLabel:
          'Describe what you observed about the outcomes — appearance, color, texture, or behavior of the paper strips and ink.',
      },
      // ── Part 2: Applications & Recommendations ──
      {
        label: 'Improvements',
        type: 'text',
        sectionHeader: 'Part 2 — Applications & Recommendations',
        subLabel:
          'What could be changed to make this experiment more accurate or reliable? Consider sources of error and how to fix them.',
      },
      {
        label: 'Practical Applications',
        type: 'text',
        subLabel:
          'How could the findings from this experiment be applied in the real world? Think about agriculture, gardening, or other fields.',
      },
      {
        label: 'Future Experiments',
        type: 'text',
        subLabel:
          'What follow-up experiments could extend or build on these findings? Suggest a new IV or a variation on the design.',
      },
    ],
    dueDate: '2026-04-06',
    createdAt: '2026-03-26',
  },
  {
    id: 'task-004-variation-cer',
    title: 'Variation CER Practice',
    promptFile: 'tasks/task-004-variation-cer.md',
    prompts: [
      {
        label: 'Claim',
        type: 'text',
        subLabel:
          'State whether the variation increased or decreased as the ramp angle increased. Be specific — name the IV.',
      },
      {
        label: 'Evidence',
        type: 'text',
        subLabel:
          'List the standard deviation for each IV level to support your claim. You may also reference the IQR values.',
      },
      {
        label: 'Reasoning',
        type: 'text',
        subLabel:
          'Explain what the changing standard deviation tells us about the spread of data and why that matters.',
      },
    ],
    dueDate: '2026-04-06',
    createdAt: '2026-03-26',
  },
  {
    id: 'task-003-outlier-detection',
    title: 'Outlier Detection Practice',
    promptFile: 'tasks/task-003-outlier-detection.md',
    prompts: [
      // ── Finding Outliers by Standard Deviation ──
      // Data: 76.0, 80.0, 78.0, 82.0, 94.0 cm
      {
        label: 'Step 1 — Mean',
        type: 'number',
        sectionHeader: 'Finding Outliers by Standard Deviation',
        subLabel: 'Add all five data values and divide by 5.',
        expectedAnswer: 82.0,
        tolerance: 0.05,
      },
      {
        label: 'Step 2 — Deviations Table',
        type: 'table',
        subLabel:
          'For each data value: subtract the mean to find the deviation, then square the deviation.',
        columns: ['Data Value (cm)', 'Deviation from Mean (cm)', 'Squared Deviation (cm²)'],
        rows: 5,
        prefilled: [
          ['76.0', null, null],
          ['80.0', null, null],
          ['78.0', null, null],
          ['82.0', null, null],
          ['94.0', null, null],
        ],
        expectedTableValues: [
          ['76.0', '-6.0', '36.0'],
          ['80.0', '-2.0', '4.0'],
          ['78.0', '-4.0', '16.0'],
          ['82.0', '0.0', '0.0'],
          ['94.0', '12.0', '144.0'],
        ],
      },
      {
        label: 'Step 3 — Variance',
        type: 'number',
        subLabel: 'Sum of squared deviations ÷ (n − 1), where n = 5.',
        expectedAnswer: 50.0,
        tolerance: 0.1,
      },
      {
        label: 'Step 3 — Variance Units',
        type: 'short-answer',
        subLabel: 'What are the units of variance?',
        inline: true,
      },
      {
        label: 'Step 4 — Standard Deviation',
        type: 'number',
        subLabel: 'Take the square root of the variance. Round to one decimal place.',
        expectedAnswer: 7.1,
        tolerance: 0.05,
      },
      {
        label: 'Step 4 — Standard Deviation Units',
        type: 'short-answer',
        subLabel: 'What are the units of standard deviation?',
        inline: true,
      },
      {
        label: 'Step 5 — Outlier Boundaries',
        type: 'number',
        inputLabel: 'Lower Boundary',
        subLabel: 'Lower boundary: mean − 3s',
        expectedAnswer: 60.7,
        tolerance: 0.3,
      },
      {
        label: 'Upper Boundary',
        type: 'number',
        subLabel: 'Upper boundary: mean + 3s',
        expectedAnswer: 103.3,
        tolerance: 0.3,
        inline: true,
      },
      {
        label: 'Step 6 — Any Outliers?',
        type: 'short-answer',
        subLabel:
          'Are any data values outside the 3s boundaries? If yes, list the value(s). If no, write "None".',
      },

      // ── Finding Outliers by IQR ──
      {
        label: 'Step 1 — Sort the Data',
        type: 'short-answer',
        sectionHeader: 'Finding Outliers by IQR',
        subLabel:
          'List all five data values in order from smallest to largest, separated by commas.',
      },
      {
        label: 'Step 2 — Median (Q2)',
        type: 'number',
        subLabel: 'The middle value of the sorted data.',
        expectedAnswer: 80.0,
        tolerance: 0.05,
      },
      {
        label: 'Step 3 — Q1 and Q3',
        type: 'number',
        inputLabel: 'Q1',
        subLabel:
          'Q1 is the median of the lower half (exclude the overall median). For 5 sorted values, the lower half is the 1st and 2nd values.',
        expectedAnswer: 77.0,
        tolerance: 0.05,
      },
      {
        label: 'Q3',
        type: 'number',
        subLabel:
          'Q3 is the median of the upper half (exclude the overall median). For 5 sorted values, the upper half is the 4th and 5th values.',
        expectedAnswer: 88.0,
        tolerance: 0.05,
        inline: true,
      },
      {
        label: 'Step 4 — IQR',
        type: 'number',
        subLabel: 'IQR = Q3 − Q1',
        expectedAnswer: 11.0,
        tolerance: 0.05,
      },
      {
        label: 'Step 5 — Outlier Boundaries',
        type: 'number',
        inputLabel: 'Lower Boundary',
        subLabel: 'Lower boundary: Q1 − 1.5 × IQR',
        expectedAnswer: 60.5,
        tolerance: 0.1,
      },
      {
        label: 'Upper Boundary',
        type: 'number',
        subLabel: 'Upper boundary: Q3 + 1.5 × IQR',
        expectedAnswer: 104.5,
        tolerance: 0.1,
        inline: true,
      },
      {
        label: 'Step 6 — Any Outliers?',
        type: 'short-answer',
        subLabel:
          'Are any data values outside the IQR boundaries? If yes, list the value(s). If no, write "None".',
      },
    ],
    dueDate: '2026-03-30',
    createdAt: '2026-03-23',
  },
  {
    id: 'task-002-variance-stddev',
    title: 'Variance & Standard Deviation Practice',
    promptFile: 'tasks/task-002-variance-stddev.md',
    prompts: [
      // ── IV Level 1 (15° ramp): 38.0, 44.0, 41.0 ──
      {
        label: 'IV Level 1 — Mean (15° ramp)',
        type: 'number',
        subLabel: 'Add the three data values and divide by 3',
        expectedAnswer: 41.0,
        tolerance: 0.05,
      },
      {
        label: 'IV Level 1 — Deviations Table (15° ramp)',
        type: 'table',
        subLabel: 'Deviation = data value − mean. Squared deviation = deviation × deviation.',
        columns: ['Data Value (cm)', 'Deviation from Mean (cm)', 'Squared Deviation (cm²)'],
        rows: 3,
        prefilled: [
          ['38.0', null, null],
          ['44.0', null, null],
          ['41.0', null, null],
        ],
        expectedTableValues: [
          ['38.0', '-3.0', '9.0'],
          ['44.0', '3.0', '9.0'],
          ['41.0', '0.0', '0.0'],
        ],
      },
      {
        label: 'IV Level 1 — Variance',
        type: 'number',
        subLabel: 'Sum of squared deviations ÷ (n − 1)',
        expectedAnswer: 9.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — Variance Units',
        type: 'short-answer',
        subLabel:
          'What are the units of variance? Think about what happens when you square the original units.',
        inline: true,
      },
      {
        label: 'IV Level 1 — Standard Deviation',
        type: 'number',
        subLabel: 'Square root of the variance',
        expectedAnswer: 3.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 1 — Standard Deviation Units',
        type: 'short-answer',
        subLabel: 'What are the units of standard deviation?',
        inline: true,
      },

      // ── IV Level 2 (30° ramp): 75.0, 84.0, 78.0 ──
      {
        label: 'IV Level 2 — Mean (30° ramp)',
        type: 'number',
        subLabel: 'Add the three data values and divide by 3',
        expectedAnswer: 79.0,
        tolerance: 0.05,
      },
      {
        label: 'IV Level 2 — Deviations Table (30° ramp)',
        type: 'table',
        subLabel: 'Deviation = data value − mean',
        columns: ['Data Value (cm)', 'Deviation from Mean (cm)', 'Squared Deviation (cm²)'],
        rows: 3,
        prefilled: [
          ['75.0', null, null],
          ['84.0', null, null],
          ['78.0', null, null],
        ],
        expectedTableValues: [
          ['75.0', '-4.0', '16.0'],
          ['84.0', '5.0', '25.0'],
          ['78.0', '-1.0', '1.0'],
        ],
      },
      {
        label: 'IV Level 2 — Variance',
        type: 'number',
        subLabel: 'Sum of squared deviations ÷ (n − 1)',
        expectedAnswer: 21.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — Variance Units',
        type: 'short-answer',
        subLabel: 'What are the units of variance?',
        inline: true,
      },
      {
        label: 'IV Level 2 — Standard Deviation',
        type: 'number',
        subLabel: 'Square root of the variance',
        expectedAnswer: 4.6,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 2 — Standard Deviation Units',
        type: 'short-answer',
        subLabel: 'What are the units of standard deviation?',
        inline: true,
      },

      // ── IV Level 3 (45° ramp): 102.0, 114.0, 108.0 ──
      {
        label: 'IV Level 3 — Mean (45° ramp)',
        type: 'number',
        subLabel: 'Add the three data values and divide by 3',
        expectedAnswer: 108.0,
        tolerance: 0.05,
      },
      {
        label: 'IV Level 3 — Deviations Table (45° ramp)',
        type: 'table',
        subLabel: 'Deviation = data value − mean',
        columns: ['Data Value (cm)', 'Deviation from Mean (cm)', 'Squared Deviation (cm²)'],
        rows: 3,
        prefilled: [
          ['102.0', null, null],
          ['114.0', null, null],
          ['108.0', null, null],
        ],
        expectedTableValues: [
          ['102.0', '-6.0', '36.0'],
          ['114.0', '6.0', '36.0'],
          ['108.0', '0.0', '0.0'],
        ],
      },
      {
        label: 'IV Level 3 — Variance',
        type: 'number',
        subLabel: 'Sum of squared deviations ÷ (n − 1)',
        expectedAnswer: 36.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — Variance Units',
        type: 'short-answer',
        subLabel: 'What are the units of variance?',
        inline: true,
      },
      {
        label: 'IV Level 3 — Standard Deviation',
        type: 'number',
        subLabel: 'Square root of the variance',
        expectedAnswer: 6.0,
        tolerance: 0.1,
      },
      {
        label: 'IV Level 3 — Standard Deviation Units',
        type: 'short-answer',
        subLabel: 'What are the units of standard deviation?',
        inline: true,
      },
    ],
    dueDate: '2026-03-25',
    createdAt: '2026-03-19',
  },
  {
    id: 'task-001-experiment-brainstorm',
    title: 'Experiment Design Challenge',
    promptFile: 'tasks/task-001-experiment-brainstorm.md',
    prompts: [
      {
        label: 'Prompt 1 — Velocity',
        type: 'text',
        subLabel: 'Include your statement of problem, hypothesis, IV, DV, and procedure',
      },
      {
        label: 'Prompt 2 — Reaction Time',
        type: 'text',
        subLabel: 'Include your statement of problem, hypothesis, IV, DV, and procedure',
      },
    ],
    dueDate: '2026-03-25',
    createdAt: '2026-03-18',
  },
];

export function getTaskDefinition(taskId: string): TaskDefinition | undefined {
  return TASK_DEFINITIONS.find((t) => t.id === taskId);
}
