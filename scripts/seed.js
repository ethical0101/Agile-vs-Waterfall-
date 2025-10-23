/* Seed script for Firebase Firestore and Auth
   Usage: npm run seed
   Requirements: .env must contain Firebase config and the project must allow email/password auth.
*/

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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

function sampleProjectsForUser(userId) {
  const today = new Date();
  const iso = (d) => d.toISOString().split('T')[0];

  return [
    {
      name: 'Project Alpha - Agile Migration',
      methodology: 'Agile',
      industry: 'Software',
      size: 'Medium',
      teamSize: 8,
      status: 'completed',
      plannedCost: 120000,
      actualCost: 130000,
      startDate: iso(new Date(today.getFullYear(), today.getMonth() - 6, 1)),
      endDate: iso(new Date(today.getFullYear(), today.getMonth() - 3, 15)),
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: 'Project Beta - Waterfall Maintenance',
      methodology: 'Waterfall',
      industry: 'Finance',
      size: 'Large',
      teamSize: 20,
      status: 'completed',
      plannedCost: 250000,
      actualCost: 245000,
      startDate: iso(new Date(today.getFullYear(), today.getMonth() - 12, 1)),
      endDate: iso(new Date(today.getFullYear(), today.getMonth() - 6, 30)),
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: 'Project Gamma - Agile New Feature',
      methodology: 'Agile',
      industry: 'Healthcare',
      size: 'Small',
      teamSize: 4,
      status: 'active',
      plannedCost: 50000,
      actualCost: 15000,
      startDate: iso(new Date(today.getFullYear(), today.getMonth() - 1, 5)),
      endDate: '',
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];
}

async function seed() {
  try {
    const email = 'kasibhatlanavyatha25@gmail.com';
    const password = 'navya123';

    const user = await ensureUser(email, password);
    const userId = user.uid;

    console.log('Seeding projects for user id:', userId);

    const projects = sampleProjectsForUser(userId);

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
