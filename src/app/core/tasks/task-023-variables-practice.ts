import type { TaskDefinition, TaskPrompt } from '../models/task.model';

function variablesPrompts(sectionHeader: string): TaskPrompt[] {
  return [
    {
      sectionHeader,
      label: 'Independent Variable (IV)',
      subLabel: 'Define what you change, and explain the tools and method used to change or measure it.',
      type: 'table',
      columns: ['Define', 'Tools & operationally defined'],
      rows: 1,
      tableCellTextRows: 3,
    },
    {
      label: 'IV Levels',
      subLabel: 'Choose three specific levels of your independent variable. Include units where appropriate.',
      type: 'table',
      columns: ['Level 1', 'Level 2', 'Level 3'],
      rows: 1,
      tableCellTextRows: 2,
    },
    {
      label: 'Dependent Variable (DV)',
      subLabel: 'Define what you measure, and explain the tools and method used to measure it.',
      type: 'table',
      columns: ['Define', 'Tools & operationally defined'],
      rows: 1,
      tableCellTextRows: 3,
    },
    {
      label: 'Controlled Variables (CV)',
      subLabel: 'Identify three variables to keep the same and describe how you would keep each constant.',
      type: 'table',
      columns: ['Define and describe how it is kept constant'],
      rows: 3,
      tableCellTextRows: 2,
    },
  ];
}

export const TASK_023: TaskDefinition = {
  id: 'task-023-variables-practice',
  title: 'Report Writing Practice: Variables',
  sectionInstructions: {
    'Question 1 — Water Absorption': `**Topic:** Water absorption

How does the number of layers of paper towel affect the volume of water absorbed?

**Materials:** Identical paper towels, scissors, water, a graduated cylinder, and a tray.

Use the materials to plan how to change the number of layers and measure the volume of water absorbed. Complete the variables tables below.`,
    'Question 2 — Magnetism': `**Topic:** Magnetism

How does the distance between a magnet and paper clips affect the number of paper clips attracted?

**Materials:** A magnet, identical paper clips, a ruler, and a nonmagnetic surface.

Plan to hold the magnet at each chosen distance above the paper clips and count the clips attracted. Complete the variables tables below.`,
    'Question 3 — Paper Bridge': `**Topic:** Paper bridge strength

How does the number of paper layers affect the number of coins a paper bridge can hold before it collapses?

**Materials:** Identical sheets of paper, identical coins, two supports, and a ruler.

Plan to place coins on a bridge made from paper spanning the supports. Complete the variables tables below.`,
  },
  prompts: [
    ...variablesPrompts('Question 1 — Water Absorption'),
    ...variablesPrompts('Question 2 — Magnetism'),
    ...variablesPrompts('Question 3 — Paper Bridge'),
  ],
  dueDate: '',
  createdAt: '2026-11-09',
};
