import type { TaskDefinition } from '../models/task.model';

export const TASK_013: TaskDefinition = {
  id: 'task-013-stats-catapult',
  archived: true,
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
};
