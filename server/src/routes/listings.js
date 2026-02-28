// server/src/routes/listings.js

const express = require('express');
const prisma = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

// ─────────────────────────────────────────
// HELPER 1: PRICE DECAY
// ─────────────────────────────────────────
function calculateCurrentPrice(originalPrice, createdAt, expiresAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const expiry = new Date(expiresAt);

  // Total lifespan in milliseconds
  const totalTime = expiry - created;

  //  time left until expiry in milliseconds
  const timeLeft = expiry - now;

  // Already expired _ price is 0
  if (timeLeft <= 0 || totalTime <= 0) return 0;

  // ratio: 1.0 = just posted (full price), 0.0 = about to expire 
  const ratio = timeLeft / totalTime;

  // Round to 2 decimal places e.g. 45.50
  return Math.round(originalPrice * ratio * 100) / 100;
}

// ─────────────────────────────────────────
// HELPER 2: HAVERSINE DISTANCE
// ─────────────────────────────────────────
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km

  // Convert degrees to radians — required for the math
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // final distance in km
}

// ─────────────────────────────────────────
// GET /listings?lat=14.65&lng=121.07
// Returns available listings with distance + price decay applied
// Filtered to within 10km, sorted by nearest then soonest expiry
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  const receiverLat = parseFloat(req.query.lat);
  const receiverLng = parseFloat(req.query.lng);

  // Check if valid coordinates were sent
  const hasLocation = !isNaN(receiverLat) && !isNaN(receiverLng);

  try {
    // Fetch all available listings from DB
    const listings = await prisma.foodListing.findMany({
      where: { status: 'available' },
      include: {
        provider: {
          select: { name: true } 
        }
      }
    });

    // Padd currentPrice and distanceKm
    let processed = listings.map(listing => {
      // Calculate the decayed price right now
      const currentPrice = calculateCurrentPrice(
        listing.originalPrice,
        listing.createdAt,
        listing.expiresAt
      );

      // Calculate distance
      let distanceKm = null;
      if (hasLocation) {
        const raw = getDistanceKm(
          receiverLat, receiverLng,
          listing.latitude, listing.longitude
        );
        distanceKm = Math.round(raw * 10) / 10;
      }

      return {
        ...listing,          // spread all original listing fields
        currentPrice,        // add the decayed price
        distanceKm,          // add the distance
      };
    });

    // Filter: only show listings within 10km
    // If no location sent, show all listings (no filter)
    if (hasLocation) {
      processed = processed.filter(l => l.distanceKm !== null && l.distanceKm <= 10);
    }

    // Sort: nearest first, then soonest expiry
    processed.sort((a, b) => {
      
      if (a.distanceKm !== null && b.distanceKm !== null) {
        if (a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm; 
        }
      }
    
      return new Date(a.expiresAt) - new Date(b.expiresAt);
    });

    res.json({ listings: processed });

  } catch (error) {
    console.error('Get listings error:', error.message);
    res.status(500).json({ error: 'Failed to fetch listings.' });
  }
});

// ─────────────────────────────────────────
// GET /listings/mine
// Returns only the logged-in provider's listings
// Used by ProviderDashboard
// ─────────────────────────────────────────
router.get('/mine', verifyToken, async (req, res) => {
  try {
    
    const provider = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid }
    });

    if (!provider) {
      return res.status(404).json({ error: 'User not found.' });
    }

    
    // ordered by newest first
    const listings = await prisma.foodListing.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
    });

    // Add currentPrice to each listing
    const processed = listings.map(listing => ({
      ...listing,
      currentPrice: calculateCurrentPrice(
        listing.originalPrice,
        listing.createdAt,
        listing.expiresAt
      ),
    }));

    res.json({ listings: processed });

  } catch (error) {
    console.error('Get mine error:', error.message);
    res.status(500).json({ error: 'Failed to fetch your listings.' });
  }
});

// ─────────────────────────────────────────
// POST /listings
// ─────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { foodName, quantity, originalPrice, expiresAt, address, latitude, longitude } = req.body;

  if (!foodName || !quantity || !originalPrice || !expiresAt || !address || !latitude || !longitude) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const now = new Date();
  const expiry = new Date(expiresAt);

  if (isNaN(expiry.getTime())) {
    return res.status(400).json({ error: 'Invalid expiry date.' });
  }
  if (expiry <= now) {
    return res.status(400).json({ error: 'Expiry time must be in the future.' });
  }
  const maxExpiry = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  if (expiry > maxExpiry) {
    return res.status(400).json({ error: 'Expiry time cannot be more than 72 hours from now.' });
  }

  const provider = await prisma.user.findUnique({
    where: { firebaseUid: req.user.uid },
  });

  if (!provider) return res.status(404).json({ error: 'User not found.' });
  if (provider.role !== 'provider') return res.status(403).json({ error: 'Only providers can post food listings.' });

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
        providerId: provider.id,
      },
    });
    res.status(201).json({ message: 'Food listed successfully!', listing });
  } catch (error) {
    console.error('Post listing error:', error.message);
    res.status(500).json({ error: 'Failed to save listing.' });
  }
});

// ─────────────────────────────────────────
// POST /listings/:id/reserve 
// ─────────────────────────────────────────
router.post('/:id/reserve', (req, res) => {
  res.json({ message: 'Reserve — test' });
});

// ─────────────────────────────────────────
// PATCH /listings/:id/confirm 
// ─────────────────────────────────────────
router.patch('/:id/confirm', (req, res) => {
  res.json({ message: 'Confirm pickup — test' });
});

module.exports = router;