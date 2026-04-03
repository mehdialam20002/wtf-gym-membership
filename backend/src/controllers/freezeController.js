const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { addDuration, getDurationBetween, isTestMode, getTimeUnit } = require('../utils/timeHelper');

const prisma = new PrismaClient();

// ─── USER: Request a freeze ───
const requestFreeze = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { membershipId } = req.params;
  const { startDate: startStr, freezeDays, reason } = req.body;

  try {
    // Get membership with plan freeze policy
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, userId: req.userId },
      include: {
        plan: { select: { maxFreezeCount: true, maxFreezeDays: true, name: true } },
        freezes: true,
      },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    // TC5: Only active memberships can be frozen
    if (membership.status !== 'ACTIVE') {
      return res.status(400).json({ error: `Cannot freeze a ${membership.status.toLowerCase()} membership` });
    }

    const maxCount = membership.plan.maxFreezeCount;
    const maxDays = membership.plan.maxFreezeDays;

    // Check if freeze is allowed for this plan
    if (maxCount === 0 || maxDays === 0) {
      return res.status(400).json({ error: 'Freeze is not available for this plan' });
    }

    // TC7: Check freeze count limit (count is incremented at creation, never returned)
    const usedCount = membership.totalFreezeCountUsed;
    if (usedCount >= maxCount) {
      return res.status(400).json({
        error: `Freeze limit reached. Maximum ${maxCount} freezes allowed for ${membership.plan.name}`,
        remainingFreezes: 0,
      });
    }

    // TC7: Check freeze days limit (days are deducted at creation, never returned)
    const usedDays = membership.totalFreezeDaysUsed;
    const remainingDays = maxDays - usedDays;
    if (freezeDays > remainingDays) {
      return res.status(400).json({
        error: `Only ${remainingDays} freeze days remaining out of ${maxDays}`,
        remainingDays,
      });
    }

    let freezeStart = new Date(startStr);
    const now = new Date();

    if (isTestMode()) {
      // In test mode, same calendar day = immediate freeze (use current time)
      const sameDay = freezeStart.toDateString() === now.toDateString();
      if (sameDay) {
        freezeStart = new Date(now); // start from now, not midnight
      } else if (freezeStart < now) {
        return res.status(400).json({ error: 'Freeze start date cannot be in the past' });
      }
    } else {
      now.setHours(0, 0, 0, 0);
      const freezeStartClean = new Date(freezeStart);
      freezeStartClean.setHours(0, 0, 0, 0);
      if (freezeStartClean < now) {
        return res.status(400).json({ error: 'Freeze start date cannot be in the past' });
      }
    }

    // TC10: Freeze start must be before membership end
    if (freezeStart >= membership.endDate) {
      return res.status(400).json({ error: 'Freeze start date must be before membership expiry' });
    }

    const freezeEnd = addDuration(freezeStart, freezeDays);

    // TC6: Check overlapping freezes (exclusive boundary - ending on same day as start is OK)
    const overlapping = await prisma.membershipFreeze.findFirst({
      where: {
        membershipId,
        status: { in: ['SCHEDULED', 'ACTIVE'] },
        freezeStartDate: { lt: freezeEnd },
        freezeEndDate: { gt: freezeStart },
      },
    });

    if (overlapping) {
      return res.status(400).json({ error: 'This freeze overlaps with an existing freeze' });
    }

    // Determine status: if start is today -> ACTIVE, else SCHEDULED
    let isToday;
    if (isTestMode()) {
      isToday = freezeStart.toDateString() === now.toDateString();
    } else {
      const freezeStartClean = new Date(freezeStart);
      freezeStartClean.setHours(0, 0, 0, 0);
      isToday = freezeStartClean.getTime() === now.getTime();
    }
    const status = isToday ? 'ACTIVE' : 'SCHEDULED';

    // Create freeze record
    const freeze = await prisma.membershipFreeze.create({
      data: {
        membershipId,
        freezeStartDate: freezeStart,
        freezeEndDate: freezeEnd,
        requestedDays: freezeDays,
        actualDays: 0,
        reason: reason || null,
        status,
      },
    });

    // Always increment freeze count + days at creation (once used, never returned)
    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: isToday ? 'FROZEN' : undefined,
        totalFreezeCountUsed: { increment: 1 },
        totalFreezeDaysUsed: { increment: freezeDays },
      },
    });

    res.status(201).json({
      freeze,
      message: isToday ? 'Membership frozen successfully' : `Freeze scheduled for ${freezeStart.toISOString().split('T')[0]}`,
      remainingFreezes: maxCount - usedCount - 1,
      remainingFreezeDays: remainingDays - freezeDays,
    });
  } catch (error) {
    console.error('Request freeze error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── USER: Cancel a scheduled freeze (before it starts) ───
const cancelFreeze = async (req, res) => {
  const { freezeId } = req.params;

  try {
    const freeze = await prisma.membershipFreeze.findUnique({
      where: { id: freezeId },
      include: { membership: true },
    });

    if (!freeze) {
      return res.status(404).json({ error: 'Freeze not found' });
    }

    // Verify ownership
    if (freeze.membership.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // TC8: Only scheduled freezes can be cancelled
    if (freeze.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Only scheduled (not yet started) freezes can be cancelled' });
    }

    await prisma.membershipFreeze.update({
      where: { id: freezeId },
      data: { status: 'CANCELLED' },
    });

    res.json({ message: 'Scheduled freeze cancelled successfully' });
  } catch (error) {
    console.error('Cancel freeze error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── USER: Manually unfreeze (end freeze early) ───
const unfreeze = async (req, res) => {
  const { membershipId } = req.params;

  try {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, userId: req.userId },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    if (membership.status !== 'FROZEN') {
      return res.status(400).json({ error: 'Membership is not currently frozen' });
    }

    // Find active freeze
    const activeFreeze = await prisma.membershipFreeze.findFirst({
      where: { membershipId, status: 'ACTIVE' },
    });

    if (!activeFreeze) {
      return res.status(400).json({ error: 'No active freeze found' });
    }

    const now = new Date();
    const actualDays = getDurationBetween(activeFreeze.freezeStartDate, now);

    // TC4: Extend membership end date by actual freeze days
    const newEndDate = addDuration(membership.endDate, actualDays);

    // Update freeze record
    await prisma.membershipFreeze.update({
      where: { id: activeFreeze.id },
      data: {
        status: 'COMPLETED',
        freezeEndDate: now,
        actualDays,
      },
    });

    // Update membership (days already deducted at creation, no increment needed)
    const updatedMembership = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: 'ACTIVE',
        endDate: newEndDate,
      },
      include: {
        plan: { select: { name: true, maxFreezeCount: true, maxFreezeDays: true } },
        gym: { select: { name: true } },
      },
    });

    res.json({
      message: 'Membership unfrozen successfully',
      actualFreezeDays: actualDays,
      newEndDate: updatedMembership.endDate,
      membership: updatedMembership,
    });
  } catch (error) {
    console.error('Unfreeze error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── USER: Get freeze status for a membership ───
const getFreezeStatus = async (req, res) => {
  const { membershipId } = req.params;

  try {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, userId: req.userId },
      include: {
        plan: { select: { maxFreezeCount: true, maxFreezeDays: true, name: true } },
        freezes: {
          where: { status: { in: ['ACTIVE', 'SCHEDULED'] } },
          orderBy: { freezeStartDate: 'asc' },
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    const activeFreeze = membership.freezes.find(f => f.status === 'ACTIVE') || null;
    const scheduledFreezes = membership.freezes.filter(f => f.status === 'SCHEDULED');

    res.json({
      membershipStatus: membership.status,
      endDate: membership.endDate,
      freezePolicy: {
        maxFreezeCount: membership.plan.maxFreezeCount,
        maxFreezeDays: membership.plan.maxFreezeDays,
      },
      used: {
        freezeCount: membership.totalFreezeCountUsed,
        freezeDays: membership.totalFreezeDaysUsed,
      },
      remaining: {
        freezeCount: membership.plan.maxFreezeCount - membership.totalFreezeCountUsed,
        freezeDays: membership.plan.maxFreezeDays - membership.totalFreezeDaysUsed,
      },
      activeFreeze,
      scheduledFreezes,
    });
  } catch (error) {
    console.error('Get freeze status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── USER: Get freeze history ───
const getFreezeHistory = async (req, res) => {
  const { membershipId } = req.params;

  try {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, userId: req.userId },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    const freezes = await prisma.membershipFreeze.findMany({
      where: { membershipId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(freezes);
  } catch (error) {
    console.error('Get freeze history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── ADMIN: Force unfreeze a membership ───
const adminForceUnfreeze = async (req, res) => {
  const { membershipId } = req.params;

  try {
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    if (membership.status !== 'FROZEN') {
      return res.status(400).json({ error: 'Membership is not currently frozen' });
    }

    const activeFreeze = await prisma.membershipFreeze.findFirst({
      where: { membershipId, status: 'ACTIVE' },
    });

    if (!activeFreeze) {
      return res.status(400).json({ error: 'No active freeze found' });
    }

    const now = new Date();
    const actualDays = getDurationBetween(activeFreeze.freezeStartDate, now);

    const newEndDate = addDuration(membership.endDate, actualDays);

    await prisma.membershipFreeze.update({
      where: { id: activeFreeze.id },
      data: { status: 'COMPLETED', freezeEndDate: now, actualDays },
    });

    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: 'ACTIVE',
        endDate: newEndDate,
      },
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } },
        gym: { select: { name: true } },
      },
    });

    res.json({ message: 'Force unfrozen successfully', membership: updated });
  } catch (error) {
    console.error('Admin force unfreeze error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── ADMIN: Get all freeze records ───
const adminGetAllFreezes = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const freezes = await prisma.membershipFreeze.findMany({
      where,
      include: {
        membership: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            plan: { select: { id: true, name: true } },
            gym: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(freezes);
  } catch (error) {
    console.error('Admin get freezes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  requestFreeze,
  cancelFreeze,
  unfreeze,
  getFreezeStatus,
  getFreezeHistory,
  adminForceUnfreeze,
  adminGetAllFreezes,
};
