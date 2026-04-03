const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// GET /api/plans - public
const getPlans = async (req, res) => {
  try {
    const { gymId } = req.query;
    let plans;

    if (gymId) {
      const gymPlans = await prisma.gymPlan.findMany({
        where: { gymId },
        include: { plan: true },
      });
      plans = gymPlans.map(gp => gp.plan).filter(p => p.isVisible);
      plans.sort((a, b) => a.durationDays - b.durationDays);
    } else {
      plans = await prisma.plan.findMany({
        where: { isVisible: true },
        orderBy: [{ durationDays: 'asc' }, { createdAt: 'asc' }],
      });
    }

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/plans/all - admin (includes hidden)
const getAllPlans = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: [{ durationDays: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { gymPlans: true } } },
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/plans/:id/gyms - admin
const updatePlanGyms = async (req, res) => {
  try {
    const planId = req.params.id;
    const { gymIds } = req.body;

    const existing = await prisma.plan.findUnique({ where: { id: planId } });
    if (!existing) return res.status(404).json({ error: 'Plan not found' });

    const ids = Array.isArray(gymIds) ? gymIds : [];

    // Remove plan from gyms not in the new list
    await prisma.gymPlan.deleteMany({ where: { planId, gymId: { notIn: ids } } });

    // Add plan to new gyms (skip existing)
    if (ids.length > 0) {
      const already = await prisma.gymPlan.findMany({ where: { planId, gymId: { in: ids } } });
      const alreadySet = new Set(already.map(a => a.gymId));
      const toCreate = ids.filter(id => !alreadySet.has(id));
      if (toCreate.length > 0) {
        await prisma.gymPlan.createMany({ data: toCreate.map(gymId => ({ gymId, planId })) });
      }
    }

    res.json({ message: 'Updated', count: ids.length });
  } catch (error) {
    console.error('Update plan gyms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/plans/:id
const getPlanById = async (req, res) => {
  try {
    const plan = await prisma.plan.findUnique({ where: { id: req.params.id } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/plans - admin
const createPlan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      name, category, durationDays, price, discountedPrice,
      isVisible, benefits, maxFreezeCount, maxFreezeDays,
    } = req.body;

    const days = parseInt(durationDays);
    const freezeDays = maxFreezeDays !== undefined ? parseInt(maxFreezeDays) : 0;
    if (freezeDays > days) {
      return res.status(400).json({ error: `Max freeze days (${freezeDays}) cannot exceed plan duration (${days} days)` });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        category: category || '',
        durationDays: parseInt(durationDays),
        price: parseFloat(price),
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
        benefits: Array.isArray(benefits) ? benefits : [],
        maxFreezeCount: maxFreezeCount !== undefined ? parseInt(maxFreezeCount) : 0,
        maxFreezeDays: maxFreezeDays !== undefined ? parseInt(maxFreezeDays) : 0,
      },
    });
    res.status(201).json(plan);
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/plans/:id - admin
const updatePlan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Plan not found' });

    const {
      name, category, durationDays, price, discountedPrice,
      isVisible, benefits, maxFreezeCount, maxFreezeDays,
    } = req.body;

    const finalDuration = durationDays !== undefined ? parseInt(durationDays) : existing.durationDays;
    const finalFreezeDays = maxFreezeDays !== undefined ? parseInt(maxFreezeDays) : existing.maxFreezeDays;
    if (finalFreezeDays > finalDuration) {
      return res.status(400).json({ error: `Max freeze days (${finalFreezeDays}) cannot exceed plan duration (${finalDuration} days)` });
    }

    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category: category || '' }),
        ...(durationDays !== undefined && { durationDays: parseInt(durationDays) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        discountedPrice: discountedPrice !== undefined ? (discountedPrice ? parseFloat(discountedPrice) : null) : existing.discountedPrice,
        ...(isVisible !== undefined && { isVisible: Boolean(isVisible) }),
        ...(benefits !== undefined && { benefits: Array.isArray(benefits) ? benefits : [] }),
        ...(maxFreezeCount !== undefined && { maxFreezeCount: parseInt(maxFreezeCount) }),
        ...(maxFreezeDays !== undefined && { maxFreezeDays: parseInt(maxFreezeDays) }),
      },
    });
    res.json(plan);
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/plans/:id - admin
const deletePlan = async (req, res) => {
  try {
    const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Plan not found' });

    // Check if any memberships are using this plan
    const membershipCount = await prisma.membership.count({ where: { planId: req.params.id } });
    if (membershipCount > 0) {
      return res.status(400).json({
        error: `This plan has ${membershipCount} membership${membershipCount > 1 ? 's' : ''} linked to it. Remove or reassign them before deleting.`,
      });
    }

    await prisma.plan.delete({ where: { id: req.params.id } });
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getPlans, getAllPlans, getPlanById, createPlan, updatePlan, deletePlan, updatePlanGyms };
