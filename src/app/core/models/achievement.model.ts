import { Timestamp } from '@angular/fire/firestore';

export interface AchievementTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  /**
   * 'auto' achievements are checked against live data; 'manual' require coach to mark complete;
   * 'system' are awarded by the server (e.g. season rollover) and never assigned by hand.
   */
  type: 'auto' | 'manual' | 'system';
}

export interface Achievement {
  id?: string;
  studentUid: string;
  templateId: string;
  assignedBy: string;
  assignedAt: Timestamp;
  completed: boolean;
  completedAt: Timestamp | null;
  /** Season this assignment belongs to. Untagged docs predate season tagging. */
  seasonId?: string;
}

/** Season tag for achievements from before a real season ID existed. */
export const EARLIER_SEASON_ID = 'earlier';

/** True when the assignment belongs to the active season (everything counts before the first season exists). */
export function isInSeason(ach: Pick<Achievement, 'seasonId'>, activeSeasonId: string | null): boolean {
  return !activeSeasonId || ach.seasonId === activeSeasonId;
}

export function seasonLabel(seasonId: string): string {
  return seasonId === EARLIER_SEASON_ID ? 'Earlier' : seasonId;
}

export const ACHIEVEMENT_TEMPLATES: AchievementTemplate[] = [
  {
    id: 'first-login',
    title: 'Welcome Aboard',
    description: 'Log into the XD Lab app for the first time.',
    icon: 'login',
    type: 'auto',
  },
  {
    id: 'login-streak-3',
    title: 'Hat Trick',
    description: 'Log in for 3 consecutive days.',
    icon: 'local_fire_department',
    type: 'auto',
  },
  {
    id: 'login-streak-7',
    title: 'Aura Farming',
    description: 'Log in for 7 consecutive days.',
    icon: 'whatshot',
    type: 'auto',
  },
  {
    id: 'complete-first-task',
    title: 'Task Rookie',
    description: 'Complete and submit your first task.',
    icon: 'task_alt',
    type: 'auto',
  },
  {
    id: 'complete-three-tasks',
    title: 'Task Master',
    description: 'Complete and submit 3 tasks.',
    icon: 'military_tech',
    type: 'auto',
  },
  {
    id: 'review-all-guides',
    title: 'Study Guide Scholar',
    description: 'Read and complete all study guides.',
    icon: 'menu_book',
    type: 'auto',
  },
  {
    id: 'complete-parachute-drop',
    title: 'Parachute Drop',
    description: 'Complete and submit the Parachute Drop practice event.',
    icon: 'paragliding',
    type: 'auto',
  },
  {
    id: 'complete-sugar-solubility',
    title: 'Sugar Solubility',
    description: 'Complete and submit the Sugar Solubility practice event.',
    icon: 'science',
    type: 'auto',
  },
  {
    id: 'returning-member',
    title: 'Returning Member',
    description: 'Came back for a new season of Experimental Design.',
    icon: 'replay',
    type: 'system',
  },
];

const TEMPLATE_ORDER = new Map(ACHIEVEMENT_TEMPLATES.map((t, i) => [t.id, i]));

// Newest season first; earlier seasons sort below any named season, untagged docs last.
function seasonSortKey(seasonId: string | undefined): string {
  if (seasonId === undefined) return '';
  return seasonId === EARLIER_SEASON_ID ? '0' : seasonId;
}

export function sortAchievements<T extends { templateId: string; seasonId?: string }>(achievements: T[]): T[] {
  return [...achievements].sort(
    (a, b) =>
      (TEMPLATE_ORDER.get(a.templateId) ?? 999) - (TEMPLATE_ORDER.get(b.templateId) ?? 999) ||
      seasonSortKey(b.seasonId).localeCompare(seasonSortKey(a.seasonId))
  );
}

export function getTemplate(templateId: string): AchievementTemplate | undefined {
  return ACHIEVEMENT_TEMPLATES.find((t) => t.id === templateId);
}
