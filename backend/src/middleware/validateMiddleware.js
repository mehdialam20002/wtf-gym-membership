const { body } = require('express-validator');

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const planValidation = [
  body('name').notEmpty().trim().withMessage('Plan name is required'),
  body('durationDays').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('discountedPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('benefits').isArray().withMessage('Benefits must be an array'),
  body('maxFreezeCount').optional().isInt({ min: 0 }).withMessage('Max freeze count must be 0 or more'),
  body('maxFreezeDays').optional().isInt({ min: 0 }).withMessage('Max freeze days must be 0 or more'),
];

const planUpdateValidation = [
  body('name').optional().notEmpty().trim(),
  body('durationDays').optional().isInt({ min: 1 }),
  body('price').optional().isFloat({ min: 0 }),
  body('discountedPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('benefits').optional().isArray(),
  body('maxFreezeCount').optional().isInt({ min: 0 }),
  body('maxFreezeDays').optional().isInt({ min: 0 }),
];

// User validations
const userSignupValidation = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().trim().withMessage('Phone number is required')
    .matches(/^(\+91[\-\s]?)?[6-9]\d{9}$/).withMessage('Valid Indian phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const userLoginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const userUpdateValidation = [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().matches(/^(\+91[\-\s]?)?[6-9]\d{9}$/).withMessage('Valid Indian phone number required'),
];

// Membership validations
const membershipValidation = [
  body('planId').notEmpty().withMessage('Plan ID is required'),
  body('gymId').notEmpty().withMessage('Gym ID is required'),
];

// Freeze validations
const freezeValidation = [
  body('startDate').notEmpty().isISO8601().withMessage('Valid start date is required (YYYY-MM-DD)'),
  body('freezeDays').isInt({ min: 1 }).withMessage('Freeze days must be at least 1'),
  body('reason').optional().trim(),
];

module.exports = {
  loginValidation,
  planValidation,
  planUpdateValidation,
  userSignupValidation,
  userLoginValidation,
  userUpdateValidation,
  membershipValidation,
  freezeValidation,
};
