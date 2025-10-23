/*
 Admin script to update an existing Firebase Auth user's email and password using Firebase Admin SDK.
 Usage:
   1. Obtain a Firebase service account JSON from Firebase Console -> Project Settings -> Service accounts -> Generate new private key
   2. Save it somewhere local, e.g., ./serviceAccountKey.json (DO NOT commit this file to source control)
   3. Run:
      SERVICE_ACCOUNT=./serviceAccountKey.json NODE_ENV=production node ./scripts/updateUserAdmin.js --findEmail old@example.com --newEmail new@example.com --newPassword newPass123

 Notes:
 - The script will locate the user by `findEmail` and update their email and password in-place.
 - The user's UID will remain the same; Firestore documents that reference `userId` do not need migration.
 - If you instead need to move documents from one UID to another (e.g., merging accounts), pass --transferToUid <targetUid> and the script will reassign `projects` documents.
*/

import fs from 'fs';
import path from 'path';
import { argv } from 'process';
import admin from 'firebase-admin';

function usage() {
  console.log('Usage: node scripts/updateUserAdmin.js --serviceAccount <path> --findEmail <oldEmail> --newEmail <newEmail> --newPassword <newPassword> [--transferToUid <uid>]');
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
  const findEmail = args.findEmail;
  const newEmail = args.newEmail;
  const newPassword = args.newPassword;
  const transferToUid = args.transferToUid;

  if (!serviceAccountPath || !findEmail || !newEmail || !newPassword) {
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
    console.log('Looking up user by email:', findEmail);
    const userRecord = await admin.auth().getUserByEmail(findEmail);
    console.log('Found user:', userRecord.uid);

    // Update email and password
    const updated = await admin.auth().updateUser(userRecord.uid, {
      email: newEmail,
      password: newPassword,
      emailVerified: false,
    });

    console.log('User updated:', updated.uid, updated.email);

    // Optionally transfer projects from one uid to another
    if (transferToUid) {
      console.log('Transferring projects from', userRecord.uid, 'to', transferToUid);
      const db = admin.firestore();
      const projectsRef = db.collection('projects');
      const snapshot = await projectsRef.where('userId', '==', userRecord.uid).get();
      console.log('Found', snapshot.size, 'projects to transfer');
      const batch = db.batch();
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { userId: transferToUid });
      });
      await batch.commit();
      console.log('Projects transferred');
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
