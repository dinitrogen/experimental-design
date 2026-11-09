import type { TaskDefinition, TaskPrompt } from '../models/task.model';

function variablesPrompts(sectionHeader: string): TaskPrompt[] {
  return [
    {
      sectionHeader,
      label: 'Independent Variable (IV)',
      type: 'table',
      columns: ['Define', 'Tools & operationally defined'],
      rows: 1,
      tableCellTextRows: 3,
    },
    {
      label: 'IV Levels',
      type: 'table',
      columns: ['Level 1', 'Level 2', 'Level 3'],
      rows: 1,
      tableCellTextRows: 2,
    },
    {
      label: 'Dependent Variable (DV)',
      type: 'table',
      columns: ['Define', 'Tools & operationally defined'],
      rows: 1,
      tableCellTextRows: 3,
    },
    {
      label: 'Controlled Variables (CV)',
      type: 'table',
      columns: ['Define'],
      rows: 3,
      tableCellTextRows: 2,
    },
  ];
}

export const TASK_023: TaskDefinition = {
  id: 'task-023-variables-practice',
  title: 'Report Writing Practice: Variables',
  responseHeading:
    'For each topic and materials list, come up with the variables that would make a strong experiment.',
  sectionInstructions: {
    'Topic 1 — Water Absorption': [
      '**Topic:** Water absorption',
      '',
      '**Materials (must use at least 2):**',
      '- Paper towels',
      '- Scissors',
      '- Water',
      '- Graduated cylinder (a marked container used to measure liquid volume)',
      '- Tray',
      '- Stopwatch',
      '- Balance',
    ].join('\n'),
    'Topic 2 — Magnetism': [
      '**Topic:** Magnetism',
      '',
      '**Materials (must use at least 2):**',
      '- Magnet',
      '- Paper clips',
      '- Ruler',
      '- Nonmagnetic surface',
      '- Masking tape',
      '- Compass',
    ].join('\n'),
    'Topic 3 — Paper Bridge': [
      '**Topic:** Paper bridge strength',
      '',
      '**Materials (must use at least 2):**',
      '- Sheets of paper',
      '- Coins',
      '- Two supports',
      '- Ruler',
      '- Cardboard',
      '- Binder clips',
    ].join('\n'),
  },
  prompts: [
    ...variablesPrompts('Topic 1 — Water Absorption'),
    ...variablesPrompts('Topic 2 — Magnetism'),
    ...variablesPrompts('Topic 3 — Paper Bridge'),
  ],
  dueDate: '',
  createdAt: '2026-11-09',
};
