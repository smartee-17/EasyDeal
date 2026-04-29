import express from 'express';
import { register } from '../controllers/auth.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);

export default router;
