# Agile vs Waterfall Cost Analysis Dashboard

A React + TypeScript dashboard for comparing Agile and Waterfall projects using project cost data stored in Firebase.

The app supports:
- User authentication (email/password and Google sign-in)
- Per-user project CRUD with Firestore
- KPI dashboard for portfolio-level visibility
- Analysis view with methodology comparisons and export to CSV

## What This Project Is

This project is a single-page web app built with Vite. Authenticated users can create and manage project records, then compare cost behavior across methodologies.

Data access is multi-tenant by design: each signed-in user can only read and write their own `projects` and `analysis` documents.

## Tech Stack

- Frontend: React 18, TypeScript, Vite
- Routing: React Router
- Styling: Tailwind CSS
- Charts: Chart.js + react-chartjs-2
- Backend services: Firebase Auth + Firestore
- Testing: Vitest (statistics utilities)

## Project Structure

```text
src/
  components/
    auth/
    charts/
    dashboard/
    debug/
    layout/
  contexts/
    AuthContext.tsx
    ProjectsContext.tsx
  lib/
    firebase.ts
    firestoreService.ts
  pages/
    Analysis.tsx
    Dashboard.tsx
    Projects.tsx
    Settings.tsx
  types/
  utils/
```

## Firebase Configuration

The app reads Firebase configuration from Vite env variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional in current runtime code)

### Local Setup

1. Install dependencies:

```bash
npm install
```

2. Use the provided environment file values (already set in `.env.example` for this Firebase project) and keep local secrets in `.env.local`.

3. Start development server:

```bash
npm run dev
```

Default dev URL:
- `http://localhost:5173`

## Firestore Rules and Indexes

This repository includes:
- `firestore.rules`
- `firestore.indexes.json`

Deploy them with Firebase CLI:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Rules Model

Current rules are aligned with runtime code:
- `users/{userId}`: user can manage own profile; admin can read all user profiles
- `projects/{projectId}`: access allowed when `request.auth.uid == userId`
- `analysis/{analysisId}`: access allowed when `request.auth.uid == userId`

## Core Application Flows

### 1. Authentication
- `AuthContext` handles auth state and user session lifecycle
- New users get a `users/{uid}` document in Firestore

### 2. Projects
- `ProjectsContext` subscribes to real-time updates from Firestore
- Users can add, edit, delete projects
- Projects page supports filtering and CSV export

### 3. Dashboard
- Shows KPI cards and comparison chart based on current user projects

### 4. Analysis
- Builds methodology comparisons from project data
- Saves analysis snapshots into `analysis` collection
- CSV export is implemented
- PDF export button is currently a placeholder in UI

## Data Model (Runtime)

### `users` collection

```ts
{
  displayName: string;
  email: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
}
```

### `projects` collection

```ts
{
  userId: string;
  name: string;
  methodology: 'Agile' | 'Waterfall' | 'Hybrid';
  industry: string;
  size: 'Small' | 'Medium' | 'Large';
  teamSize: number;
  status: 'Active' | 'Completed' | 'On Hold';
  plannedCost: number;
  actualCost: number;
  startDate: Timestamp;
  endDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `analysis` collection

```ts
{
  userId: string;
  name: string;
  projectIds: string[];
  results: object;
  configuration: object;
  createdAt: Timestamp;
}
```

## Available Scripts

- `npm run dev`: start Vite development server
- `npm run build`: create production build
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint
- `npm run test`: run Vitest tests
- `npm run seed`: seed sample projects for a user using Firebase client SDK
- `npm run update-user`: admin script (Firebase Admin SDK) to update user account data
- `npm run duplicate-user`: admin script (Firebase Admin SDK) to copy project data to another user
- `npm run doc:pdf`: generate documentation PDF

## Running Tests

```bash
npm run test
```

Current automated tests focus on statistical utility logic in `test/statistics.test.ts`.

## Build

```bash
npm run build
```

Artifacts are generated in `dist/`.

## Notes and Known Gaps

- `/admin` route exists but UI is currently a placeholder.
- PDF export in analysis page is currently a placeholder action.
- Admin scripts require a Firebase service account key via `SERVICE_ACCOUNT` environment variable.

## Security Notes

- Do not commit service account keys.
- Keep local Firebase keys in `.env.local` for development.
- Firestore access is restricted by authenticated user ownership rules.

## License

MIT
