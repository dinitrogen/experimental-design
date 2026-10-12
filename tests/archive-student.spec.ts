import { describe, it, expect, beforeAll } from 'vitest';

// Runs against the local emulators (auth, firestore, functions). See the test:functions script.
const PROJECT = 'exd-lab-663e5';
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const FUNCTIONS = `http://127.0.0.1:5001/${PROJECT}/us-central1`;
const OWNER_HEADERS = { Authorization: 'Bearer owner' };
const API_KEY = 'fake-api-key';
const PASSWORD = 'secret123';

interface FunctionError {
  error: { status: string; message: string };
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

async function writeUser(uid: string, role: 'coach' | 'student', email: string): Promise<void> {
  await fetch(`${FIRESTORE}/users/${uid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...OWNER_HEADERS },
    body: JSON.stringify({
      fields: {
        role: { stringValue: role },
        email: { stringValue: email },
        displayName: { stringValue: uid },
      },
    }),
  });
}

async function readUserStatus(uid: string): Promise<string | undefined> {
  const res = await fetch(`${FIRESTORE}/users/${uid}`, { headers: OWNER_HEADERS });
  const body = (await res.json()) as { fields?: { status?: { stringValue: string } } };
  return body.fields?.status?.stringValue;
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

async function callSetStudentArchived(
  idToken: string,
  data: Record<string, unknown>,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${FUNCTIONS}/setStudentArchived`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ data }),
  });
  return { status: res.status, body: await res.json() };
}

describe('setStudentArchived callable', () => {
  let coach: { uid: string; idToken: string };
  let student: { uid: string; idToken: string };
  const studentEmail = 'archive-test-student@exd-lab.app';

  beforeAll(async () => {
    coach = await signUp('archive-test-coach@exd-lab.app');
    await writeUser(coach.uid, 'coach', 'archive-test-coach@exd-lab.app');
    student = await signUp(studentEmail);
    await writeUser(student.uid, 'student', studentEmail);
  });

  it('rejects callers who are not coaches', async () => {
    const res = await callSetStudentArchived(student.idToken, { uid: student.uid, archived: true });
    expect(res.status).toBe(403);
    expect((res.body as FunctionError).error.status).toBe('PERMISSION_DENIED');
    expect(await readUserStatus(student.uid)).toBeUndefined();
  });

  it('rejects malformed arguments', async () => {
    const res = await callSetStudentArchived(coach.idToken, { uid: student.uid, archived: 'yes' });
    expect(res.status).toBe(400);
    expect((res.body as FunctionError).error.status).toBe('INVALID_ARGUMENT');
  });

  it('archives a student: disables login and marks the profile archived', async () => {
    const res = await callSetStudentArchived(coach.idToken, { uid: student.uid, archived: true });
    expect(res.status).toBe(200);

    expect(await readUserStatus(student.uid)).toBe('archived');

    const signIn = await trySignIn(studentEmail);
    expect(signIn.ok).toBe(false);
    expect(signIn.message).toBe('USER_DISABLED');
  });

  it('restores a student: re-enables login and marks the profile active', async () => {
    const res = await callSetStudentArchived(coach.idToken, { uid: student.uid, archived: false });
    expect(res.status).toBe(200);

    expect(await readUserStatus(student.uid)).toBe('active');

    const signIn = await trySignIn(studentEmail);
    expect(signIn.ok).toBe(true);
  });

  it('does not archive coach accounts', async () => {
    const res = await callSetStudentArchived(coach.idToken, { uid: coach.uid, archived: true });
    expect(res.status).toBe(404);
    expect((res.body as FunctionError).error.status).toBe('NOT_FOUND');
  });
});
