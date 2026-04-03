const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { addDuration, getCronSchedule, isTestMode } = require('./timeHelper');

const prisma = new PrismaClient();

// ─── Activate scheduled freezes ───
// Runs every day at 00:05 AM
const activateScheduledFreezes = async () => {
  try {
    const now = new Date();
    if (!isTestMode()) now.setHours(0, 0, 0, 0);

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
      const newEndDate = addDuration(freeze.membership.endDate, actualDays);

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
  // In test mode: every minute | Normal: daily at scheduled times
  cron.schedule(getCronSchedule('5 0 * * *'), activateScheduledFreezes);
  cron.schedule(getCronSchedule('10 0 * * *'), autoUnfreeze);
  cron.schedule(getCronSchedule('15 0 * * *'), expireMemberships);

  if (isTestMode()) {
    console.log('[CRON] TEST MODE: Cron jobs running every minute (1 day = 1 minute)');
  } else {
    console.log('[CRON] Freeze cron jobs scheduled (daily)');
  }
};

module.exports = { startFreezeCron, activateScheduledFreezes, autoUnfreeze, expireMemberships };
