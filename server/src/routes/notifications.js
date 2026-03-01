

const express     = require('express');
const prisma      = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router      = express.Router();

// GET /notifications  
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const notifications = await prisma.notification.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take:    30,   // last 30 only
    });

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// PATCH /notifications/read-all
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data:  { read: true },
    });

    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

module.exports = router;