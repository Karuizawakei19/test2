

const express     = require('express');
const prisma      = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router      = express.Router();

// ─────────────────────────────────────────
// GET /receivers/:id
// ─────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const receiver = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!receiver || receiver.role !== 'receiver') {
      return res.status(404).json({ error: 'Receiver not found.' });
    }

    // All-time reservation stats
    const totalReservations = await prisma.reservation.count({
      where: { receiverId: receiver.id },
    });
    const totalRescued = await prisma.reservation.count({
      where: { receiverId: receiver.id, status: 'confirmed' },
    });
    const totalCancelled = await prisma.reservation.count({
      where: { receiverId: receiver.id, status: 'cancelled' },
    });
    const totalDeclined = await prisma.reservation.count({
      where: { receiverId: receiver.id, status: 'declined' },
    });

    // Recent confirmed pickups (last 10) — public facing
    const recentPickups = await prisma.reservation.findMany({
      where:   { receiverId: receiver.id, status: 'confirmed' },
      orderBy: { reservedAt: 'desc' },
      take:    10,
      include: {
        listing: {
          select: {
            foodName:     true,
            foodCategory: true,
            imageUrl:     true,
            address:      true,
            provider: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Ratings they have given (to show how active they are as a reviewer)
    const ratingsGiven = await prisma.rating.count({
      where: { raterId: receiver.id },
    });

    // Member since
    const memberSince = receiver.createdAt;

    res.json({
      receiver: {
        id:            receiver.id,
        name:          receiver.name,
        contactNumber: receiver.contactNumber,
        memberSince,
      },
      stats: {
        totalReservations,
        totalRescued,
        totalCancelled,
        totalDeclined,
        ratingsGiven,
        // Reliability score: confirmed / (confirmed + cancelled) * 100
        reliabilityPct: (totalRescued + totalCancelled) > 0
          ? Math.round((totalRescued / (totalRescued + totalCancelled)) * 100)
          : null,
      },
      recentPickups,
    });

  } catch (err) {
    console.error('Receiver profile error:', err.message);
    res.status(500).json({ error: 'Failed to load receiver profile.' });
  }
});

module.exports = router;