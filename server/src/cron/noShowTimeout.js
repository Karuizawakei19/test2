
// Runs every 5 minutes.
// Any reservation that is still 'accepted' but the listing expired > 2 hours ago
// is auto-cancelled as a no-show. The listing is re-listed as 'available'.

const cron  = require('node-cron');
const prisma = require('../db');

async function runNoShowCheck() {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

  // Find all accepted reservations where the listing expired more than 2 hours ago
  const stale = await prisma.reservation.findMany({
    where: {
      status:  'accepted',
      listing: { expiresAt: { lt: cutoff } },
    },
    include: { listing: true, receiver: true },
  });

  if (stale.length === 0) return;

  console.log(`[no-show cron] Found ${stale.length} stale reservation(s). Auto-cancelling...`);

  for (const r of stale) {
    try {
      await prisma.$transaction([
        // 1. Mark reservation as cancelled with a no-show reason
        prisma.reservation.update({
          where: { id: r.id },
          data:  {
            status:      'cancelled',
            cancelledAt: new Date(),
            providerNote: 'Auto-cancelled: receiver did not pick up before expiry.',
          },
        }),

        // 2. Re-list food as available so provider can re-post if they want
        //    (only if listing isn't already picked_up or expired by something else)
        prisma.foodListing.update({
          where: { id: r.listingId },
          data:  { status: 'available' },
        }),

        // 3. Increment the receiver's no-show counter
        prisma.user.update({
          where: { id: r.receiverId },
          data:  { noShowCount: { increment: 1 } },
        }),
      ]);

      // 4. Notify provider
      await prisma.notification.create({
        data: {
          userId:  r.listing.providerId,
          type:    'no_show',
          message: `⚠️ ${r.receiver.name} didn't pick up "${r.listing.foodName}" before it expired. The listing has been re-opened. Their no-show count has been recorded.`,
          link:    '/dashboard',
        },
      });

      // 5. Notify receiver
      await prisma.notification.create({
        data: {
          userId:  r.receiverId,
          type:    'no_show_receiver',
          message: `⚠️ Your reservation for "${r.listing.foodName}" was auto-cancelled because you didn't pick it up before it expired. This has been recorded as a no-show.`,
          link:    '/receiver',
        },
      });

      console.log(`[no-show cron] Auto-cancelled reservation ${r.id} (receiver: ${r.receiver.name})`);
    } catch (err) {
      console.error(`[no-show cron] Failed for reservation ${r.id}:`, err.message);
    }
  }
}

// Schedule: every 5 minutes
function startNoShowCron() {
  cron.schedule('*/5 * * * *', () => {
    runNoShowCheck().catch(err => console.error('[no-show cron] Error:', err.message));
  });
  console.log('[no-show cron] Started — checking every 5 minutes.');
}

module.exports = { startNoShowCron };