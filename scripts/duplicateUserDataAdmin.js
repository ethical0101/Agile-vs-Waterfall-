/*
 Duplicate an existing user's Firestore `projects` documents to a new user.
 Usage:
   1. Get service account JSON from Firebase Console and save locally (e.g., ./serviceAccountKey.json)
   2. Run:
      SERVICE_ACCOUNT=./serviceAccountKey.json node ./scripts/duplicateUserDataAdmin.js --oldEmail old@example.com --newEmail new@example.com --newPassword newPass123

 What it does:
 - Looks up the old user by email (must exist)
 - Looks up the new user by email; if it exists, uses its UID; otherwise creates the new user with provided password
 - Copies all documents from `projects` collection where userId == oldUid into new documents with userId set to newUid
 - Keeps other fields intact (timestamps and values)
 - Prints a summary of created documents

 Security:
 - Run this script only from a trusted environment. Do not commit service account JSON.
*/

import fs from 'fs';
import { argv } from 'process';
import admin from 'firebase-admin';

function usage() {
  console.log('Usage: node scripts/duplicateUserDataAdmin.js --serviceAccount <path> --oldEmail <oldEmail> --newEmail <newEmail> --newPassword <newPassword>');
}

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

async function main() {
  const args = parseArgs();
  const serviceAccountPath = args.serviceAccount || process.env.SERVICE_ACCOUNT;
  // Support positional args fallback: node script.js <oldEmail> <newEmail> <newPassword>
  const oldEmail = args.oldEmail || argv[2];
  const newEmail = args.newEmail || argv[3];
  const newPassword = args.newPassword || argv[4];

  if (!serviceAccountPath || !oldEmail || !newEmail || !newPassword) {
    usage();
    process.exit(1);
  }

  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Service account key file not found at', serviceAccountPath);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  try {
    const auth = admin.auth();
    const db = admin.firestore();

    console.log('Looking up old user by email:', oldEmail);
    const oldUser = await auth.getUserByEmail(oldEmail);
    console.log('Found old user UID:', oldUser.uid);

    let newUser;
    try {
      newUser = await auth.getUserByEmail(newEmail);
      console.log('New email already exists. Using existing UID:', newUser.uid);
    } catch (e) {
      console.log('New user does not exist. Creating user:', newEmail);
      newUser = await auth.createUser({
        email: newEmail,
        password: newPassword,
        emailVerified: false,
      });
      console.log('Created new user UID:', newUser.uid);
    }

    const oldUid = oldUser.uid;
    const newUid = newUser.uid;

    // Find all projects for oldUid
    const projectsRef = db.collection('projects');
    const snapshot = await projectsRef.where('userId', '==', oldUid).get();
    console.log('Found', snapshot.size, 'projects for old user.');

    let createdCount = 0;
    const batch = db.batch();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const newDocRef = projectsRef.doc(); // create new document with new ID
      const newData = {
        ...data,
        userId: newUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      batch.set(newDocRef, newData);
      createdCount += 1;
    });

    if (createdCount > 0) {
      await batch.commit();
      console.log('Created', createdCount, 'project documents for new user.');
    } else {
      console.log('No projects to duplicate.');
    }

    console.log('Duplication complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
