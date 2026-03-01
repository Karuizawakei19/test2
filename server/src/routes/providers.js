

const express = require('express');
const prisma  = require('../db');
const router  = express.Router();

// ─────────────────────────────────────────
// GET /providers/:id
// ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const provider = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ error: 'Provider not found.' });
    }

    // Active listings
    const activeListings = await prisma.foodListing.findMany({
      where:   { providerId: provider.id, status: 'available' },
      orderBy: { expiresAt: 'asc' },
    });

    // All-time stats
    const totalListings  = await prisma.foodListing.count({ where: { providerId: provider.id } });
    const totalRescued   = await prisma.foodListing.count({ where: { providerId: provider.id, status: 'picked_up' } });

    // Ratings
    const ratings = await prisma.rating.findMany({
      where:   { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
      include: { rater: { select: { name: true } } },
    });
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / ratings.length) * 10) / 10
      : null;

    res.json({
      provider: {
        id:            provider.id,
        name:          provider.name,
        contactNumber: provider.contactNumber,
      },
      stats: {
        totalListings,
        totalRescued,
        avgRating,
        totalRatings: ratings.length,
      },
      activeListings,
      ratings,
    });

  } catch (err) {
    console.error('Provider profile error:', err.message);
    res.status(500).json({ error: 'Failed to load provider profile.' });
  }
});

module.exports = router;