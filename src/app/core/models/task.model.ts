import { Timestamp } from '@angular/fire/firestore';

export type PromptType = 'text' | 'number' | 'short-answer' | 'table';

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
  /** For 'table': number of data rows */
  rows?: number;
  /** For 'table': expected cell values (row-major) for auto-check. null = no check for that cell */
  expectedTableValues?: (string | null)[][];
  /** For 'table': pre-filled read-only cells (row-major). null = editable blank */
  prefilled?: (string | null)[][];
}

export interface TaskDefinition {
  id: string;
  title: string;
  /** Relative path to the markdown prompt file in public/ */
  promptFile: string;
  /** Ordered list of prompts/inputs the student must complete */
  prompts: TaskPrompt[];
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
  /** One entry per prompt. For 'table' prompts, the value is a JSON-stringified 2D array. */
  responses: string[];
  coachFeedback: string;
  /** Per-prompt grades set by the coach during review. Optional for backwards compatibility. */
  promptGrades?: PromptGrade[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt: Timestamp | null;
  reviewedAt: Timestamp | null;
}

/**
 * Static task registry. New tasks are added here.
 * Tasks are ordered newest-first for display.
 */
export const TASK_DEFINITIONS: TaskDefinition[] = [
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
        subLabel: 'What are the units of variance? Think about what happens when you square the original units.',
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
      { label: 'Prompt 1 — Velocity', type: 'text', subLabel: 'Include your statement of problem, hypothesis, IV, DV, and procedure' },
      { label: 'Prompt 2 — Reaction Time', type: 'text', subLabel: 'Include your statement of problem, hypothesis, IV, DV, and procedure' },
    ],
    dueDate: '2026-03-25',
    createdAt: '2026-03-18',
  },
];

export function getTaskDefinition(taskId: string): TaskDefinition | undefined {
  return TASK_DEFINITIONS.find((t) => t.id === taskId);
}
