const { body, validationResult } = require("express-validator");


const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array()[0].msg });
  }
  next();
};


// ─── Signup ───────────────────────────────────────────────────────────────────
const validateSignup = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 50 }).withMessage("name must be 50 characters or fewer"),

  body("username")
    .trim()
    .notEmpty().withMessage("Username is required")
    .isLength({ max: 50 }).withMessage("Last name must be 50 characters or fewer"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .matches(/^\+?[0-9]{7,15}$/).withMessage("Please provide a valid phone number"),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .isLength({ max: 128 }).withMessage("Password is too long"),

  body("role")
    .optional()
    .isIn(["user", "seller"]).withMessage("Invalid role"),

  handleValidationErrors
];


// ─── Login ────────────────────────────────────────────────────────────────────
const validateLogin = [
  body("emailOrUsername")
    .trim()
    .notEmpty().withMessage("Email or Username is required"),

  body("password")
    .notEmpty().withMessage("Password is required"),

  handleValidationErrors
];


// ─── Forgot password ──────────────────────────────────────────────────────────
const validateForgotPassword = [
  body("emailOrUSername")
    .trim()
    .notEmpty().withMessage("Email or phone number is required"),

  handleValidationErrors
];


// ─── Reset password ───────────────────────────────────────────────────────────
const validateResetPassword = [
  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .isLength({ max: 128 }).withMessage("Password is too long"),

  handleValidationErrors
];

// ─── Resend verification ──────────────────────────────────────────────────────
const validateResendVerification = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required"),

  handleValidationErrors
];


module.exports = {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyPhone,
  validateResendVerification
};
