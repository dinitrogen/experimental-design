import type { TaskDefinition } from '../models/task.model';
import { TASK_017, TASK_018, TASK_019 } from './report-sections-a-e';
import { TASK_020, TASK_021 } from './report-sections-g-i';
import { TASK_022 } from './task-022-report-sections-k-l-cer';
import { TASK_016 } from './task-016-improvements-salt-ice';
import { TASK_015 } from './task-015-qual-obs-baking-soda';
import { TASK_014 } from './task-014-error-analysis';
import { TASK_013 } from './task-013-stats-catapult';
import { TASK_012 } from './task-012-cer-helicopter';
import { TASK_011 } from './task-011-quick-design-states';
import { TASK_010 } from './task-010-full-statistics';
import { TASK_009 } from './task-009-cer-dissolving';
import { TASK_008 } from './task-008-cer-practice';
import { TASK_007 } from './task-007-quick-design';
import { TASK_006 } from './task-006-qual-obs-applications-alt';
import { TASK_005 } from './task-005-qual-obs-applications';
import { TASK_004 } from './task-004-variation-cer';
import { TASK_003 } from './task-003-outlier-detection';
import { TASK_002 } from './task-002-variance-stddev';
import { TASK_001 } from './task-001-experiment-brainstorm';

export const TASK_DEFINITIONS: TaskDefinition[] = [
  TASK_021,
  TASK_022,
  TASK_020,
  TASK_019,
  TASK_018,
  TASK_017,
  TASK_016,
  TASK_015,
  TASK_014,
  TASK_013,
  TASK_012,
  TASK_011,
  TASK_010,
  TASK_009,
  TASK_008,
  TASK_007,
  TASK_006,
  TASK_005,
  TASK_004,
  TASK_003,
  TASK_002,
  TASK_001,
];

export function getTaskDefinition(taskId: string): TaskDefinition | undefined {
  return TASK_DEFINITIONS.find((task) => task.id === taskId);
}
