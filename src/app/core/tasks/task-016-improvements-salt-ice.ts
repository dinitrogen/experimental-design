import type { TaskDefinition } from '../models/task.model';

export const TASK_016: TaskDefinition = {
  id: 'task-016-improvements-salt-ice',
  archived: true,
  title: 'Improvements, Applications & Recommendations: Salt and Ice Melting',
  promptFile: 'tasks/task-016-improvements-salt-ice.md',
  prompts: [
    {
      label: 'Improvements',
      type: 'text',
      subLabel:
        'What specific changes could make this experiment more accurate or reliable? List at least 3–4.',
    },
    {
      label: 'Applications',
      type: 'text',
      subLabel: 'How could these findings be useful in the real world? List at least 3–4.',
    },
    {
      label: 'Recommendations for Future Experiments',
      type: 'text',
      subLabel: 'What follow-up experiments could extend these findings? Suggest at least 3–4.',
    },
  ],
  dueDate: '',
  createdAt: '2026-04-16',
};
