import { Timestamp } from '@angular/fire/firestore';

export type UserRole = 'coach' | 'student';

/** Missing status means active. Archived accounts are also disabled in Firebase Auth. */
export type UserStatus = 'active' | 'archived';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  middleSchool?: string;
  grade?: number;
  excludeFromRoster?: boolean;
  passwordChanged?: boolean;
  status?: UserStatus;
  archivedAt?: Timestamp;
  /** Season IDs this student was enrolled in. Populated by the season rollover. */
  enrolledSeasons?: string[];
}
