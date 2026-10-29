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
  createInitialTaskResponse,
  TaskDefinition,
  TaskSubmission,
  PromptGrade,
} from '../models/task.model';
import { TASK_DEFINITIONS, getTaskDefinition } from '../tasks/task-registry';

export interface TaskAssignment {
  type: 'all' | 'individual';
  studentUids: string[];
  /** YYYY-MM-DD. When absent, the task definition's default due date is used. */
  dueDate?: string;
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

  /** Effective due date: the assignment's date if set, otherwise the definition's default */
  getDueDate(taskId: string): string | undefined {
    return this.assignments()[taskId]?.dueDate || getTaskDefinition(taskId)?.dueDate || undefined;
  }

  /** Get task definitions assigned to the current student */
  getAssignedTasks(): TaskDefinition[] {
    const uid = this.authService.user()?.uid;
    if (!uid) return [];
    return this.getAllTasks().filter((t) => this.isAssignedTo(t.id, uid));
  }

  /** Coach: assign a task to all students, optionally with a due date (YYYY-MM-DD) */
  async assignToAll(taskId: string, dueDate?: string): Promise<void> {
    const current = { ...this.assignments() };
    current[taskId] = this.buildAssignment({ type: 'all', studentUids: [] }, dueDate);
    this.assignments.set(current);
    await setDoc(doc(this.firestore, 'settings/taskAssignments'), current);
  }

  /** Coach: assign a task to specific students, optionally with a due date (YYYY-MM-DD) */
  async assignToStudents(taskId: string, studentUids: string[], dueDate?: string): Promise<void> {
    const current = { ...this.assignments() };
    current[taskId] = this.buildAssignment({ type: 'individual', studentUids }, dueDate);
    this.assignments.set(current);
    await setDoc(doc(this.firestore, 'settings/taskAssignments'), current);
  }

  /** Omits dueDate entirely when unset, since Firestore rejects undefined values */
  private buildAssignment(
    base: Omit<TaskAssignment, 'dueDate'>,
    dueDate: string | undefined
  ): TaskAssignment {
    return dueDate ? { ...base, dueDate } : base;
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
    const responses = prompts.map(createInitialTaskResponse);
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
  async saveTaskReview(
    submissionId: string,
    feedback: string,
    promptGrades?: PromptGrade[],
  ): Promise<void> {
    const docRef = doc(this.firestore, `taskSubmissions/${submissionId}`);
    const data: Record<string, unknown> = {
      coachFeedback: feedback,
      status: 'reviewed',
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    if (promptGrades) {
      data['promptGrades'] = promptGrades.map((g) =>
        g.comment != null ? { correct: g.correct, comment: g.comment } : { correct: g.correct }
      );
    }
    await updateDoc(docRef, data);
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
