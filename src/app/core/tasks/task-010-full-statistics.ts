import type { TaskDefinition } from '../models/task.model';

export const TASK_010: TaskDefinition = {
  id: 'task-010-full-statistics',
  archived: true,
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
};
