const express = require('express');
const router = express.Router();
const { protectUser } = require('../middleware/authMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  purchaseMembership,
  getMyMemberships,
  getMembershipById,
  checkAccess,
  getAllMemberships,
  adminCreateMembership,
} = require('../controllers/membershipController');
const { membershipValidation } = require('../middleware/validateMiddleware');

// User routes
router.post('/purchase', protectUser, membershipValidation, purchaseMembership);
router.get('/my', protectUser, getMyMemberships);
router.get('/my/:id', protectUser, getMembershipById);
router.get('/my/:id/access', protectUser, checkAccess);

// Admin routes
router.get('/all', protect, getAllMemberships);
router.post('/admin-create', protect, membershipValidation, adminCreateMembership);

module.exports = router;
