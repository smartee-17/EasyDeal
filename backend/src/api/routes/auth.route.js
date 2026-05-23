import express from 'express';
import { 
    register,
    login,
    verifyEmail,
    resendVerification
} from '../controllers/auth.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);

router.post("/login", login);

router.get("/verify-email/:token", verifyEmail);

router.post("/resend-verification", resendVerification);

export default router;
