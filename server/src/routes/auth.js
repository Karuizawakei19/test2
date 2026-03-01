const express = require('express');
const admin   = require('../firebase');
const prisma  = require('../db');
const router  = express.Router();

// ─────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, name, role, contactNumber } = req.body;  // ← add contactNumber

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (role !== 'provider' && role !== 'receiver') {
    return res.status(400).json({ error: 'Role must be provider or receiver.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  // Basic PH number validation 
  if (contactNumber && !/^(09|\+639)\d{9}$/.test(contactNumber.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Please enter a valid Philippine mobile number (e.g. 09171234567).' });
  }

  try {
    const firebaseUser = await admin.auth().createUser({ email, password });

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        firebaseUid:   firebaseUser.uid,
        contactNumber: contactNumber?.trim() || null,   
      },
    });

    res.status(201).json({
      message: 'Account created successfully!',
      userId:  user.id,
      role:    user.role,
      name:    user.name,
    });

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// POST /auth/me
// ─────────────────────────────────────────
router.post('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const user    = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });

    if (!user) return res.status(404).json({ error: 'User not found in database.' });

    res.json({
      id:            user.id,
      email:         user.email,
      name:          user.name,
      role:          user.role,
      contactNumber: user.contactNumber,   
    });

  } catch (error) {
    console.error('Me error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

module.exports = router;