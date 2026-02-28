const admin = require('firebase-admin');

require('dotenv').config(); // load .env at the very top

const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

if (!privateKeyRaw) {
  throw new Error("FIREBASE_PRIVATE_KEY is missing in your environment variables!");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        
    }),
  });
}

module.exports = admin;