const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile } = require('../controllers/userAuthController');
const { protectUser } = require('../middleware/authMiddleware');
const { userSignupValidation, userLoginValidation, userUpdateValidation } = require('../middleware/validateMiddleware');

router.post('/signup', userSignupValidation, signup);
router.post('/login', userLoginValidation, login);
router.get('/profile', protectUser, getProfile);
router.put('/profile', protectUser, userUpdateValidation, updateProfile);

module.exports = router;
