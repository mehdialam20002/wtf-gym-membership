const express = require('express');
const router = express.Router();
const { protectUser, protect } = require('../middleware/authMiddleware');
const {
  requestFreeze,
  cancelFreeze,
  unfreeze,
  getFreezeStatus,
  getFreezeHistory,
  adminForceUnfreeze,
  adminGetAllFreezes,
} = require('../controllers/freezeController');
const { freezeValidation } = require('../middleware/validateMiddleware');

// User routes
router.post('/:membershipId/freeze', protectUser, freezeValidation, requestFreeze);
router.post('/:membershipId/unfreeze', protectUser, unfreeze);
router.post('/cancel/:freezeId', protectUser, cancelFreeze);
router.get('/:membershipId/freeze-status', protectUser, getFreezeStatus);
router.get('/:membershipId/freeze-history', protectUser, getFreezeHistory);

// Admin routes
router.post('/admin/:membershipId/force-unfreeze', protect, adminForceUnfreeze);
router.get('/admin/all', protect, adminGetAllFreezes);

module.exports = router;
