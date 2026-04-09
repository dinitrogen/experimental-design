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
  limit,
  onSnapshot,
  runTransaction,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import {
  ReportSubmission,
  SectionScores,
  SectionLock,
  createBlankSubmission,
  createBlankTeamSubmission,
} from '../models/submission.model';

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  /**
   * Gets the current user's draft for a practice event,
   * or creates a new blank one if none exists.
   */
  async getOrCreateDraft(practiceEventId: string): Promise<ReportSubmission> {
    const user = this.authService.user();
    if (!user) throw new Error('Not authenticated');

    // Look for an existing draft
    const submissionsCol = collection(this.firestore, 'submissions');
    const q = query(
      submissionsCol,
      where('studentUid', '==', user.uid),
      where('practiceEventId', '==', practiceEventId),
      where('status', '==', 'draft'),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as ReportSubmission;
    }

    // Create a new blank draft
    const newDoc = doc(submissionsCol);
    const blank = createBlankSubmission(user.uid, practiceEventId, user.displayName);
    await setDoc(newDoc, blank);
    return { id: newDoc.id, ...blank };
  }

  /** Check if a draft exists for this event (without creating one) */
  async hasDraft(practiceEventId: string): Promise<boolean> {
    const user = this.authService.user();
    if (!user) return false;

    const submissionsCol = collection(this.firestore, 'submissions');
    const q = query(
      submissionsCol,
      where('studentUid', '==', user.uid),
      where('practiceEventId', '==', practiceEventId),
      where('status', '==', 'draft'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  /** Reset a draft submission back to blank values (preserves the document) */
  async resetDraft(submissionId: string, practiceEventId: string): Promise<ReportSubmission> {
    const user = this.authService.user();
    if (!user) throw new Error('Not authenticated');

    const blank = createBlankSubmission(user.uid, practiceEventId, user.displayName);
    const submissionDoc = doc(this.firestore, `submissions/${submissionId}`);
    await updateDoc(submissionDoc, {
      ...blank,
      updatedAt: Timestamp.now(),
    });
    return { id: submissionId, ...blank };
  }

  /** Auto-save the current report data */
  async saveDraft(submissionId: string, data: Partial<ReportSubmission>): Promise<void> {
    const submissionDoc = doc(this.firestore, `submissions/${submissionId}`);
    await updateDoc(submissionDoc, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  /** Mark a report as submitted for coach review */
  async submit(submissionId: string): Promise<void> {
    const submissionDoc = doc(this.firestore, `submissions/${submissionId}`);
    await updateDoc(submissionDoc, {
      status: 'submitted',
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  /** Get a submission by ID */
  async getById(submissionId: string): Promise<ReportSubmission | null> {
    const submissionDoc = doc(this.firestore, `submissions/${submissionId}`);
    const snapshot = await getDoc(submissionDoc);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as ReportSubmission;
  }

  /** Get all submissions for a specific student (by UID) */
  async getSubmissionsForStudent(uid: string): Promise<ReportSubmission[]> {
    const submissionsCol = collection(this.firestore, 'submissions');
    const q = query(
      submissionsCol,
      where('studentUid', '==', uid)
    );
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ReportSubmission);
    return results.sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
  }

  /** Get all submissions for the current user (solo + team) */
  async getMySubmissions(): Promise<ReportSubmission[]> {
    const user = this.authService.user();
    if (!user) return [];

    const submissionsCol = collection(this.firestore, 'submissions');

    // Solo submissions
    const soloQ = query(submissionsCol, where('studentUid', '==', user.uid));
    const soloSnap = await getDocs(soloQ);
    const solo = soloSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReportSubmission);

    // Team submissions
    const teamQ = query(submissionsCol, where('teamMemberUids', 'array-contains', user.uid));
    const teamSnap = await getDocs(teamQ);
    const team = teamSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReportSubmission);

    // Merge and deduplicate by ID
    const byId = new Map<string, ReportSubmission>();
    for (const s of [...solo, ...team]) {
      if (s.id) byId.set(s.id, s);
    }
    return [...byId.values()].sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
  }

  /** Coach: get all submitted reports */
  async getAllSubmitted(): Promise<ReportSubmission[]> {
    const submissionsCol = collection(this.firestore, 'submissions');
    const q = query(
      submissionsCol,
      where('status', 'in', ['submitted', 'reviewed'])
    );
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ReportSubmission);
    return results.sort((a, b) => (b.submittedAt?.toMillis() ?? 0) - (a.submittedAt?.toMillis() ?? 0));
  }

  /** Coach: save feedback and score for a submission */
  async saveReview(submissionId: string, feedback: string, score: number | null, sectionScores?: SectionScores, isStateNational?: boolean): Promise<void> {
    const submissionDoc = doc(this.firestore, `submissions/${submissionId}`);
    await updateDoc(submissionDoc, {
      coachFeedback: feedback,
      score,
      isStateNational: isStateNational ?? false,
      ...(sectionScores ? { sectionScores } : {}),
      status: 'reviewed',
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  /** Coach: delete a submission entirely */
  async deleteSubmission(submissionId: string): Promise<void> {
    const submissionDoc = doc(this.firestore, `submissions/${submissionId}`);
    await deleteDoc(submissionDoc);
  }

  // ── Team mode methods ──────────────────────────────────────────────

  /** Create a shared team draft for a practice event */
  async createTeamDraft(teamMemberUids: string[], practiceEventId: string, teamMemberNames?: string[]): Promise<ReportSubmission> {
    const submissionsCol = collection(this.firestore, 'submissions');
    const newDoc = doc(submissionsCol);
    const blank = createBlankTeamSubmission(teamMemberUids, practiceEventId, teamMemberNames);
    await setDoc(newDoc, blank);
    return { id: newDoc.id, ...blank };
  }

  /** Check if a team draft exists for the current user + event */
  async getTeamDraft(practiceEventId: string): Promise<ReportSubmission | null> {
    const user = this.authService.user();
    if (!user) return null;

    const submissionsCol = collection(this.firestore, 'submissions');
    const q = query(
      submissionsCol,
      where('teamMemberUids', 'array-contains', user.uid),
      where('practiceEventId', '==', practiceEventId),
      where('status', '==', 'draft'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as ReportSubmission;
  }

  /** Coach: find a team draft for a specific event (any team) */
  async getTeamDraftsForEvent(practiceEventId: string): Promise<ReportSubmission[]> {
    const submissionsCol = collection(this.firestore, 'submissions');
    const q = query(
      submissionsCol,
      where('practiceEventId', '==', practiceEventId),
      where('status', '==', 'draft'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as ReportSubmission)
      .filter((s) => s.teamMemberUids && s.teamMemberUids.length > 0);
  }

  /** Atomically check out a section for the current user. Returns false if already locked by someone else. */
  async checkoutSection(submissionId: string, section: string): Promise<boolean> {
    const user = this.authService.user();
    if (!user) return false;

    const ref = doc(this.firestore, `submissions/${submissionId}`);
    return runTransaction(this.firestore, async (txn) => {
      const snap = await txn.get(ref);
      const data = snap.data();
      const locks: Record<string, SectionLock> = { ...(data?.['sectionLocks'] ?? {}) };

      // Already locked by someone else
      if (locks[section] && locks[section].lockedByUid !== user.uid) {
        return false;
      }

      locks[section] = {
        lockedByUid: user.uid,
        lockedByName: user.displayName,
        lockedAt: Timestamp.now(),
      };
      txn.update(ref, { sectionLocks: locks });
      return true;
    });
  }

  /** Release a section lock for the current user */
  async checkinSection(submissionId: string, section: string): Promise<void> {
    const user = this.authService.user();
    if (!user) return;

    const ref = doc(this.firestore, `submissions/${submissionId}`);
    await runTransaction(this.firestore, async (txn) => {
      const snap = await txn.get(ref);
      const locks: Record<string, SectionLock> = { ...(snap.data()?.['sectionLocks'] ?? {}) };
      if (locks[section]?.lockedByUid === user.uid) {
        delete locks[section];
        txn.update(ref, { sectionLocks: locks });
      }
    });
  }

  /** Coach: force-unlock any section regardless of who holds it */
  async forceUnlockSection(submissionId: string, section: string): Promise<void> {
    const ref = doc(this.firestore, `submissions/${submissionId}`);
    await runTransaction(this.firestore, async (txn) => {
      const snap = await txn.get(ref);
      const locks: Record<string, SectionLock> = { ...(snap.data()?.['sectionLocks'] ?? {}) };
      delete locks[section];
      txn.update(ref, { sectionLocks: locks });
    });
  }

  /** Coach: force-unlock ALL sections at once */
  async forceUnlockAll(submissionId: string): Promise<void> {
    const ref = doc(this.firestore, `submissions/${submissionId}`);
    await updateDoc(ref, { sectionLocks: {} });
  }

  /** Subscribe to real-time updates on a submission document. Returns unsubscribe function. */
  listenToSubmission(submissionId: string, callback: (sub: ReportSubmission) => void): () => void {
    const ref = doc(this.firestore, `submissions/${submissionId}`);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as ReportSubmission);
      }
    });
  }
}
