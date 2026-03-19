import { Timestamp } from '@angular/fire/firestore';

export type ResourceCategory =
  | 'cer-writing'
  | 'statistics'
  | 'team-strategy'
  | 'applications'
  | 'practice-events';

export interface Resource {
  id: string;
  title: string;
  slug: string;
  category: ResourceCategory;
  order: number;
  summary: string;
  fileName: string;
  coachOnly: boolean;
}

export interface ReadingProgress {
  resourceId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt: Timestamp | null;
}
