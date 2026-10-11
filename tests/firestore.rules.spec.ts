import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-exd-lab',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await Promise.all([
      setDoc(doc(firestore, 'users/coach-1'), {
        email: 'coach@example.test',
        displayName: 'Coach',
        role: 'coach',
        createdAt: Timestamp.fromMillis(1),
      }),
      setDoc(doc(firestore, 'users/student-1'), {
        email: 'student-1@example.test',
        displayName: 'Student One',
        role: 'student',
        createdAt: Timestamp.fromMillis(1),
      }),
      setDoc(doc(firestore, 'users/student-2'), {
        email: 'student-2@example.test',
        displayName: 'Student Two',
        role: 'student',
        createdAt: Timestamp.fromMillis(1),
      }),
      setDoc(doc(firestore, 'submissions/submission-1'), {
        studentUid: 'student-1',
        practiceEventId: 'practice-one',
        status: 'draft',
        coachFeedback: '',
        score: null,
        submittedAt: null,
      }),
      setDoc(doc(firestore, 'submissions/submission-2'), {
        studentUid: 'student-2',
        practiceEventId: 'practice-one',
        status: 'submitted',
        coachFeedback: '',
        score: null,
        submittedAt: Timestamp.fromMillis(2),
      }),
      setDoc(doc(firestore, 'submissions/team-submission'), {
        studentUid: '',
        teamMemberUids: ['student-1', 'student-2'],
        practiceEventId: 'practice-team',
        status: 'draft',
        coachFeedback: '',
        score: null,
        submittedAt: null,
      }),
      setDoc(doc(firestore, 'taskSubmissions/task-1'), {
        studentUid: 'student-1',
        taskId: 'task-one',
        status: 'in-progress',
        responses: [''],
        coachFeedback: '',
        createdAt: Timestamp.fromMillis(1),
        updatedAt: Timestamp.fromMillis(1),
        submittedAt: null,
        reviewedAt: null,
      }),
      setDoc(doc(firestore, 'settings/taskAssignments'), {}),
      setDoc(doc(firestore, 'teamEvents/event-1'), {
        title: 'Practice',
        teams: [],
      }),
    ]);
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore security rules', () => {
  it('denies unauthenticated access', async () => {
    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(firestore, 'users/student-1')));
    await assertFails(getDocs(collection(firestore, 'submissions')));
  });

  it('allows signed-in roster reads but blocks student role escalation', async () => {
    const firestore = testEnv.authenticatedContext('student-1').firestore();

    await assertSucceeds(getDoc(doc(firestore, 'users/student-1')));
    await assertSucceeds(getDoc(doc(firestore, 'users/student-2')));
    await assertSucceeds(
      getDocs(query(collection(firestore, 'users'), where('role', '==', 'student'))),
    );
    await assertSucceeds(getDocs(collection(firestore, 'achievements')));
    await assertFails(updateDoc(doc(firestore, 'users/student-1'), { role: 'coach' }));
    await assertSucceeds(
      updateDoc(doc(firestore, 'users/student-1'), {
        lastLogin: Timestamp.fromMillis(2),
      }),
    );
  });

  it('allows coaches to list profiles and create student profiles', async () => {
    const firestore = testEnv.authenticatedContext('coach-1').firestore();

    await assertSucceeds(
      getDocs(query(collection(firestore, 'users'), where('role', '==', 'student'))),
    );
    await assertSucceeds(
      setDoc(doc(firestore, 'users/student-3'), {
        email: 'student-3@example.test',
        displayName: 'Student Three',
        role: 'student',
        createdAt: Timestamp.fromMillis(3),
      }),
    );
  });

  it('restricts submissions to coaches and their student or team members', async () => {
    const student = testEnv.authenticatedContext('student-1').firestore();
    const outsider = testEnv.unauthenticatedContext().firestore();
    const otherStudent = testEnv.authenticatedContext('student-2').firestore();

    await assertSucceeds(getDoc(doc(student, 'submissions/submission-1')));
    await assertFails(getDoc(doc(student, 'submissions/submission-2')));
    await assertSucceeds(getDoc(doc(student, 'submissions/team-submission')));
    await assertSucceeds(
      getDocs(query(collection(student, 'submissions'), where('studentUid', '==', 'student-1'))),
    );
    await assertFails(getDocs(collection(student, 'submissions')));
    await assertFails(getDoc(doc(outsider, 'submissions/submission-1')));
    await assertSucceeds(getDoc(doc(otherStudent, 'submissions/team-submission')));
  });

  it('allows the event-detail query for the current student’s solo draft', async () => {
    const student = testEnv.authenticatedContext('student-1').firestore();
    const submissions = collection(student, 'submissions');

    await assertSucceeds(getDocs(query(
      submissions,
      where('studentUid', '==', 'student-1'),
      where('practiceEventId', '==', 'practice-one'),
      where('status', '==', 'draft'),
      limit(1),
    )));
  });

  it('denies client team-submission queries so team lookup must use the callable', async () => {
    const student = testEnv.authenticatedContext('student-1').firestore();
    const submissions = collection(student, 'submissions');

    await assertFails(getDocs(query(
      submissions,
      where('teamMemberUids', 'array-contains', 'student-1'),
      where('practiceEventId', '==', 'practice-team'),
      where('status', '==', 'draft'),
      limit(1),
    )));
    await assertFails(getDocs(query(
      submissions,
      where('teamMemberUids', 'array-contains', 'student-1'),
      where('practiceEventId', '==', 'practice-team'),
      limit(1),
    )));
  });

  it('allows a student to create their own solo draft but not a team draft', async () => {
    const student = testEnv.authenticatedContext('student-1').firestore();
    const solo = doc(student, 'submissions/new-solo');
    const team = doc(student, 'submissions/new-team');

    await assertSucceeds(
      setDoc(solo, {
        studentUid: 'student-1',
        practiceEventId: 'practice-two',
        status: 'draft',
        coachFeedback: '',
        score: null,
      }),
    );
    await assertFails(
      setDoc(team, {
        studentUid: '',
        teamMemberUids: ['student-1'],
        practiceEventId: 'practice-two',
        status: 'draft',
        coachFeedback: '',
        score: null,
      }),
    );
  });

  it('allows a participant to edit a draft but not change its ownership or edit after submission', async () => {
    const student = testEnv.authenticatedContext('student-1').firestore();
    const ref = doc(student, 'submissions/submission-1');

    await assertSucceeds(updateDoc(ref, { hypothesis: 'A testable hypothesis', updatedAt: Timestamp.now() }));
    await assertFails(updateDoc(ref, { studentUid: 'student-2' }));
    await assertSucceeds(updateDoc(ref, {
      status: 'submitted',
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }));
    await assertFails(updateDoc(ref, { hypothesis: 'Changed after submission' }));
  });

  it('allows coaches to read all submissions and manage settings', async () => {
    const coach = testEnv.authenticatedContext('coach-1').firestore();

    await assertSucceeds(
      getDocs(query(collection(coach, 'submissions'), where('status', 'in', ['submitted', 'reviewed']))),
    );
    await assertSucceeds(
      setDoc(doc(coach, 'settings/taskAssignments'), { taskOne: { type: 'all', studentUids: [] } }),
    );
  });

  it('limits task submissions to their student and reserves review fields for coaches', async () => {
    const student = testEnv.authenticatedContext('student-1').firestore();
    const otherStudent = testEnv.authenticatedContext('student-2').firestore();
    const ref = doc(student, 'taskSubmissions/task-1');

    await assertSucceeds(getDoc(ref));
    await assertFails(getDoc(doc(otherStudent, 'taskSubmissions/task-1')));
    await assertSucceeds(updateDoc(ref, { responses: ['answer'], updatedAt: Timestamp.now() }));
    await assertFails(updateDoc(ref, { coachFeedback: 'Approved' }));
    await assertFails(updateDoc(ref, {
      status: 'in-progress',
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }));
  });

  it('allows students to access only their own progress documents', async () => {
    const student = testEnv.authenticatedContext('student-1').firestore();

    await assertSucceeds(
      setDoc(doc(student, 'progress/student-1/items/guide-one'), {
        resourceId: 'guide-one',
        status: 'completed',
        completedAt: Timestamp.now(),
      }),
    );
    await assertFails(
      setDoc(doc(student, 'progress/student-2/items/guide-one'), {
        resourceId: 'guide-one',
        status: 'completed',
        completedAt: Timestamp.now(),
      }),
    );
  });

  it('allows members to read shared team events but only coaches to write them', async () => {
    const student = testEnv.authenticatedContext('student-1').firestore();
    const coach = testEnv.authenticatedContext('coach-1').firestore();

    await assertSucceeds(getDoc(doc(student, 'teamEvents/event-1')));
    await assertFails(updateDoc(doc(student, 'teamEvents/event-1'), { title: 'Modified' }));
    await assertSucceeds(updateDoc(doc(coach, 'teamEvents/event-1'), { title: 'Updated' }));
  });

  it('keeps server-side AI usage records inaccessible to clients', async () => {
    const student = testEnv.authenticatedContext('student-1').firestore();
    const usage = doc(student, 'aiUsage/student-1');

    await assertFails(getDoc(usage));
    await assertFails(setDoc(usage, { date: '2026-10-11', count: 0 }));
  });
});
