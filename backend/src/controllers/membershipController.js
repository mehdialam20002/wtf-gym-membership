const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// User purchases a membership
const purchaseMembership = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { planId, gymId } = req.body;
  const userId = req.userId;

  try {
    // Check plan exists and is visible
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isVisible) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Check gym exists and is active
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym || !gym.isActive) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    // Check plan is available at this gym
    const gymPlan = await prisma.gymPlan.findUnique({
      where: { gymId_planId: { gymId, planId } },
    });
    if (!gymPlan) {
      return res.status(400).json({ error: 'This plan is not available at this gym' });
    }

    // Check if user already has an active membership at this gym
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId,
        gymId,
        status: { in: ['ACTIVE', 'FROZEN'] },
      },
    });
    if (existingMembership) {
      return res.status(400).json({ error: 'You already have an active membership at this gym' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const membership = await prisma.membership.create({
      data: {
        userId,
        planId,
        gymId,
        startDate,
        endDate,
        originalEndDate: endDate,
        status: 'ACTIVE',
      },
      include: {
        plan: { select: { id: true, name: true, durationDays: true, price: true, maxFreezeCount: true, maxFreezeDays: true } },
        gym: { select: { id: true, name: true, slug: true, area: true, city: true } },
      },
    });

    res.status(201).json(membership);
  } catch (error) {
    console.error('Purchase membership error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's memberships
const getMyMemberships = async (req, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.userId },
      include: {
        plan: { select: { id: true, name: true, durationDays: true, price: true, maxFreezeCount: true, maxFreezeDays: true } },
        gym: { select: { id: true, name: true, slug: true, area: true, city: true } },
        freezes: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(memberships);
  } catch (error) {
    console.error('Get memberships error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single membership detail
const getMembershipById = async (req, res) => {
  try {
    const membership = await prisma.membership.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        plan: { select: { id: true, name: true, durationDays: true, price: true, maxFreezeCount: true, maxFreezeDays: true } },
        gym: { select: { id: true, name: true, slug: true, area: true, city: true, phone: true } },
        freezes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    res.json(membership);
  } catch (error) {
    console.error('Get membership error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Check access - is membership valid right now (not frozen, not expired)
const checkAccess = async (req, res) => {
  try {
    const membership = await prisma.membership.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        plan: { select: { name: true } },
        gym: { select: { name: true } },
        freezes: { where: { status: 'ACTIVE' }, take: 1 },
      },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    const now = new Date();
    let accessAllowed = false;
    let reason = '';

    if (membership.status === 'EXPIRED' || membership.endDate < now) {
      reason = 'Membership has expired';
    } else if (membership.status === 'CANCELLED') {
      reason = 'Membership is cancelled';
    } else if (membership.status === 'FROZEN') {
      reason = 'Membership is currently frozen';
    } else {
      accessAllowed = true;
    }

    res.json({
      accessAllowed,
      reason,
      membershipStatus: membership.status,
      endDate: membership.endDate,
      plan: membership.plan.name,
      gym: membership.gym.name,
      activeFreeze: membership.freezes[0] || null,
    });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── ADMIN ENDPOINTS ───

// Get all memberships (admin)
const getAllMemberships = async (req, res) => {
  try {
    const { status, gymId, userId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (gymId) where.gymId = gymId;
    if (userId) where.userId = userId;

    const memberships = await prisma.membership.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        plan: { select: { id: true, name: true, durationDays: true, maxFreezeCount: true, maxFreezeDays: true } },
        gym: { select: { id: true, name: true, area: true, city: true } },
        freezes: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(memberships);
  } catch (error) {
    console.error('Get all memberships error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: create membership for a user manually
const adminCreateMembership = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, planId, gymId, startDate: startStr } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) return res.status(404).json({ error: 'Gym not found' });

    // Check existing active membership
    const existing = await prisma.membership.findFirst({
      where: { userId, gymId, status: { in: ['ACTIVE', 'FROZEN'] } },
    });
    if (existing) {
      return res.status(400).json({ error: 'User already has active membership at this gym' });
    }

    const startDate = startStr ? new Date(startStr) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const membership = await prisma.membership.create({
      data: {
        userId, planId, gymId,
        startDate, endDate, originalEndDate: endDate,
        status: 'ACTIVE',
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        plan: { select: { id: true, name: true, durationDays: true } },
        gym: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(membership);
  } catch (error) {
    console.error('Admin create membership error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  purchaseMembership,
  getMyMemberships,
  getMembershipById,
  checkAccess,
  getAllMemberships,
  adminCreateMembership,
};
