import type { TaskDefinition } from '../models/task.model';

export const TASK_004: TaskDefinition = {
  id: 'task-004-variation-cer',
  archived: true,
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
};
