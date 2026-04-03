const express = require('express');
const router = express.Router();
const {
  getPlans, getAllPlans, getPlanById,
  createPlan, updatePlan, deletePlan, updatePlanGyms,
} = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');
const { planValidation, planUpdateValidation } = require('../middleware/validateMiddleware');

// Public routes
router.get('/', getPlans);
router.get('/all', protect, getAllPlans);
router.get('/:id', getPlanById);

// Admin protected routes
router.post('/', protect, planValidation, createPlan);
router.put('/:id', protect, planUpdateValidation, updatePlan);
router.put('/:id/gyms', protect, updatePlanGyms);
router.delete('/:id', protect, deletePlan);

module.exports = router;
