
const express = require('express');
const admin = require('../firebase');
const prisma = require('../db');
const router = express.Router();

// ─────────────────────────────────────────
// POST /auth/register
// Creates a new user account
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {



  const { email, password, name, role } = req.body;

  // VALIDATION 

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Role must be exactly one of these two
  if (role !== 'provider' && role !== 'receiver') {
    return res.status(400).json({ error: 'Role must be provider or receiver.' });
  }

  // Password must be at least 6 characters (Firebase minimum)
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    //Create user in Firebase
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
    });

    // Save user profile in OUR database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        firebaseUid: firebaseUser.uid,
      },
    });

    // Return success
    res.status(201).json({
      message: 'Account created successfully!',
      userId: user.id,
      role: user.role,
      name: user.name,
    });

  } catch (error) {
    //  gives error messages
    console.error('Register error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// POST /auth/me
// ─────────────────────────────────────────
router.post('/me', async (req, res) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verify the token
    const decoded = await admin.auth().verifyIdToken(token);

    // Find this user in database using Firebase uid
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in database.' });
    }

    // Return the user profile 
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

  } catch (error) {
    console.error('Me error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

module.exports = router;