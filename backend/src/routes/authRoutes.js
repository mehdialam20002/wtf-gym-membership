const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginValidation } = require('../middleware/validateMiddleware');

router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);

module.exports = router;
