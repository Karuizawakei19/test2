

const express     = require('express');
const prisma      = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router      = express.Router();

// ─────────────────────────────────────────
// POST /ratings
// ─────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { reservationId, score, comment } = req.body;

  if (!reservationId || !score) {
    return res.status(400).json({ error: 'reservationId and score are required.' });
  }
  if (score < 1 || score > 5 || !Number.isInteger(Number(score))) {
    return res.status(400).json({ error: 'Score must be a whole number between 1 and 5.' });
  }

  try {
    const receiver = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!receiver)                    return res.status(404).json({ error: 'User not found.' });
    if (receiver.role !== 'receiver') return res.status(403).json({ error: 'Only receivers can leave ratings.' });

    const reservation = await prisma.reservation.findUnique({
      where:   { id: reservationId },
      include: { listing: true },
    });
    if (!reservation)                            return res.status(404).json({ error: 'Reservation not found.' });
    if (reservation.receiverId !== receiver.id)  return res.status(403).json({ error: 'This is not your reservation.' });
    if (reservation.status !== 'confirmed')      return res.status(400).json({ error: 'You can only rate after the pickup is confirmed.' });

    // Check not already rated
    const existing = await prisma.rating.findUnique({ where: { reservationId } });
    if (existing) return res.status(400).json({ error: 'You have already rated this pickup.' });

    const rating = await prisma.rating.create({
      data: {
        score:         Number(score),
        comment:       comment?.trim() || null,
        raterId:       receiver.id,
        providerId:    reservation.listing.providerId,
        reservationId,
      },
    });

    // Notify the provider
    await prisma.notification.create({
      data: {
        userId:  reservation.listing.providerId,
        type:    'new_rating',
        message: `⭐ ${receiver.name} gave you ${score} star${score > 1 ? 's' : ''}${comment ? `: "${comment.slice(0, 60)}"` : ''}`,
        link:    `/provider/${reservation.listing.providerId}`,
      },
    });

    res.status(201).json({ rating });
  } catch (err) {
    console.error('Rating error:', err.message);
    res.status(500).json({ error: 'Failed to save rating.' });
  }
});

// ─────────────────────────────────────────
// GET /ratings/provider/:providerId
// ─────────────────────────────────────────
router.get('/provider/:providerId', async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where:   { providerId: req.params.providerId },
      orderBy: { createdAt: 'desc' },
      include: { rater: { select: { name: true } } },
    });

    const avg = ratings.length
      ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / ratings.length) * 10) / 10
      : null;

    res.json({ ratings, average: avg, total: ratings.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ratings.' });
  }
});

// ─────────────────────────────────────────
// GET /ratings/check/:reservationId
// ─────────────────────────────────────────
router.get('/check/:reservationId', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.rating.findUnique({
      where: { reservationId: req.params.reservationId },
    });
    res.json({ rated: !!existing, rating: existing || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check rating.' });
  }
});

module.exports = router;