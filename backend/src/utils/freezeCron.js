const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Activate scheduled freezes ───
// Runs every day at 00:05 AM
const activateScheduledFreezes = async () => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Find all scheduled freezes that should start today or earlier
    const scheduledFreezes = await prisma.membershipFreeze.findMany({
      where: {
        status: 'SCHEDULED',
        freezeStartDate: { lte: now },
      },
      include: { membership: true },
    });

    for (const freeze of scheduledFreezes) {
      // Only activate if membership is still ACTIVE
      if (freeze.membership.status !== 'ACTIVE') {
        await prisma.membershipFreeze.update({
          where: { id: freeze.id },
          data: { status: 'CANCELLED' },
        });
        continue;
      }

      await prisma.$transaction([
        prisma.membershipFreeze.update({
          where: { id: freeze.id },
          data: { status: 'ACTIVE' },
        }),
        prisma.membership.update({
          where: { id: freeze.membershipId },
          data: {
            status: 'FROZEN',
            totalFreezeCountUsed: { increment: 1 },
          },
        }),
      ]);

      console.log(`[CRON] Activated freeze ${freeze.id} for membership ${freeze.membershipId}`);
    }

    if (scheduledFreezes.length > 0) {
      console.log(`[CRON] Activated ${scheduledFreezes.length} scheduled freezes`);
    }
  } catch (error) {
    console.error('[CRON] Error activating scheduled freezes:', error);
  }
};

// ─── Auto-unfreeze expired freezes ───
// Runs every day at 00:10 AM
const autoUnfreeze = async () => {
  try {
    const now = new Date();

    // Find all active freezes that have reached their end date
    const expiredFreezes = await prisma.membershipFreeze.findMany({
      where: {
        status: 'ACTIVE',
        freezeEndDate: { lte: now },
      },
      include: { membership: true },
    });

    for (const freeze of expiredFreezes) {
      // Use requestedDays for auto-unfreeze since the full freeze period completed
      const actualDays = freeze.requestedDays;

      // TC4 + TC10: Extend membership end date AFTER freeze completes
      const newEndDate = new Date(freeze.membership.endDate);
      newEndDate.setDate(newEndDate.getDate() + actualDays);

      await prisma.$transaction([
        prisma.membershipFreeze.update({
          where: { id: freeze.id },
          data: {
            status: 'AUTO_COMPLETED',
            actualDays,
          },
        }),
        prisma.membership.update({
          where: { id: freeze.membershipId },
          data: {
            status: 'ACTIVE',
            endDate: newEndDate,
            totalFreezeDaysUsed: { increment: actualDays },
          },
        }),
      ]);

      console.log(`[CRON] Auto-unfroze membership ${freeze.membershipId}, extended by ${actualDays} days`);
    }

    if (expiredFreezes.length > 0) {
      console.log(`[CRON] Auto-unfroze ${expiredFreezes.length} memberships`);
    }
  } catch (error) {
    console.error('[CRON] Error auto-unfreezing:', error);
  }
};

// ─── Expire memberships that have passed their end date ───
const expireMemberships = async () => {
  try {
    const now = new Date();

    // Only expire ACTIVE memberships (not FROZEN ones - they get extended)
    const result = await prisma.membership.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      console.log(`[CRON] Expired ${result.count} memberships`);
    }
  } catch (error) {
    console.error('[CRON] Error expiring memberships:', error);
  }
};

// ─── Start all cron jobs ───
const startFreezeCron = () => {
  // Run every day at 00:05 - activate scheduled freezes
  cron.schedule('5 0 * * *', activateScheduledFreezes);

  // Run every day at 00:10 - auto-unfreeze expired freezes
  cron.schedule('10 0 * * *', autoUnfreeze);

  // Run every day at 00:15 - expire memberships
  cron.schedule('15 0 * * *', expireMemberships);

  console.log('[CRON] Freeze cron jobs scheduled');
};

module.exports = { startFreezeCron, activateScheduledFreezes, autoUnfreeze, expireMemberships };
