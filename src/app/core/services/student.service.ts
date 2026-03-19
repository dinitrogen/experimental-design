import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Firestore,
  Timestamp,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppUser } from '../models/user.model';
import { ReadingProgress } from '../models/resource.model';
import { ReportSubmission } from '../models/submission.model';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly firestore = inject(Firestore);
  private readonly http = inject(HttpClient);

  /** Get all students from Firestore */
  async getAllStudents(): Promise<AppUser[]> {
    const usersCol = collection(this.firestore, 'users');
    const q = query(usersCol, where('role', '==', 'student'));
    const snapshot = await getDocs(q);
    const students = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data['email'] ?? '',
        displayName: data['displayName'] ?? '',
        role: data['role'] ?? 'student',
        createdAt: data['createdAt'],
        middleSchool: data['middleSchool'] ?? undefined,
        grade: data['grade'] ?? undefined,
        excludeFromRoster: data['excludeFromRoster'] ?? false,
      } as AppUser;
    });
    return students.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  /** Get all coaches from Firestore */
  async getAllCoaches(): Promise<AppUser[]> {
    const usersCol = collection(this.firestore, 'users');
    const q = query(usersCol, where('role', '==', 'coach'));
    const snapshot = await getDocs(q);
    const coaches = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data['email'] ?? '',
        displayName: data['displayName'] ?? '',
        role: data['role'] ?? 'coach',
        createdAt: data['createdAt'],
        middleSchool: data['middleSchool'] ?? undefined,
        grade: data['grade'] ?? undefined,
        excludeFromRoster: data['excludeFromRoster'] ?? false,
      } as AppUser;
    });
    return coaches.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  /**
   * Update an existing student's profile fields.
   */
  async updateStudent(
    uid: string,
    data: { displayName?: string; middleSchool?: string; grade?: number; excludeFromRoster?: boolean },
  ): Promise<void> {
    const update: Record<string, unknown> = {};
    if (data.displayName !== undefined) update['displayName'] = data.displayName;
    if (data.middleSchool !== undefined) update['middleSchool'] = data.middleSchool;
    if (data.grade !== undefined) update['grade'] = data.grade;
    if (data.excludeFromRoster !== undefined) update['excludeFromRoster'] = data.excludeFromRoster;
    await updateDoc(doc(this.firestore, `users/${uid}`), update);
  }

  /**
   * Create a new student account via Firebase Auth REST API
   * (avoids signing out the current coach session).
   */
  async createStudent(
    email: string,
    password: string,
    displayName: string,
    middleSchool?: string,
    grade?: number,
  ): Promise<AppUser> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebase.apiKey}`;
    const result = await firstValueFrom(
      this.http.post<{ localId: string; email: string }>(url, {
        email,
        password,
        returnSecureToken: false,
      })
    );

    const newUser: AppUser = {
      uid: result.localId,
      email: result.email,
      displayName,
      role: 'student',
      createdAt: Timestamp.now(),
      middleSchool: middleSchool || undefined,
      grade: grade || undefined,
    };

    const userData: Record<string, unknown> = {
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
    if (middleSchool) userData['middleSchool'] = middleSchool;
    if (grade) userData['grade'] = grade;
    await setDoc(doc(this.firestore, `users/${newUser.uid}`), userData);

    return newUser;
  }

  /** Delete a student's Firestore user doc (does not delete Auth account) */
  async removeStudent(uid: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `users/${uid}`));
  }

  /** Reset a student's reading progress for a specific guide */
  async resetStudentProgress(uid: string, resourceId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `progress/${uid}/items/${resourceId}`));
  }

  /** Get a student's reading progress */
  async getStudentProgress(uid: string): Promise<ReadingProgress[]> {
    const progressCol = collection(this.firestore, `progress/${uid}/items`);
    const snapshot = await getDocs(progressCol);
    return snapshot.docs.map((d) => d.data() as ReadingProgress);
  }

  /** Get all submissions for a specific student */
  async getStudentSubmissions(uid: string): Promise<ReportSubmission[]> {
    const submissionsCol = collection(this.firestore, 'submissions');
    const q = query(submissionsCol, where('studentUid', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ReportSubmission);
  }
}
