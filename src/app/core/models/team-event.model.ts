import { Timestamp } from '@angular/fire/firestore';

/** A report section with its point value for the team roles planner */
export interface RoleSection {
  section: string;
  points: number;
}

/** The standard ExD report sections used in the team roles planner */
export const ROLE_SECTIONS: RoleSection[] = [
  { section: 'Problem Statement', points: 2 },
  { section: 'Hypothesis', points: 6 },
  { section: 'Variables', points: 15 },
  { section: 'Materials', points: 4 },
  { section: 'Procedure & Diagrams', points: 13 },
  { section: 'Running Trials', points: 0 },
  { section: 'Qualitative Observations', points: 6 },
  { section: 'Quantitative Data Table', points: 5 },
  { section: 'Graph', points: 12 },
  { section: 'Statistics', points: 11 },
  { section: 'Experimental Error', points: 6 },
  { section: 'CER — Data Trend/Outliers/Variation', points: 18 },
  { section: 'Conclusion', points: 8 },
  { section: 'Applications & Recommendations', points: 12 },
];

/** Assignments for who handles which section: section -> member UID */
export type RoleAssignments = Record<string, string>;

/** A 3-person team within an event */
export interface EventTeam {
  schoolName: string;
  teamName?: string;
  memberUids: string[]; // 3 student UIDs
  roleAssignments?: RoleAssignments;
}

/** Top-level event containing 1+ teams */
export interface TeamEvent {
  id?: string;
  title: string;
  location?: string;
  eventDate?: string;
  teams: EventTeam[];
  alternateUids?: string[];
  createdAt: Timestamp;
}
