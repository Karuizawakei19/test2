

const express     = require('express');
const prisma      = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router      = express.Router();

//  Helper: create a notification 
async function notify(userId, type, message, link = null) {
  await prisma.notification.create({ data: { userId, type, message, link } });
}

// ─────────────────────────────────────────
// GET /reservations/mine  (receiver)
// ─────────────────────────────────────────
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const receiver = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!receiver)                    return res.status(404).json({ error: 'User not found.' });
    if (receiver.role !== 'receiver') return res.status(403).json({ error: 'Only receivers have reservation history.' });

    const reservations = await prisma.reservation.findMany({
      where:   { receiverId: receiver.id },
      orderBy: { reservedAt: 'desc' },
      include: {
        listing: {
          include: { provider: { select: { name: true, email: true, contactNumber: true } } },
        },
      },
    });

    res.json({ reservations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservation history.' });
  }
});

// ─────────────────────────────────────────
// GET /reservations/pending  (provider)
// ─────────────────────────────────────────
router.get('/pending', verifyToken, async (req, res) => {
  try {
    const provider = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!provider)                    return res.status(404).json({ error: 'User not found.' });
    if (provider.role !== 'provider') return res.status(403).json({ error: 'Only providers can view pending reservations.' });

    const reservations = await prisma.reservation.findMany({
      where: {
        status:  { in: ['pending', 'accepted'] },
        listing: { providerId: provider.id },
      },
      orderBy: { reservedAt: 'asc' },
      include: {
        receiver: { select: { name: true, email: true, contactNumber: true } },
        listing:  true,
      },
    });

    res.json({ reservations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending reservations.' });
  }
});

// ─────────────────────────────────────────
// PATCH /reservations/:id/accept  (provider)
// ─────────────────────────────────────────
router.patch('/:id/accept', verifyToken, async (req, res) => {
  try {
    const provider = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!provider)                    return res.status(404).json({ error: 'User not found.' });
    if (provider.role !== 'provider') return res.status(403).json({ error: 'Only providers can accept reservations.' });

    const reservation = await prisma.reservation.findUnique({
      where:   { id: req.params.id },
      include: { listing: true, receiver: true },
    });
    if (!reservation)                                   return res.status(404).json({ error: 'Reservation not found.' });
    if (reservation.listing.providerId !== provider.id) return res.status(403).json({ error: 'This is not your listing.' });
    if (reservation.status !== 'pending')               return res.status(400).json({ error: 'This reservation is not pending.' });

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservation.id },
        data:  { status: 'accepted', acceptedAt: new Date() },
      }),
      prisma.foodListing.update({
        where: { id: reservation.listingId },
        data:  { status: 'accepted' },
      }),
    ]);


    // Notify receiver
    await notify(
      reservation.receiverId,
      'reservation_accepted',
      ` ${provider.name} accepted your reservation for "${reservation.listing.foodName}"! Head over to pick it up.`,
      `/chat/${reservation.id}`
    );

    res.json({ message: 'Reservation accepted!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept reservation.' });
  }
});

// ─────────────────────────────────────────
// PATCH /reservations/:id/decline  (provider)
// ─────────────────────────────────────────
router.patch('/:id/decline', verifyToken, async (req, res) => {
  const { providerNote } = req.body;

  try {
    const provider = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!provider)                    return res.status(404).json({ error: 'User not found.' });
    if (provider.role !== 'provider') return res.status(403).json({ error: 'Only providers can decline reservations.' });

    const reservation = await prisma.reservation.findUnique({
      where:   { id: req.params.id },
      include: { listing: true },
    });
    if (!reservation)                                   return res.status(404).json({ error: 'Reservation not found.' });
    if (reservation.listing.providerId !== provider.id) return res.status(403).json({ error: 'This is not your listing.' });
    if (reservation.status !== 'pending')               return res.status(400).json({ error: 'This reservation is not pending.' });

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservation.id },
        data:  { status: 'declined', declinedAt: new Date(), providerNote: providerNote || null },
      }),
      prisma.foodListing.update({
        where: { id: reservation.listingId },
        data:  { status: 'available' },
      }),
    ]);

    // Notify receiver
    const noteText = providerNote ? ` Reason: "${providerNote}"` : '';
    await notify(
      reservation.receiverId,
      'reservation_declined',
      `${provider.name} declined your reservation for "${reservation.listing.foodName}".${noteText}`,
      `/receiver`
    );

    res.json({ message: 'Reservation declined.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline reservation.' });
  }
});

// ────────────────────────��────────────────
// PATCH /reservations/:id/cancel  (receiver)
// ─────────────────────────────────────────
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const receiver = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!receiver)                    return res.status(404).json({ error: 'User not found.' });
    if (receiver.role !== 'receiver') return res.status(403).json({ error: 'Only receivers can cancel reservations.' });

    const reservation = await prisma.reservation.findUnique({
      where:   { id: req.params.id },
      include: { listing: true },
    });
    if (!reservation)                            return res.status(404).json({ error: 'Reservation not found.' });
    if (reservation.receiverId !== receiver.id)  return res.status(403).json({ error: 'This is not your reservation.' });
    if (!['pending', 'accepted'].includes(reservation.status)) {
      return res.status(400).json({ error: 'You can only cancel a pending or accepted reservation.' });
    }

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservation.id },
        data:  { status: 'cancelled', cancelledAt: new Date() },
      }),
      prisma.foodListing.update({
        where: { id: reservation.listingId },
        data:  { status: 'available' },
      }),
    ]);

    // Notify provider
    await notify(
      reservation.listing.providerId,
      'reservation_cancelled',
      ` ${receiver.name} cancelled their reservation for "${reservation.listing.foodName}". The listing is available again.`,
      `/dashboard`
    );

    res.json({ message: 'Reservation cancelled.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel reservation.' });
  }
});

module.exports = router;