import { Timestamp } from '@angular/fire/firestore';

export type UserRole = 'coach' | 'student';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
  middleSchool?: string;
  grade?: number;
  excludeFromRoster?: boolean;
  passwordChanged?: boolean;
}
