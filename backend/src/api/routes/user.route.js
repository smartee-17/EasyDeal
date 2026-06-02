import express from "express";
import { getME, updateMe } from "../controllers/user.controller.js";
import  protect  from '../middlewares/auth.middleware.js';
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get('/me', protect, getME);
router.patch('/me', protect, upload.single('avatar'), updateMe);

export default router;