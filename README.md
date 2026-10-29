# XD Lab — Science Olympiad Experimental Design Practice App

A web application for Science Olympiad teams to practice the Experimental Design event. Students work through study guides, complete practice events with a guided report builder, submit tasks, and earn achievements — all while coaches manage rosters, review submissions, and track progress.

## Tech Stack

- **Frontend:** Angular 21, Angular Material, Signals, standalone components
- **Backend:** Firebase (Authentication, Firestore, Hosting, Cloud Functions)
- **AI Feedback:** Google GenAI SDK (Gemini) via Cloud Functions
- **PDF Export:** html2pdf.js
- **Markdown/Math:** ngx-markdown, KaTeX

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- npm v10+
- Java v21+ (required by the Firebase Emulator Suite)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- A [Firebase project](https://console.firebase.google.com/) with Authentication (Email/Password) and Firestore enabled

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/experimental-design.git
cd experimental-design
npm install
cd functions && npm install && cd ..
```

### 2. Firebase Project

```bash
firebase login
firebase use --add   # select your Firebase project
```

### 3. Environment Files

Create the following files (these are gitignored and must be created manually):

**`src/environments/environment.ts`** (development):
```typescript
export const environment = {
  production: false,
  useEmulators: true,
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.firebasestorage.app',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
```

**`src/environments/environment.prod.ts`** (production):
```typescript
export const environment = {
  production: true,
  useEmulators: false,
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.firebasestorage.app',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
```

You can find these values in the [Firebase Console](https://console.firebase.google.com/) under **Project Settings > General > Your apps > Web app**.

The Gemini API key is managed as a Firebase Secret; see **AI secret setup** below.

### 4. Firebase Configuration

Create **`.firebaserc`** in the project root:
```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

## Running Locally

### Development Server

Start the local Firebase emulators in one terminal:

```bash
npm run emulators
```

Then start Angular in a second terminal:

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200). The app reloads on file changes.

With `useEmulators: true` in `environment.ts`, Authentication, Firestore, and Cloud Functions use local emulators.
For an intentional smoke test against the live Firebase project, set it to `false`; all three services, including direct student-account creation, will use the configured project.
Live-mode testing is not isolated: writes, password resets, account creation, and AI requests affect or use production services. Use a dedicated test account and test data, and avoid destructive actions.

The Functions emulator suppresses Discord notifications. AI generation is disabled there by default to avoid billable external calls. To intentionally test AI locally, put `GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_GENAI_API_KEY` in `functions/.secret.local`, then set `ALLOW_LIVE_AI_IN_EMULATOR=true` before starting the emulators. Both the key file and the opt-in flag are required for a live Gemini request.

### AI Secret Setup

For production, provision the key through Firebase Secret Manager (the CLI prompts for the value; do not put the key in source control or a deploy command):

```bash
firebase functions:secrets:set GOOGLE_GENAI_API_KEY --project YOUR_FIREBASE_PROJECT_ID
```

The secret is bound only to the `generateExperimentData` function. Provision it before deploying that function:

```bash
firebase deploy --only functions:generateExperimentData --project YOUR_FIREBASE_PROJECT_ID
```

For local AI testing, Firebase Functions emulator reads secrets from `functions/.secret.local`. Keep AI disabled unless a billable live API call is specifically intended.
If you previously stored this key in `functions/.env`, move it to the secret location needed for your workflow and remove the obsolete copy; this callable no longer reads the key from `.env`.

The AI callable allows up to 10 accepted generations per authenticated account per UTC day. Accepted attempts count toward the limit even if Gemini later fails. Production usage is tracked in a server-only Firestore collection; emulator usage is held in memory and does not affect production quota records.

The AI callable currently uses the stable `gemini-3.1-flash-lite` model. Check Google's [model deprecation schedule](https://ai.google.dev/gemini-api/docs/deprecations) before changing model IDs.

### Cloud Functions (Emulator)

In a separate terminal:

```bash
cd functions
npm run serve
```

This builds the TypeScript functions and starts the Firebase Functions emulator on port 5001.

### Full Emulator Suite

```bash
firebase emulators:start
```

## Building

```bash
npm run build
```

Build output goes to `dist/experimental-design/browser/`.
The login screen shows the short Git commit and UTC build time. Local builds append `-dirty` when the working tree has uncommitted changes.

## Testing

```bash
npm test
```

Uses Vitest as the test runner.

Firestore rules are tested against the local emulator; this does not connect to or deploy to a Firebase project:

```bash
npm run test:rules
```

The command starts the Firestore emulator, runs the rules tests against a demo project, and then shuts the emulator down.
After reviewing the rules and validating them against staging, deploy rules explicitly to that project:

```bash
firebase deploy --only firestore:rules --project YOUR_STAGING_PROJECT_ID
```

Cloud Function input/output validation has unit tests that do not call Gemini:

```bash
cd functions
npm test
```

The student archive callable (`setStudentArchived`) is tested against the Auth, Firestore, and Functions emulators:

```bash
npm run test:functions
```

## Backups

Before a season rollover or any bulk data change, export Firestore to a dedicated GCS bucket and verify the export:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup-firestore.ps1 -Label pre-rollover
```

The script runs `gcloud firestore export` against `exd-lab-663e5`, checks the operation state, and confirms the export metadata exists in `gs://exd-lab-663e5-backups`.

## Student Archive

Coaches archive students from **Student Management** instead of deleting them. Archiving disables the student's sign-in, so they see "This account is no longer active" on login. Restoring re-enables sign-in. Archived students keep their data and can be restored at any time.

Note: a student who is already signed in can keep working until their current session token expires (up to about an hour).

## Season Rollover

Coaches start a new season from **Season Rollover** on the coach dashboard. The page runs a preview first, and nothing changes until the coach types the new season ID and confirms a fresh backup.

- **Archived to `archives/{endedSeasonId}/...`:** the season that ended, not the new one. For a rollover into 2026-2027, data goes to `archives/2025-2026/...`. It covers study guide progress, login streaks, practice reports, task submissions, task assignments, and team planner events. Each archived document keeps its original path in `sourcePath`. Archived team events also store `memberNames`, so past events still show names after a student is deleted.
- **Kept:** student accounts, achievements, guide visibility settings, AI usage, and practice event definitions.
- **Returning students** (checked on the page) are re-enrolled. If they were archived, their sign-in is restored. Each returning student also receives the **Returning Member** achievement once per season. It is awarded by the server, so coaches can't assign it by hand.
- **Achievements are season-tagged.** New assignments carry the active season's `seasonId`. Achievements from before tagging are stamped with the previous season (or `earlier` when the season ID isn't a `YYYY-YYYY` year range). Earned history is never changed.
- **Carry-over:** each returning student's prior assignments become fresh, incomplete copies for the new season, so they can earn them again. Only the active season is auto-checked. Students who aren't returning get no carry-over.
- **Other active students** are archived, which blocks their sign-in.
- **Season summary:** the lists of returning and archived UIDs are stored in `archives/{endedSeasonId}/summary/rollover`. They are not on the season document, which students can read to show the season chip. A rollover marks the season that ended `complete` (shown under Past Events) and the new season `active`.

Before the real run, ask students to sign out and take a backup:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup-firestore.ps1 -Label pre-rollover
```

Each archive batch copies and deletes documents together, so an interrupted run can be resumed by running it again for the same season. A season marked `complete` cannot be rolled over again.

Note: as with archiving, a student who is signed in during the rollover keeps access until their token expires.

**Season Roster** (coach dashboard) enrolls students in any season after the fact. New accounts are enrolled in the newest season automatically. Archived students can't be enrolled until they are restored in Student Management.

**Team → Past Events** shows every completed season's planner events read-only, including team members and report role assignments. Students and coaches can both view it. The live **Events** tab only holds the current season, and the rollover clears it.

The current season label appears as a chip on both the coach and student dashboards.

## Deploying

### Hosting (Frontend)

```bash
npm run build
firebase deploy --only hosting
```

### Cloud Functions

```bash
cd functions
npm run deploy
```

### Everything

```bash
npm run build
firebase deploy
```

## Project Structure

```
src/
├── environments/          # Firebase config (gitignored)
├── app/
│   ├── core/
│   │   ├── models/        # Data interfaces & response helpers
│   │   ├── services/      # Firebase services, auth, PDF generation
│   │   └── tasks/         # Task definitions & registry
│   ├── features/
│   │   ├── auth/          # Login & password change
│   │   ├── coach/         # Coach dashboard, student management
│   │   ├── dashboard/     # Student dashboard
│   │   ├── practice-events/  # Practice event list & report builder
│   │   ├── study-guides/  # Study guide list & detail views
│   │   ├── tasks/         # Task list & submission
│   │   └── team/          # Team roster, achievements, schedule
│   └── shared/            # Shared components, pipes, dialogs
├── styles.scss            # Global styles & Material theme
└── index.html
scripts/
└── write-build-info.mjs   # Generates the build identifier before Angular commands
public/
├── guides/                # Markdown study guide content
└── tasks/                 # Legacy Markdown task prompts; new tasks may use inline section instructions
functions/
└── src/index.ts           # Cloud Functions (AI data generation via Gemini)
```

### Task definitions and archive

Task definitions live in `src/app/core/tasks/` and are registered in `task-registry.ts`. Newer tasks can include Markdown instructions alongside their response sections; older tasks may reference a prompt in `public/tasks/`.

Set `archived: true` on a definition to move it out of the coach's default assignment list. Coaches can use **Show archived tasks** to view and manage its assignments. Archiving does not remove existing assignments or submissions, and assigned students can still access the task.

Student responses are stored by task ID and prompt position. Preserve task IDs, prompt order, and response shapes when reorganizing definitions. For changes to an already assigned task's prompts, create a new task ID or implement a migration rather than changing the existing response structure.

### Interactive guides

The **Data Tables, Statistics & Graphing** guide gives each signed-in user one private workspace. Students can enter their own data, load a toy-car example, or have AI invent a simple experiment and fictional practice data without supplying a premise. They enter and check statistics and condensed means, plot points, draw a line, and optionally reveal the equation derived from its endpoints. AI generation uses the same service and quota as practice events; the guide does not send the current workspace's experiment details to that service.

Work is saved to the user's account when they select **Save workspace**; unsaved changes prompt a warning before navigation. Loading an example, starting blank, or generating AI data requires confirmation before replacing work. The workspace is separate from task and report submissions. Existing practice-event graphs offer a free-placement toggle and exact coordinate entry; task graphs also allow points between grid marks.

Workspace records are stored in `interactiveGuideWorkspaces/{uid}` and are accessible only to their owner. Deploy the Firestore rules together with the frontend when releasing changes to this feature.

## License

This project is provided as-is for educational use with Science Olympiad teams.
