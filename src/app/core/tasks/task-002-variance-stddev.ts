import type { TaskDefinition } from '../models/task.model';

export const TASK_002: TaskDefinition = {
  id: 'task-002-variance-stddev',
  archived: true,
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
};
