/* Seed script for Firebase Firestore and Auth
   Usage: npm run seed
   Requirements: .env must contain Firebase config and the project must allow email/password auth.
*/

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const val = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true;
      args[key] = val;
      if (val !== true) i += 1;
    }
  }
  return args;
}

// Read env variables required for Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('Missing Firebase configuration in .env. Please copy .env.example to .env and set values.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function ensureUser(email, password) {
  try {
    console.log('Creating user:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created:', userCredential.user.uid);
    return userCredential.user;
  } catch (err) {
    // If user already exists, try to sign in
    const e = err;
    const msg = e && e.message ? e.message : String(e);
    if (msg.includes('email-already-in-use')) {
      console.log('User already exists, signing in...');
      const signedIn = await signInWithEmailAndPassword(auth, email, password);
      console.log('Signed in as existing user:', signedIn.user.uid);
      return signedIn.user;
    }

    console.error('Failed to create or sign in user:', err);
    throw err;
  }
}

function sampleProjectsForUser(userId, count = 3) {
  const today = new Date();
  const iso = (d) => d.toISOString().split('T')[0];

  const methodologies = ['Agile', 'Waterfall', 'Hybrid'];
  const industries = ['Software', 'Finance', 'Healthcare', 'Education', 'Retail', 'Logistics'];
  const sizes = ['Small', 'Medium', 'Large'];
  const statuses = ['Active', 'Completed', 'On Hold'];

  const projects = [];

  for (let i = 0; i < count; i += 1) {
    const methodology = methodologies[i % methodologies.length];
    const industry = industries[i % industries.length];
    const size = sizes[i % sizes.length];
    const status = statuses[i % statuses.length];

    const plannedCost = 45000 + (i % 10) * 18000 + (i % 3) * 4500;
    const costDelta = (i % 2 === 0 ? 1 : -1) * (2000 + (i % 7) * 1500);
    const actualCost = Math.max(10000, plannedCost + costDelta);

    const startDateObj = new Date(today.getFullYear(), today.getMonth() - (i % 18), 1 + (i % 20));
    const endDateObj = status === 'Completed'
      ? new Date(startDateObj.getFullYear(), startDateObj.getMonth() + 2 + (i % 4), 10 + (i % 15))
      : null;

    projects.push({
      name: `Demo Project ${String(i + 1).padStart(2, '0')} - ${methodology} ${industry}`,
      methodology,
      industry,
      size,
      teamSize: 4 + (i % 17),
      status,
      plannedCost,
      actualCost,
      startDate: iso(startDateObj),
      endDate: endDateObj ? iso(endDateObj) : '',
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  return projects;
}

async function seed() {
  try {
    const args = parseArgs();
    const email = args.email || process.env.SEED_EMAIL || 'kasibhatlanavyatha25@gmail.com';
    const password = args.password || process.env.SEED_PASSWORD || 'Demo@12345';

    const countRaw = parseInt(args.count || process.env.SEED_COUNT || '3', 10);
    const count = Number.isFinite(countRaw) && countRaw > 0 ? countRaw : 3;

    const user = await ensureUser(email, password);
    const userId = user.uid;

    console.log('Seeding', count, 'projects for user id:', userId);

    const projects = sampleProjectsForUser(userId, count);

    for (const p of projects) {
      // Firestore expects Timestamp for createdAt/updatedAt fields and startDate/endDate when using FirestoreService
      const docRef = await addDoc(collection(db, 'projects'), {
        name: p.name,
        methodology: p.methodology,
        industry: p.industry,
        size: p.size,
        teamSize: p.teamSize,
        status: p.status,
        plannedCost: p.plannedCost,
        actualCost: p.actualCost,
        userId: p.userId,
        startDate: p.startDate ? Timestamp.fromDate(new Date(p.startDate)) : null,
        endDate: p.endDate ? (p.endDate !== '' ? Timestamp.fromDate(new Date(p.endDate)) : null) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log('Added project with ID:', docRef.id);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
