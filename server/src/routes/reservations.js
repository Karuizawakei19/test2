const express     = require('express');
const prisma      = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router      = express.Router();

// create a notification
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
          include: {
            provider: { select: { id: true, name: true, email: true, contactNumber: true } },
          },
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
        
        receiver: { select: { id: true, name: true, email: true, contactNumber: true } },
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

    await notify(
      reservation.receiverId,
      'reservation_accepted',
      `✅ ${provider.name} accepted your reservation for "${reservation.listing.foodName}"! Head over to pick it up.`,
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

    const noteText = providerNote ? ` Reason: "${providerNote}"` : '';
    await notify(
      reservation.receiverId,
      'reservation_declined',
      `${provider.name} declined your reservation for "${reservation.listing.foodName}".${noteText}`,
      '/receiver'
    );

    res.json({ message: 'Reservation declined.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline reservation.' });
  }
});

// ─────────────────────────────────────────
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
    if (!reservation)                           return res.status(404).json({ error: 'Reservation not found.' });
    if (reservation.receiverId !== receiver.id) return res.status(403).json({ error: 'This is not your reservation.' });
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

    await notify(
      reservation.listing.providerId,
      'reservation_cancelled',
      `${receiver.name} cancelled their reservation for "${reservation.listing.foodName}". The listing is available again.`,
      '/dashboard'
    );

    res.json({ message: 'Reservation cancelled.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel reservation.' });
  }
});

// ─────────────────────────────────────────
// PATCH /reservations/:id/provider-confirm  (provider)
// ─────────────────────────────────────────
router.patch('/:id/provider-confirm', verifyToken, async (req, res) => {
  try {
    const provider = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!provider)                    return res.status(404).json({ error: 'User not found.' });
    if (provider.role !== 'provider') return res.status(403).json({ error: 'Only providers can confirm pickup.' });

    const reservation = await prisma.reservation.findUnique({
      where:   { id: req.params.id },
      include: { listing: true, receiver: true },
    });
    if (!reservation)                                    return res.status(404).json({ error: 'Reservation not found.' });
    if (reservation.listing.providerId !== provider.id)  return res.status(403).json({ error: 'This is not your reservation.' });
    if (reservation.status !== 'accepted')               return res.status(400).json({ error: 'Reservation is not in accepted state.' });
    if (reservation.providerConfirmed)                   return res.status(400).json({ error: 'You already confirmed this pickup.' });

    const bothConfirmed = reservation.receiverConfirmed; // receiver already confirmed?

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        providerConfirmed:    true,
        providerConfirmedAt:  new Date(),
        ...(bothConfirmed && {
          status:       'confirmed',
          confirmedAt:  new Date(),
        }),
      },
    });

    if (bothConfirmed) {
      await prisma.foodListing.update({
        where: { id: reservation.listingId },
        data:  { status: 'picked_up' },
      });
      await notify(
        reservation.receiverId,
        'pickup_confirmed',
        `🎉 Pickup confirmed! "${reservation.listing.foodName}" has been rescued.`,
        '/receiver'
      );
    }

    res.json({
      message: bothConfirmed
        ? 'Pickup fully confirmed! Food has been rescued. 🎉'
        : 'Your confirmation recorded. Waiting for receiver to confirm.',
    });
  } catch (err) {
    console.error('provider-confirm error:', err);
    res.status(500).json({ error: 'Failed to confirm pickup.' });
  }
});

// ─────────────────────────────────────────
// PATCH /reservations/:id/receiver-confirm  (receiver)
// ─────────────────────────────────────────
router.patch('/:id/receiver-confirm', verifyToken, async (req, res) => {
  try {
    const receiver = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!receiver)                    return res.status(404).json({ error: 'User not found.' });
    if (receiver.role !== 'receiver') return res.status(403).json({ error: 'Only receivers can confirm receipt.' });

    const reservation = await prisma.reservation.findUnique({
      where:   { id: req.params.id },
      include: { listing: { include: { provider: true } } },
    });
    if (!reservation)                            return res.status(404).json({ error: 'Reservation not found.' });
    if (reservation.receiverId !== receiver.id)  return res.status(403).json({ error: 'This is not your reservation.' });
    if (reservation.status !== 'accepted')       return res.status(400).json({ error: 'Reservation is not in accepted state.' });
    if (reservation.receiverConfirmed)           return res.status(400).json({ error: 'You already confirmed receipt.' });

    const bothConfirmed = reservation.providerConfirmed; // provider already confirmed?

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        receiverConfirmed:    true,
        receiverConfirmedAt:  new Date(),
        ...(bothConfirmed && {
          status:       'confirmed',
          confirmedAt:  new Date(),
        }),
      },
    });

    if (bothConfirmed) {
      await prisma.foodListing.update({
        where: { id: reservation.listingId },
        data:  { status: 'picked_up' },
      });
      await notify(
        reservation.listing.providerId,
        'pickup_confirmed',
        `🎉 ${receiver.name} confirmed receipt of "${reservation.listing.foodName}". Pickup complete!`,
        '/dashboard'
      );
    }

    res.json({
      message: bothConfirmed
        ? 'Pickup fully confirmed! Food has been rescued. 🎉'
        : 'Your confirmation recorded. Waiting for provider to confirm handoff.',
    });
  } catch (err) {
    console.error('receiver-confirm error:', err);
    res.status(500).json({ error: 'Failed to confirm receipt.' });
  }
});

module.exports = router;