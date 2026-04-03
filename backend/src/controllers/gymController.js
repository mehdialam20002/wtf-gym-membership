const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// GET /api/gyms — public, active only
const getGyms = async (req, res) => {
  try {
    const gyms = await prisma.gym.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        gymPlans: { select: { planId: true } },
      },
    });
    res.json(gyms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/gyms/all — admin, all gyms
const getAllGyms = async (req, res) => {
  try {
    const gyms = await prisma.gym.findMany({
      orderBy: { name: 'asc' },
      include: {
        gymPlans: { select: { planId: true } },
      },
    });
    res.json(gyms);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/gyms/:slug — public
const getGymBySlug = async (req, res) => {
  try {
    const gym = await prisma.gym.findUnique({
      where: { slug: req.params.slug },
      include: {
        gymPlans: {
          include: {
            plan: true,
          },
        },
      },
    });
    if (!gym) return res.status(404).json({ error: 'Gym not found' });
    res.json(gym);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/gyms — admin
const createGym = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, slug, area, city, address, phone, hours, rating, totalSeats, seatsLeft, amenities, category, isActive } = req.body;

  try {
    const gym = await prisma.gym.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        area,
        city: city || 'Noida',
        address,
        phone: phone || '',
        hours: hours || '06:00 AM - 10:00 PM',
        rating: rating ? parseFloat(rating) : 5.0,
        totalSeats: totalSeats ? parseInt(totalSeats) : 30,
        seatsLeft: seatsLeft ? parseInt(seatsLeft) : 15,
        amenities: Array.isArray(amenities) ? amenities : [],
        category: category || '',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });
    res.status(201).json(gym);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Slug already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/gyms/:id — admin
const updateGym = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const existing = await prisma.gym.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Gym not found' });

    const { name, slug, area, city, address, phone, hours, rating, totalSeats, seatsLeft, amenities, category, isActive } = req.body;

    const gym = await prisma.gym.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(area !== undefined && { area }),
        ...(city !== undefined && { city }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(hours !== undefined && { hours }),
        ...(rating !== undefined && { rating: parseFloat(rating) }),
        ...(totalSeats !== undefined && { totalSeats: parseInt(totalSeats) }),
        ...(seatsLeft !== undefined && { seatsLeft: parseInt(seatsLeft) }),
        ...(amenities !== undefined && { amenities: Array.isArray(amenities) ? amenities : [] }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });
    res.json(gym);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Slug already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/gyms/:id — admin
const deleteGym = async (req, res) => {
  try {
    const existing = await prisma.gym.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Gym not found' });
    await prisma.gym.delete({ where: { id: req.params.id } });
    res.json({ message: 'Gym deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/gyms/:id/plans — admin, set plan assignments for a gym
const setGymPlans = async (req, res) => {
  const { planIds } = req.body;
  if (!Array.isArray(planIds)) return res.status(400).json({ error: 'planIds must be an array' });

  try {
    const gym = await prisma.gym.findUnique({ where: { id: req.params.id } });
    if (!gym) return res.status(404).json({ error: 'Gym not found' });

    // Delete existing, then re-create
    await prisma.gymPlan.deleteMany({ where: { gymId: req.params.id } });

    if (planIds.length > 0) {
      await prisma.gymPlan.createMany({
        data: planIds.map(planId => ({ gymId: req.params.id, planId })),
        skipDuplicates: true,
      });
    }

    const updated = await prisma.gym.findUnique({
      where: { id: req.params.id },
      include: { gymPlans: { select: { planId: true } } },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/gyms/:id/plans — get plans for a gym (public)
const getGymPlans = async (req, res) => {
  try {
    const gymPlans = await prisma.gymPlan.findMany({
      where: { gymId: req.params.id },
      include: {
        plan: true,
      },
    });
    const plans = gymPlans.map(gp => gp.plan).filter(p => p.isVisible);
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getGyms, getAllGyms, getGymBySlug, createGym, updateGym, deleteGym, setGymPlans, getGymPlans };
