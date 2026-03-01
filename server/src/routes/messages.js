

const express     = require('express');
const prisma      = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router      = express.Router();

// GET /messages/:reservationId  
router.get('/:reservationId', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const reservation = await prisma.reservation.findUnique({
      where:   { id: req.params.reservationId },
      include: { listing: true },
    });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

    
    const isReceiver = reservation.receiverId === user.id;
    const isProvider = reservation.listing.providerId === user.id;
    if (!isReceiver && !isProvider) return res.status(403).json({ error: 'Access denied.' });

    const messages = await prisma.message.findMany({
      where:   { reservationId: req.params.reservationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { name: true, role: true } } },
    });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST /messages/:reservationId 
router.post('/:reservationId', verifyToken, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });
  if (text.length > 500)     return res.status(400).json({ error: 'Message too long (max 500 characters).' });

  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const reservation = await prisma.reservation.findUnique({
      where:   { id: req.params.reservationId },
      include: { listing: true, receiver: true },
    });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

    const isReceiver = reservation.receiverId === user.id;
    const isProvider = reservation.listing.providerId === user.id;
    if (!isReceiver && !isProvider) return res.status(403).json({ error: 'Access denied.' });

    // Only allow chat if reservation is accepted
    if (!['accepted', 'confirmed'].includes(reservation.status)) {
      return res.status(400).json({ error: 'Chat is only available after the provider accepts the reservation.' });
    }

    // Save message
    const message = await prisma.message.create({
      data: {
        text:          text.trim(),
        senderId:      user.id,
        reservationId: reservation.id,
      },
      include: { sender: { select: { name: true, role: true } } },
    });

    // Notify the OTHER person
    const recipientId = isReceiver
      ? reservation.listing.providerId   // receiver sent → notify provider
      : reservation.receiverId;           // provider sent → notify receiver

    await prisma.notification.create({
      data: {
        userId:  recipientId,
        type:    'new_message',
        message: `New message from ${user.name}: "${text.trim().slice(0, 60)}${text.length > 60 ? '...' : ''}"`,
        link:    `/chat/${reservation.id}`,
      },
    });

    res.status(201).json({ message });
  } catch (err) {
    console.error('Send message error:', err.message);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;