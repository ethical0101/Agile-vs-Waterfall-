/*
 Seed demo projects for a specific user email using Firebase Admin SDK.
 Usage:
   SERVICE_ACCOUNT=./serviceAccountKey.json node ./scripts/seedDemoForUserAdmin.js --email user@example.com
*/

import fs from 'fs';
import { argv } from 'process';
import admin from 'firebase-admin';

function parseArgs() {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[key] = val;
      if (val !== true) i += 1;
    }
  }
  return args;
}

function sampleProjectsForUser(userId) {
  const today = new Date();
  const from = (monthsAgo, day) => new Date(today.getFullYear(), today.getMonth() - monthsAgo, day);

  return [
    {
      name: 'Campus Portal Revamp',
      methodology: 'Agile',
      industry: 'Education',
      size: 'Medium',
      teamSize: 7,
      status: 'Completed',
      plannedCost: 85000,
      actualCost: 79000,
      userId,
      startDate: from(8, 1),
      endDate: from(4, 20),
    },
    {
      name: 'ERP Rollout for Exams',
      methodology: 'Waterfall',
      industry: 'Education',
      size: 'Large',
      teamSize: 14,
      status: 'Completed',
      plannedCost: 220000,
      actualCost: 245000,
      userId,
      startDate: from(14, 3),
      endDate: from(7, 10),
    },
    {
      name: 'Faculty Mobile App',
      methodology: 'Agile',
      industry: 'Education',
      size: 'Small',
      teamSize: 5,
      status: 'Active',
      plannedCost: 60000,
      actualCost: 28000,
      userId,
      startDate: from(2, 12),
      endDate: null,
    },
    {
      name: 'Digital Library Migration',
      methodology: 'Hybrid',
      industry: 'Education',
      size: 'Medium',
      teamSize: 9,
      status: 'On Hold',
      plannedCost: 130000,
      actualCost: 54000,
      userId,
      startDate: from(5, 6),
      endDate: null,
    },
  ];
}

async function main() {
  const args = parseArgs();
  const email = args.email;
  const serviceAccountPath = args.serviceAccount || process.env.SERVICE_ACCOUNT;

  if (!email) {
    console.error('Missing --email argument.');
    process.exit(1);
  }

  if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
    console.error('Missing SERVICE_ACCOUNT path or file does not exist.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  try {
    const auth = admin.auth();
    const db = admin.firestore();

    const user = await auth.getUserByEmail(email);
    const userId = user.uid;

    const projects = sampleProjectsForUser(userId);
    const batch = db.batch();
    const projectsRef = db.collection('projects');

    for (const p of projects) {
      const docRef = projectsRef.doc();
      batch.set(docRef, {
        name: p.name,
        methodology: p.methodology,
        industry: p.industry,
        size: p.size,
        teamSize: p.teamSize,
        status: p.status,
        plannedCost: p.plannedCost,
        actualCost: p.actualCost,
        userId: p.userId,
        startDate: admin.firestore.Timestamp.fromDate(p.startDate),
        endDate: p.endDate ? admin.firestore.Timestamp.fromDate(p.endDate) : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`Seeded ${projects.length} demo projects for ${email} (${userId})`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed demo data:', err);
    process.exit(1);
  }
}

main();
