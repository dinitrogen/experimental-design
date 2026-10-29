import type { TaskDefinition } from '../models/task.model';

export const TASK_015: TaskDefinition = {
  id: 'task-015-qual-obs-baking-soda',
  archived: true,
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
};
