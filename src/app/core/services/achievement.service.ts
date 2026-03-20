import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { ProgressService } from './progress.service';
import { SubmissionService } from './submission.service';
import { TaskService } from './task.service';
import { ResourceService } from './resource.service';
import { Achievement, getTemplate } from '../models/achievement.model';

@Injectable({ providedIn: 'root' })
export class AchievementService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly progressService = inject(ProgressService);
  private readonly submissionService = inject(SubmissionService);
  private readonly taskService = inject(TaskService);
  private readonly resourceService = inject(ResourceService);

  /** Record today's login for the current user */
  async recordLogin(): Promise<void> {
    const uid = this.authService.user()?.uid;
    if (!uid) return;
    const today = new Date().toISOString().slice(0, 10);
    const ref = doc(this.firestore, `loginHistory/${uid}`);
    const snap = await getDoc(ref);
    const dates: string[] = snap.exists() ? (snap.data()['dates'] ?? []) : [];
    if (dates[dates.length - 1] === today) return;
    dates.push(today);
    // Keep only last 30 entries
    const trimmed = dates.slice(-30);
    await setDoc(ref, { dates: trimmed }, { merge: true });
  }

  /** Get all achievements for the current student */
  async getMyAchievements(): Promise<Achievement[]> {
    const uid = this.authService.user()?.uid;
    if (!uid) return [];
    return this.getAchievementsForStudent(uid);
  }

  /** Get all achievements for a specific student (coach use) */
  async getAchievementsForStudent(uid: string): Promise<Achievement[]> {
    const col = collection(this.firestore, 'achievements');
    const q = query(col, where('studentUid', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Achievement);
  }

  /** Get all achievements across all students (single query) */
  async getAllAchievements(): Promise<Achievement[]> {
    const snapshot = await getDocs(collection(this.firestore, 'achievements'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Achievement);
  }

  /** Assign an achievement to a student */
  async assign(studentUid: string, templateId: string): Promise<void> {
    const coach = this.authService.user();
    if (!coach) return;
    const docRef = doc(collection(this.firestore, 'achievements'));
    const achievement: Achievement = {
      studentUid,
      templateId,
      assignedBy: coach.uid,
      assignedAt: Timestamp.now(),
      completed: false,
      completedAt: null,
    };
    await setDoc(docRef, achievement);
  }

  /** Remove an achievement assignment */
  async remove(achievementId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `achievements/${achievementId}`));
  }

  /** Check and update auto-completion status for a student's achievements */
  async refreshAutoCompletions(achievements: Achievement[]): Promise<Achievement[]> {
    const updated: Achievement[] = [];

    for (const ach of achievements) {
      if (ach.completed) {
        updated.push(ach);
        continue;
      }
      const template = getTemplate(ach.templateId);
      if (!template || template.type !== 'auto') {
        updated.push(ach);
        continue;
      }

      const nowComplete = await this.checkAutoCompletion(ach.templateId, ach.studentUid);
      if (nowComplete && ach.id) {
        const completedAt = Timestamp.now();
        await updateDoc(doc(this.firestore, `achievements/${ach.id}`), {
          completed: true,
          completedAt,
        });
        updated.push({ ...ach, completed: true, completedAt });
      } else {
        updated.push(ach);
      }
    }

    return updated;
  }

  private async checkAutoCompletion(templateId: string, studentUid: string): Promise<boolean> {
    switch (templateId) {
      case 'first-login':
        return true;
      case 'login-streak-3':
      case 'login-streak-7': {
        const streakNeeded = templateId === 'login-streak-7' ? 7 : 3;
        const ref = doc(this.firestore, `loginHistory/${studentUid}`);
        const snap = await getDoc(ref);
        if (!snap.exists()) return false;
        const dates: string[] = snap.data()['dates'] ?? [];
        if (dates.length < streakNeeded) return false;
        const lastN = dates.slice(-streakNeeded);
        for (let i = 1; i < streakNeeded; i++) {
          const prev = new Date(lastN[i - 1]);
          const curr = new Date(lastN[i]);
          const diff = (curr.getTime() - prev.getTime()) / 86400000;
          if (Math.round(diff) !== 1) return false;
        }
        return true;
      }
      case 'review-all-guides': {
        const totalGuides = this.resourceService.getTotalCount(false);
        const completed = await this.progressService.getCompletedCount();
        return completed >= totalGuides;
      }
      case 'complete-parachute-drop': {
        const subs = await this.submissionService.getSubmissionsForStudent(studentUid);
        return subs.some(
          (s) => s.practiceEventId === 'practice-parachute-drop' && s.status !== 'draft',
        );
      }
      case 'complete-sugar-solubility': {
        const subs = await this.submissionService.getSubmissionsForStudent(studentUid);
        return subs.some(
          (s) => s.practiceEventId === 'practice-sugar-solubility' && s.status !== 'draft',
        );
      }
      case 'complete-first-task': {
        const count = await this.taskService.getCompletedTaskCount(studentUid);
        return count >= 1;
      }
      case 'complete-three-tasks': {
        const count = await this.taskService.getCompletedTaskCount(studentUid);
        return count >= 3;
      }
      default:
        return false;
    }
  }
}
