import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

// Runs against the local emulators (auth, firestore, functions). See the test:functions script.
const PROJECT = 'exd-lab-663e5';
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const FIRESTORE_CLEAR = `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`;
const FUNCTIONS = `http://127.0.0.1:5001/${PROJECT}/us-central1`;
const OWNER_HEADERS = { Authorization: 'Bearer owner' };
const API_KEY = 'fake-api-key';
const PASSWORD = 'secret123';
const SEASON = 'test-season-2026';

interface FunctionError {
  error: { status: string; message: string };
}

interface RolloverPlan {
  uid: string;
  displayName: string;
  archived: boolean;
  returning: boolean;
  action: string;
}

interface RolloverResponse {
  result: {
    dryRun?: boolean;
    seasonId: string;
    existingStatus?: string | null;
    status?: string;
    counts: Record<string, number>;
    students: RolloverPlan[];
  };
}

type FirestoreValue = Record<string, unknown>;

function toValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  return { mapValue: { fields: toFields(value as Record<string, unknown>) } };
}

function toFields(data: Record<string, unknown>): Record<string, FirestoreValue> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toValue(value)]));
}

async function writeDoc(path: string, data: Record<string, unknown>): Promise<void> {
  await fetch(`${FIRESTORE}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...OWNER_HEADERS },
    body: JSON.stringify({ fields: toFields(data) }),
  });
}

async function docExists(path: string): Promise<boolean> {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: OWNER_HEADERS });
  return res.status === 200;
}

async function readStringField(path: string, field: string): Promise<string | undefined> {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: OWNER_HEADERS });
  const body = (await res.json()) as { fields?: Record<string, { stringValue?: string }> };
  return body.fields?.[field]?.stringValue;
}

type RawField = { stringValue?: string; booleanValue?: boolean; mapValue?: { fields?: Record<string, RawField> } };

async function readDocFields(path: string): Promise<Record<string, RawField> | undefined> {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: OWNER_HEADERS });
  if (res.status !== 200) return undefined;
  const body = (await res.json()) as { fields?: Record<string, RawField> };
  return body.fields;
}

async function listAwardedStudents(templateId: string): Promise<string[]> {
  const res = await fetch(`${FIRESTORE}/achievements`, { headers: OWNER_HEADERS });
  const body = (await res.json()) as { documents?: { fields: Record<string, RawField> }[] };
  return (body.documents ?? [])
    .filter((doc) => doc.fields['templateId']?.stringValue === templateId)
    .map((doc) => doc.fields['studentUid']?.stringValue ?? '');
}

async function listAchievementsFor(studentUid: string): Promise<Record<string, RawField>[]> {
  const res = await fetch(`${FIRESTORE}/achievements`, { headers: OWNER_HEADERS });
  const body = (await res.json()) as { documents?: { fields: Record<string, RawField> }[] };
  return (body.documents ?? [])
    .map((doc) => doc.fields)
    .filter((fields) => fields['studentUid']?.stringValue === studentUid);
}

async function clearFirestore(): Promise<void> {
  await fetch(FIRESTORE_CLEAR, { method: 'DELETE', headers: OWNER_HEADERS });
}

async function signUp(email: string): Promise<{ uid: string; idToken: string }> {
  const res = await fetch(`${AUTH}/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true }),
  });
  const body = (await res.json()) as { localId: string; idToken: string };
  return { uid: body.localId, idToken: body.idToken };
}

async function trySignIn(email: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${AUTH}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true }),
  });
  const body = (await res.json()) as { error?: { message: string } };
  return res.ok ? { ok: true } : { ok: false, message: body.error?.message };
}

async function callFunction(
  name: string,
  idToken: string,
  data: Record<string, unknown>,
): Promise<{ status: number; body: RolloverResponse | FunctionError }> {
  const res = await fetch(`${FUNCTIONS}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ data }),
  });
  return { status: res.status, body: (await res.json()) as RolloverResponse | FunctionError };
}

function errorStatus(body: RolloverResponse | FunctionError): string | undefined {
  return 'error' in body ? body.error.status : undefined;
}

describe('rolloverSeason callable', () => {
  const emails = {
    coach: 'rollover-coach@exd-lab.app',
    s1: 'rollover-s1@exd-lab.app',
    s2: 'rollover-s2@exd-lab.app',
    s3: 'rollover-s3@exd-lab.app',
    s4: 'rollover-s4@exd-lab.app',
  };
  const uids: Record<keyof typeof emails, string> = { coach: '', s1: '', s2: '', s3: '', s4: '' };
  let coachToken = '';

  // Students: s1 active & returning, s2 archived & returning, s3 active & not returning, s4 archived & not returning.
  const returning = () => [uids.s1, uids.s2];

  beforeAll(async () => {
    await clearFirestore();
    for (const key of Object.keys(emails) as (keyof typeof emails)[]) {
      const account = await signUp(emails[key]);
      uids[key] = account.uid;
      if (key === 'coach') coachToken = account.idToken;
    }
  });

  beforeEach(async () => {
    await clearFirestore();

    await writeDoc(`users/${uids.coach}`, {
      role: 'coach',
      email: emails.coach,
      displayName: 'Coach',
    });
    for (const key of ['s1', 's2', 's3', 's4'] as const) {
      await writeDoc(`users/${uids[key]}`, {
        role: 'student',
        email: emails[key],
        displayName: key.toUpperCase(),
      });
    }

    // Drive Auth + profile state through the real archive callable.
    for (const key of ['s1', 's3'] as const) {
      await callFunction('setStudentArchived', coachToken, { uid: uids[key], archived: false });
    }
    for (const key of ['s2', 's4'] as const) {
      await callFunction('setStudentArchived', coachToken, { uid: uids[key], archived: true });
    }

    await writeDoc(`progress/${uids.s1}/items/guide-1`, { completed: true });
    await writeDoc(`progress/${uids.s3}/items/guide-1`, { completed: true });
    await writeDoc(`loginHistory/${uids.s1}`, { dates: ['2026-09-01'] });
    await writeDoc('submissions/submission-1', { studentUid: uids.s1, status: 'submitted' });
    await writeDoc('taskSubmissions/task-1', { studentUid: uids.s3, status: 'submitted' });
    await writeDoc('settings/taskAssignments', { 'task-1': { type: 'all', studentUids: [] } });
    await writeDoc('settings/hiddenGuides', { guideIds: ['guide-9'] });
    await writeDoc('achievements/ach-1', { title: 'First Steps', completed: true });
  });

  afterAll(async () => {
    await clearFirestore();
  });

  it('dry run reports counts and planned actions without writing anything', async () => {
    const res = await callFunction('rolloverSeason', coachToken, {
      seasonId: SEASON,
      returningUids: returning(),
      dryRun: true,
    });
    expect(res.status).toBe(200);

    const result = (res.body as RolloverResponse).result;
    expect(result.dryRun).toBe(true);
    expect(result.existingStatus).toBeNull();
    expect(result.counts).toEqual({
      progress: 2,
      loginHistory: 1,
      submissions: 1,
      taskSubmissions: 1,
      taskAssignments: 1,
      teamEvents: 0,
      returningMemberAwards: 2,
      legacyAchievements: 1,
      carriedAchievements: 0,
    });

    const actionFor = (uid: string) => result.students.find((s) => s.uid === uid)?.action;
    expect(actionFor(uids.s1)).toBe('enroll');
    expect(actionFor(uids.s2)).toBe('reactivate');
    expect(actionFor(uids.s3)).toBe('archive');
    expect(actionFor(uids.s4)).toBe('none');

    expect(await docExists(`progress/${uids.s1}/items/guide-1`)).toBe(true);
    expect(await docExists(`seasons/${SEASON}`)).toBe(false);
    expect(await docExists(`archives/${SEASON}/progress/${uids.s1}__guide-1`)).toBe(false);
  });

  it('treats an omitted dryRun flag as a dry run', async () => {
    const res = await callFunction('rolloverSeason', coachToken, {
      seasonId: SEASON,
      returningUids: returning(),
    });
    expect(res.status).toBe(200);
    expect(await docExists(`progress/${uids.s1}/items/guide-1`)).toBe(true);
  });

  it('rejects callers who are not coaches', async () => {
    const student = await signUp('rollover-intruder@exd-lab.app');
    const res = await callFunction('rolloverSeason', student.idToken, {
      seasonId: SEASON,
      returningUids: returning(),
      dryRun: true,
    });
    expect(res.status).toBe(403);
    expect(errorStatus(res.body)).toBe('PERMISSION_DENIED');
  });

  it('rejects malformed season IDs', async () => {
    const res = await callFunction('rolloverSeason', coachToken, {
      seasonId: '../etc',
      returningUids: returning(),
      dryRun: true,
    });
    expect(res.status).toBe(400);
    expect(errorStatus(res.body)).toBe('INVALID_ARGUMENT');
  });

  it('rejects returning IDs that are not known students', async () => {
    const res = await callFunction('rolloverSeason', coachToken, {
      seasonId: SEASON,
      returningUids: [uids.s1, uids.coach],
      dryRun: true,
    });
    expect(res.status).toBe(400);
    expect(errorStatus(res.body)).toBe('INVALID_ARGUMENT');
  });

  it('refuses a real run without the typed season confirmation', async () => {
    const res = await callFunction('rolloverSeason', coachToken, {
      seasonId: SEASON,
      returningUids: returning(),
      dryRun: false,
      confirmSeasonId: 'wrong',
      backupConfirmed: true,
    });
    expect(res.status).toBe(400);
    expect(await docExists(`progress/${uids.s1}/items/guide-1`)).toBe(true);
    expect(await docExists(`seasons/${SEASON}`)).toBe(false);
  });

  it('refuses a real run without backup confirmation', async () => {
    const res = await callFunction('rolloverSeason', coachToken, {
      seasonId: SEASON,
      returningUids: returning(),
      dryRun: false,
      confirmSeasonId: SEASON,
      backupConfirmed: false,
    });
    expect(res.status).toBe(400);
    expect(await docExists(`progress/${uids.s1}/items/guide-1`)).toBe(true);
  });

  it('real run archives and clears live data, then updates student access', async () => {
    const res = await callFunction('rolloverSeason', coachToken, {
      seasonId: SEASON,
      returningUids: returning(),
      dryRun: false,
      confirmSeasonId: SEASON,
      backupConfirmed: true,
    });
    expect(res.status).toBe(200);
    expect((res.body as RolloverResponse).result.status).toBe('complete');

    // Live season data is cleared.
    expect(await docExists(`progress/${uids.s1}/items/guide-1`)).toBe(false);
    expect(await docExists(`progress/${uids.s3}/items/guide-1`)).toBe(false);
    expect(await docExists(`loginHistory/${uids.s1}`)).toBe(false);
    expect(await docExists('submissions/submission-1')).toBe(false);
    expect(await docExists('taskSubmissions/task-1')).toBe(false);
    expect(await docExists('settings/taskAssignments')).toBe(false);

    // Snapshots are kept under the season.
    expect(await docExists(`archives/${SEASON}/progress/${uids.s1}__guide-1`)).toBe(true);
    expect(await readStringField(`archives/${SEASON}/progress/${uids.s1}__guide-1`, 'uid')).toBe(
      uids.s1,
    );
    expect(await docExists(`archives/${SEASON}/loginHistory/${uids.s1}`)).toBe(true);
    expect(await docExists(`archives/${SEASON}/submissions/submission-1`)).toBe(true);
    expect(await docExists(`archives/${SEASON}/taskSubmissions/task-1`)).toBe(true);
    expect(await docExists(`archives/${SEASON}/taskAssignments/current`)).toBe(true);

    // Lifetime data and settings that are not per-season survive.
    expect(await docExists('achievements/ach-1')).toBe(true);
    expect(await docExists('settings/hiddenGuides')).toBe(true);
    expect(await docExists(`users/${uids.s1}`)).toBe(true);

    // Returning students are enrolled and can sign in; non-returning active students are archived.
    expect(await readStringField(`users/${uids.s2}`, 'status')).toBe('active');
    expect((await trySignIn(emails.s2)).ok).toBe(true);
    expect(await readStringField(`users/${uids.s3}`, 'status')).toBe('archived');
    expect((await trySignIn(emails.s3)).message).toBe('USER_DISABLED');
    expect(await readStringField(`users/${uids.s4}`, 'status')).toBe('archived');

    const seasonStatus = await readStringField(`seasons/${SEASON}`, 'status');
    expect(seasonStatus).toBe('complete');
  });

  it('archives team events with member names and awards Returning Member once per returning student', async () => {
    await writeDoc('teamEvents/event-1', {
      title: 'Regionals',
      location: 'Hall A',
      eventDate: '2026-11-02',
      teams: [
        {
          schoolName: 'North',
          memberUids: [uids.s1, uids.s3],
          roleAssignments: { Hypothesis: uids.s2 },
        },
      ],
      alternateUids: [uids.s4],
    });
    // s2 already holds this season's award, so the rollover must not add a second one.
    await writeDoc('achievements/returning-existing', {
      studentUid: uids.s2,
      templateId: 'returning-member',
      completed: true,
      seasonId: SEASON,
    });
    // s1 earned a task last season; s3 (not returning) did too. Only s1 should get a fresh copy.
    await writeDoc('achievements/prior-s1', {
      studentUid: uids.s1,
      templateId: 'first-task',
      assignedBy: 'coach-seed',
      completed: true,
      seasonId: 'test-season-2025',
    });
    await writeDoc('achievements/prior-s3', {
      studentUid: uids.s3,
      templateId: 'first-task',
      assignedBy: 'coach-seed',
      completed: true,
      seasonId: 'test-season-2025',
    });

    const res = await callFunction('rolloverSeason', coachToken, {
      seasonId: SEASON,
      returningUids: returning(),
      dryRun: false,
      confirmSeasonId: SEASON,
      backupConfirmed: true,
    });
    expect(res.status).toBe(200);
    const counts = (res.body as RolloverResponse).result.counts;
    expect(counts.teamEvents).toBe(1);
    expect(counts.returningMemberAwards).toBe(1);
    expect(counts.legacyAchievements).toBe(1);
    expect(counts.carriedAchievements).toBe(1);

    // Live planner is cleared; the archived copy keeps names for archived members too.
    expect(await docExists('teamEvents/event-1')).toBe(false);
    const archived = await readDocFields(`archives/${SEASON}/teamEvents/event-1`);
    expect(archived?.title?.stringValue).toBe('Regionals');
    const memberNames = archived?.memberNames?.mapValue?.fields ?? {};
    expect(memberNames[uids.s1]?.stringValue).toBe('S1');
    expect(memberNames[uids.s3]?.stringValue).toBe('S3');
    expect(memberNames[uids.s4]?.stringValue).toBe('S4');

    // Only returning students hold the award, and s2 still has exactly one.
    const awarded = await listAwardedStudents('returning-member');
    expect(awarded.sort()).toEqual([uids.s1, uids.s2].sort());

    // Untagged history is stamped with the fallback tag.
    expect((await readDocFields('achievements/ach-1'))?.seasonId?.stringValue).toBe('earlier');

    // s1's earlier assignment is carried forward as a fresh, incomplete copy; the original stays earned.
    const s1Docs = await listAchievementsFor(uids.s1);
    const carried = s1Docs.filter(
      (f) => f.templateId?.stringValue === 'first-task' && f.seasonId?.stringValue === SEASON,
    );
    expect(carried).toHaveLength(1);
    expect(carried[0]?.completed?.booleanValue).toBe(false);
    expect(carried[0]?.assignedBy?.stringValue).toBe('coach-seed');
    expect(s1Docs.find((f) => f.seasonId?.stringValue === 'test-season-2025')?.completed?.booleanValue).toBe(true);

    // s3 is not returning, so nothing is carried into the new season for them.
    expect((await listAchievementsFor(uids.s3)).some((f) => f.seasonId?.stringValue === SEASON)).toBe(false);

    // UID lists live in the coach-only summary, not on the student-readable season doc.
    expect(await docExists(`archives/${SEASON}/summary/rollover`)).toBe(true);
    const seasonFields = await readDocFields(`seasons/${SEASON}`);
    expect(seasonFields?.returningUids).toBeUndefined();
    expect(seasonFields?.archivedUids).toBeUndefined();
  });

  it('refuses to roll over the same season twice', async () => {
    const payload = {
      seasonId: SEASON,
      returningUids: returning(),
      dryRun: false,
      confirmSeasonId: SEASON,
      backupConfirmed: true,
    };
    const first = await callFunction('rolloverSeason', coachToken, payload);
    expect(first.status).toBe(200);

    const second = await callFunction('rolloverSeason', coachToken, payload);
    expect(second.status).toBe(400);
    expect(errorStatus(second.body)).toBe('FAILED_PRECONDITION');
  });
});
