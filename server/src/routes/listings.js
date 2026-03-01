// server/src/routes/listings.js

const express = require('express');
const prisma = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

// ─────────────────────────────────────────
// HELPER 1: PRICE DECAY — steps every 15 minutes, whole numbers only
// ─────────────────────────────────────────
function calculateCurrentPrice(originalPrice, createdAt, expiresAt, allowFree, minimumPrice) {
  const now = new Date();
  const created = new Date(createdAt);
  const expiry = new Date(expiresAt);

  // Already expired
  if (now >= expiry) {
    return allowFree ? 0 : minimumPrice;
  }

  const totalMinutes = (expiry - created) / (1000 * 60);

  const elapsedMinutes = (now - created) / (1000 * 60);


  const INTERVAL = 15; 
  const totalSlots = Math.floor(totalMinutes / INTERVAL);  
  const passedSlots = Math.floor(elapsedMinutes / INTERVAL); 

  if (totalSlots === 0) return originalPrice;

  const floor = allowFree ? 0 : Math.round(minimumPrice);
  const droppableAmount = originalPrice - floor;
  const dropPerSlot = droppableAmount / totalSlots;

  const decayed = originalPrice - (passedSlots * dropPerSlot);

  const result = Math.max(floor, Math.round(decayed));

  return result;
}

// ─────────────────────────────────────────
// HELPER 2: HAVERSINE DISTANCE
// ─────────────────────────────────────────
function getDistanceKm(lat1, lon1, lat2, lon2) {
}


// ─────────────────────────────────────────
// GET /listings?lat=14.65&lng=121.07
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  const receiverLat = parseFloat(req.query.lat);
  const receiverLng = parseFloat(req.query.lng);
  const hasLocation = !isNaN(receiverLat) && !isNaN(receiverLng);

  try {
    const listings = await prisma.foodListing.findMany({
      where: { status: 'available' },
      include: { provider: { select: { name: true } } }
    });

    let processed = listings.map(listing => {
      const currentPrice = calculateCurrentPrice(
        listing.originalPrice,
        listing.createdAt,
        listing.expiresAt,
        listing.allowFree,
        listing.minimumPrice
      );

      let distanceKm = null;
      if (hasLocation) {
        const raw = getDistanceKm(receiverLat, receiverLng, listing.latitude, listing.longitude);
        distanceKm = Math.round(raw * 10) / 10;
      }

      return { ...listing, currentPrice, distanceKm };
    });

    if (hasLocation) {
      processed = processed.filter(l => l.distanceKm !== null && l.distanceKm <= 10);
    }

    processed.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
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
// ─────────────────────────────────────────
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const provider = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid }
    });

    if (!provider) return res.status(404).json({ error: 'User not found.' });

    const listings = await prisma.foodListing.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
    });

    const processed = listings.map(listing => ({
      ...listing,
      currentPrice: calculateCurrentPrice(
        listing.originalPrice,
        listing.createdAt,
        listing.expiresAt,
        listing.allowFree,
        listing.minimumPrice
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
  const {
    foodName, quantity, originalPrice,
    expiresAt, address, latitude, longitude,
    allowFree, minimumPrice, storageCondition, pickupWindowStart, pickupWindowEnd,
    foodCategory, imageUrl     
  } = req.body;


  if (!foodName || !quantity || !originalPrice || !expiresAt || !address || !latitude || !longitude) {
    return res.status(400).json({ error: 'All fields are required. Please allow location access to post food.' });
  }

  const now = new Date();
  const expiry = new Date(expiresAt);

  if (isNaN(expiry.getTime())) {
    return res.status(400).json({ error: 'Invalid expiry date.' });
  }

  
  if (expiry <= now) {
    return res.status(400).json({ error: 'Expiry time must be in the future.' });
  }

  // Validate pickup window 
  if (pickupWindowStart && pickupWindowEnd) {
    const windowStart = new Date(pickupWindowStart);
    const windowEnd   = new Date(pickupWindowEnd);

    if (isNaN(windowStart.getTime()) || isNaN(windowEnd.getTime())) {
      return res.status(400).json({ error: 'Invalid pickup window dates.' });
    }
    if (windowEnd <= windowStart) {
      return res.status(400).json({ error: 'Pickup window end time must be after the start time.' });
    }
    if (windowEnd > expiry) {
      return res.status(400).json({ error: 'Pickup window must end before the food expires.' });
    }
  }

  const resolvedCategory = foodCategory || 'other';

  if (resolvedCategory === 'prepared_meal') {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (expiry > endOfToday) {
      return res.status(400).json({
        error: 'Prepared meals can only be listed for same-day pickup. Set the expiry to before midnight today.'
      });
    }
  }
  
  const resolvedAllowFree = allowFree === true || allowFree === 'true';
  const resolvedMinimumPrice = parseFloat(minimumPrice) || 0;

  if (!resolvedAllowFree && resolvedMinimumPrice <= 0) {
    return res.status(400).json({ error: 'Please set a minimum price greater than ₱0, or allow the food to be free.' });
  }
  if (!resolvedAllowFree && resolvedMinimumPrice >= parseFloat(originalPrice)) {
    return res.status(400).json({ error: 'Minimum price must be lower than the original price.' });
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
        allowFree: resolvedAllowFree,
        minimumPrice: resolvedAllowFree ? 0 : resolvedMinimumPrice,
        foodCategory: resolvedCategory,
        imageUrl:      imageUrl || null,
        providerId: provider.id,
        storageCondition: storageCondition || 'room_temp',
        pickupWindowStart: pickupWindowStart ? new Date(pickupWindowStart) : null,
        pickupWindowEnd: pickupWindowEnd ? new Date(pickupWindowEnd) : null,
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
router.post('/:id/reserve', verifyToken, async (req, res) => {
  const listingId = req.params.id;

  try {
    const receiver = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!receiver) return res.status(404).json({ error: 'User not found.' });
    if (receiver.role !== 'receiver') return res.status(403).json({ error: 'Only receivers can reserve food.' });
    const listing = await prisma.foodListing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.status !== 'available') return res.status(400).json({ error: 'This food has already been reserved.' });
    if (new Date(listing.expiresAt) <= new Date()) return res.status(400).json({ error: 'This food has already expired.' });
   


    await prisma.$transaction([
      prisma.foodListing.update({ where: { id: listingId }, data: { status: 'reserved' } }),
      prisma.reservation.create({ data: { receiverId: receiver.id, listingId, status: 'pending' } }),
    ]);

    res.json({ message: 'Food reserved successfully! Head to the pickup location.' });

  } catch (error) {
    console.error('Reserve error:', error.message);
    res.status(500).json({ error: 'Failed to reserve listing.' });
  }
});

// ─────────────────────────────────────────
// PATCH /listings/:id/confirm
// ─────────────────────────────────────────
router.patch('/:id/confirm', verifyToken, async (req, res) => {
  const listingId = req.params.id;

  try {
    const provider = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!provider) return res.status(404).json({ error: 'User not found.' });
    if (provider.role !== 'provider') return res.status(403).json({ error: 'Only providers can confirm pickups.' });

    const listing = await prisma.foodListing.findUnique({
      where: { id: listingId },
      include: { reservations: true },
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.providerId !== provider.id) return res.status(403).json({ error: 'You can only confirm your own listings.' });
    if (listing.status !== 'reserved') return res.status(400).json({ error: 'This listing is not in a reserved state.' });

    const reservation = listing.reservations[0];
    if (!reservation) return res.status(404).json({ error: 'Reservation record not found.' });

    await prisma.$transaction([
      prisma.foodListing.update({ where: { id: listingId }, data: { status: 'picked_up' } }),
      prisma.reservation.update({ where: { id: reservation.id }, data: { status: 'confirmed' } }),
    ]);

    res.json({ message: 'Pickup confirmed! Food has been rescued.' });

  } catch (error) {
    console.error('Confirm error:', error.message);
    res.status(500).json({ error: 'Failed to confirm pickup.' });
  }
});

module.exports = router;
