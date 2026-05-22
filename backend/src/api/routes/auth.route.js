import express from 'express';
import rateLimit  from 'express-rate-limit';
import { 
    register,
    login,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetToken,
    logout
} from '../controllers/auth.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

const isTest = process.env.NODE_ENV === 'test';

// Rate limiter
const authLimiter = isTest ? (req, res, next) => next () 
: rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many auth attempts — please try again in 15 minutes.",
    data:    null,
  },
});


router.post('/register', authLimiter,register);

router.post("/login", authLimiter, login);

router.get("/verify-email/:token", authLimiter, verifyEmail);

router.post("/resend-verification", authLimiter, resendVerification);

router.post("/forgot-password", authLimiter, forgotPassword);

router.post("/reset-password/:token", authLimiter, resetToken);

router.post("/logout", logout )

export default router;
