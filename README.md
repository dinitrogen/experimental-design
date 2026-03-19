# XD Lab — Science Olympiad Experimental Design Practice App

A web application for Science Olympiad teams to practice the Experimental Design event. Students work through study guides, complete practice events with a guided report builder, submit tasks, and earn achievements — all while coaches manage rosters, review submissions, and track progress.

## Tech Stack

- **Frontend:** Angular 21, Angular Material, Signals, standalone components
- **Backend:** Firebase (Authentication, Firestore, Hosting, Cloud Functions)
- **AI Feedback:** Google Generative AI (Gemini) via Cloud Functions
- **PDF Export:** html2pdf.js
- **Markdown/Math:** ngx-markdown, KaTeX

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- npm v10+
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

**`functions/.env`** (Cloud Functions secrets):
```
GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_GENAI_API_KEY
```

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

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200). The app reloads on file changes.

Set `useEmulators: true` in `environment.ts` to use local Firebase emulators instead of production.

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

## Testing

```bash
npm test
```

Uses Vitest as the test runner.

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
│   │   ├── models/        # Data interfaces & constants
│   │   └── services/      # Firebase services, auth, PDF generation
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
public/
├── guides/                # Markdown study guide content
└── tasks/                 # Markdown task content
functions/
└── src/index.ts           # Cloud Functions (AI feedback via Gemini)
```

## License

This project is provided as-is for educational use with Science Olympiad teams.
