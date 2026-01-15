const { body, validationResult } = require('express-validator');

const emailValidation = body('email')
  .isEmail()
  .withMessage('Please provide a valid email address')
  .normalizeEmail()
  .trim();

const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage(
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )
  .trim();

const firstNameValidation = body('firstName')
  .optional()
  .isLength({ min: 2, max: 50 })
  .withMessage('First name must be between 2 and 50 characters')
  .trim()
  .escape();

const lastNameValidation = body('lastName')
  .optional()
  .isLength({ min: 2, max: 50 })
  .withMessage('Last name must be between 2 and 50 characters')
  .trim()
  .escape();

const roleValidation = body('role')
  .optional()
  .isIn(['patient', 'psychologist', 'admin'])
  .withMessage('Role must be patient, psychologist, or admin');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      msg: 'Validation failed',
    });
  }
  next();
};

const registerValidators = [
  emailValidation,
  passwordValidation,
  firstNameValidation,
  lastNameValidation,
  roleValidation,
  handleValidationErrors,
];

const loginValidators = [
  emailValidation,
  body('password').notEmpty().withMessage('Password is required').trim(),
  handleValidationErrors,
];

const registerPsychologistValidators = [
  emailValidation,
  passwordValidation,
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .trim()
    .escape(),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .trim()
    .escape(),
  body('specialization')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Specialization must be less than 255 characters')
    .trim()
    .escape(),
  body('experience')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Experience must be a number between 0 and 100'),
  body('bio')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Bio must be less than 2000 characters')
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  handleValidationErrors,
];

const updateProfileValidators = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  firstNameValidation,
  lastNameValidation,
  body('specialization')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Specialization must be less than 255 characters')
    .trim()
    .escape(),
  body('experience')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Experience must be a number between 0 and 100'),
  body('bio')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Bio must be less than 2000 characters')
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  handleValidationErrors,
];

const updateEmailNotificationsValidators = [
  body('emailNotifications')
    .isBoolean()
    .withMessage('emailNotifications must be a boolean value'),
  handleValidationErrors,
];

const createAdminValidators = [
  emailValidation,
  passwordValidation,
  firstNameValidation,
  lastNameValidation,
  handleValidationErrors,
];

module.exports = {
  registerValidators,
  loginValidators,
  registerPsychologistValidators,
  updateProfileValidators,
  updateEmailNotificationsValidators,
  createAdminValidators,
  handleValidationErrors,
};
