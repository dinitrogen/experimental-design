import type { TaskDefinition } from '../models/task.model';

export const TASK_006: TaskDefinition = {
  id: 'task-006-qual-obs-applications-alt',
  archived: true,
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
};
