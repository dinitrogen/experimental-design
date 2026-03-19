import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import {
  TASK_DEFINITIONS,
  TaskDefinition,
  TaskSubmission,
  getTaskDefinition,
} from '../models/task.model';

export interface TaskAssignment {
  type: 'all' | 'individual';
  studentUids: string[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  readonly assignments = signal<Record<string, TaskAssignment>>({});

  /** Get all task definitions, newest first */
  getAllTasks(): TaskDefinition[] {
    return [...TASK_DEFINITIONS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /** Get a single task definition by ID */
  getTask(taskId: string): TaskDefinition | undefined {
    return getTaskDefinition(taskId);
  }

  /** Load task assignments from Firestore */
  async loadAssignments(): Promise<void> {
    const snap = await getDoc(doc(this.firestore, 'settings/taskAssignments'));
    if (snap.exists()) {
      this.assignments.set(snap.data() as Record<string, TaskAssignment>);
    }
  }

  /** Check if a task is assigned to a specific student */
  isAssignedTo(taskId: string, studentUid: string): boolean {
    const assignment = this.assignments()[taskId];
    if (!assignment) return false;
    return assignment.type === 'all' || assignment.studentUids.includes(studentUid);
  }

  /** Get task definitions assigned to the current student */
  getAssignedTasks(): TaskDefinition[] {
    const uid = this.authService.user()?.uid;
    if (!uid) return [];
    return this.getAllTasks().filter((t) => this.isAssignedTo(t.id, uid));
  }

  /** Coach: assign a task to all students */
  async assignToAll(taskId: string): Promise<void> {
    const current = { ...this.assignments() };
    current[taskId] = { type: 'all', studentUids: [] };
    this.assignments.set(current);
    await setDoc(doc(this.firestore, 'settings/taskAssignments'), current);
  }

  /** Coach: assign a task to specific students */
  async assignToStudents(taskId: string, studentUids: string[]): Promise<void> {
    const current = { ...this.assignments() };
    current[taskId] = { type: 'individual', studentUids };
    this.assignments.set(current);
    await setDoc(doc(this.firestore, 'settings/taskAssignments'), current);
  }

  /** Coach: unassign a task (remove from everyone) */
  async unassignTask(taskId: string): Promise<void> {
    const current = { ...this.assignments() };
    delete current[taskId];
    this.assignments.set(current);
    await setDoc(doc(this.firestore, 'settings/taskAssignments'), current);
  }

  /** Get all task submissions for the current student */
  async getMyTaskSubmissions(): Promise<TaskSubmission[]> {
    const uid = this.authService.user()?.uid;
    if (!uid) return [];
    return this.getTaskSubmissionsForStudent(uid);
  }

  /** Get all task submissions for a specific student */
  async getTaskSubmissionsForStudent(uid: string): Promise<TaskSubmission[]> {
    const col = collection(this.firestore, 'taskSubmissions');
    const q = query(col, where('studentUid', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskSubmission);
  }

  /** Get or create a task submission for the current user */
  async getOrCreateTaskSubmission(taskId: string): Promise<TaskSubmission> {
    const user = this.authService.user();
    if (!user) throw new Error('Not authenticated');

    const col = collection(this.firestore, 'taskSubmissions');
    const q = query(
      col,
      where('studentUid', '==', user.uid),
      where('taskId', '==', taskId),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as TaskSubmission;
    }

    const task = getTaskDefinition(taskId);
    const prompts = task?.prompts ?? [];
    const newDoc = doc(col);
    const responses = prompts.map((p) => {
      if (p.type === 'table') {
        const rows = p.rows ?? 1;
        const cols = p.columns?.length ?? 1;
        const emptyTable = Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => p.prefilled?.[r]?.[c] ?? '')
        );
        return JSON.stringify(emptyTable);
      }
      return '';
    });
    const submission: TaskSubmission = {
      taskId,
      studentUid: user.uid,
      studentDisplayName: user.displayName ?? undefined,
      status: 'in-progress',
      responses,
      coachFeedback: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      submittedAt: null,
      reviewedAt: null,
    };
    await setDoc(newDoc, submission);
    return { id: newDoc.id, ...submission };
  }

  /** Save draft responses */
  async saveDraft(submissionId: string, responses: string[]): Promise<void> {
    const docRef = doc(this.firestore, `taskSubmissions/${submissionId}`);
    await updateDoc(docRef, {
      responses,
      updatedAt: Timestamp.now(),
    });
  }

  /** Submit the task for coach review */
  async submit(submissionId: string, responses: string[]): Promise<void> {
    const docRef = doc(this.firestore, `taskSubmissions/${submissionId}`);
    await updateDoc(docRef, {
      responses,
      status: 'submitted',
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  /** Coach: get all submitted task submissions */
  async getAllSubmittedTasks(): Promise<TaskSubmission[]> {
    const col = collection(this.firestore, 'taskSubmissions');
    const q = query(col, where('status', 'in', ['submitted', 'reviewed']));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskSubmission);
    return results.sort(
      (a, b) => (b.submittedAt?.toMillis() ?? 0) - (a.submittedAt?.toMillis() ?? 0)
    );
  }

  /** Coach: save feedback for a task submission */
  async saveTaskReview(submissionId: string, feedback: string): Promise<void> {
    const docRef = doc(this.firestore, `taskSubmissions/${submissionId}`);
    await updateDoc(docRef, {
      coachFeedback: feedback,
      status: 'reviewed',
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  /** Coach: delete a task submission (resets the task for the student) */
  async deleteTaskSubmission(submissionId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `taskSubmissions/${submissionId}`));
  }

  /** Count completed (submitted or reviewed) tasks for a student */
  async getCompletedTaskCount(uid: string): Promise<number> {
    const subs = await this.getTaskSubmissionsForStudent(uid);
    return subs.filter((s) => s.status === 'submitted' || s.status === 'reviewed').length;
  }
}
