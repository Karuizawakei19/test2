const express = require('express');
const prisma = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

// ─────────────────────────────────────────
// POST /listings
// Provider posts a new food listing
// verifyToken runs first
// ─────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  

  const { foodName, quantity, originalPrice, expiresAt, address, latitude, longitude } = req.body;

  // Validate all fields are present 
  if (!foodName || !quantity || !originalPrice || !expiresAt || !address || !latitude || !longitude) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  //  Validate the expiry time 
  const now = new Date();
  const expiry = new Date(expiresAt);

  // expiresAt must be a valid date
  if (isNaN(expiry.getTime())) {
    return res.status(400).json({ error: 'Invalid expiry date.' });
  }

  // expiresAt must be in the future
  if (expiry <= now) {
    return res.status(400).json({ error: 'Expiry time must be in the future.' });
  }

  // expiresAt cannot be more than 72 hours from now
  const maxExpiry = new Date(now.getTime() + 72 * 60 * 60 * 1000); 
  if (expiry > maxExpiry) {
    return res.status(400).json({ error: 'Expiry time cannot be more than 72 hours from now.' });
  }

  // Find the provider in db 
  const provider = await prisma.user.findUnique({
    where: { firebaseUid: req.user.uid },
  });

  if (!provider) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Only providers can post food
  if (provider.role !== 'provider') {
    return res.status(403).json({ error: 'Only providers can post food listings.' });
  }

  //  Save the listing to the database 
  try {
    const listing = await prisma.foodListing.create({
      data: {
        foodName,
        quantity: parseInt(quantity),         
        originalPrice: parseFloat(originalPrice), 
        expiresAt: expiry,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        providerId: provider.id, // link to the provider
      },
    });

    // Return the created listing
    res.status(201).json({
      message: 'Food listed successfully!',
      listing,
    });

  } catch (error) {
    console.error('Post listing error:', error.message);
    res.status(500).json({ error: 'Failed to save listing.' });
  }
});

// ─────────────────────────────────────────
// GET /listings —  placeholder
// ─────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({ message: 'Get listings — place holder' });
});

// ─────────────────────────────────────────
// POST /listings/:id/reserve — placeholder
// ─────────────────────────────────────────
router.post('/:id/reserve', (req, res) => {
  res.json({ message: 'Reserve — placeholder' });
});

// ─────────────────────────────────────────
// PATCH /listings/:id/confirm — placeholder
// ─────────────────────────────────────────
router.patch('/:id/confirm', (req, res) => {
  res.json({ message: 'Confirm pickup — placeholder' });
});

module.exports = router;