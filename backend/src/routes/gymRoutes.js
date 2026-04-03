const express = require('express');
const router = express.Router();
const {
  getGyms, getAllGyms, getGymBySlug,
  createGym, updateGym, deleteGym,
  setGymPlans, getGymPlans,
} = require('../controllers/gymController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

const gymValidation = [
  body('name').notEmpty().trim().withMessage('Gym name is required'),
  body('area').notEmpty().trim().withMessage('Area is required'),
  body('address').notEmpty().trim().withMessage('Address is required'),
];

// Public
router.get('/', getGyms);
router.get('/all', protect, getAllGyms);
router.get('/:slug/details', getGymBySlug);
router.get('/:id/plans', getGymPlans);

// Admin
router.post('/', protect, gymValidation, createGym);
router.put('/:id', protect, updateGym);
router.delete('/:id', protect, deleteGym);
router.put('/:id/plans', protect, setGymPlans);

module.exports = router;
