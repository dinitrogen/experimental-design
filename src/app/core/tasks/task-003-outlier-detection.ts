import type { TaskDefinition } from '../models/task.model';

export const TASK_003: TaskDefinition = {
  id: 'task-003-outlier-detection',
  archived: true,
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
      subLabel: 'List all five data values in order from smallest to largest, separated by commas.',
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
};
