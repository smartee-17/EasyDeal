import express from "express";
import { getME, updateMe } from "../controllers/user.controller";
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/me', protect, getME);
router.patch('/me', protect, updateMe);

export default router;