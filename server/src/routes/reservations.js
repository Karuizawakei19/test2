
// Returns the reservation history for the logged-in receiver

const express = require('express');
const prisma = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

// GET /reservations/mine
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const receiver = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid },
    });

    if (!receiver) return res.status(404).json({ error: 'User not found.' });
    if (receiver.role !== 'receiver') {
      return res.status(403).json({ error: 'Only receivers have reservation history.' });
    }

    const reservations = await prisma.reservation.findMany({
      where: { receiverId: receiver.id },
      orderBy: { reservedAt: 'desc' },  // most recent first
      include: {
        listing: {
          include: {
            provider: { select: { name: true } },  // include provider name
          },
        },
      },
    });

    res.json({ reservations });

  } catch (error) {
    console.error('Get reservations error:', error.message);
    res.status(500).json({ error: 'Failed to fetch reservation history.' });
  }
});

module.exports = router;