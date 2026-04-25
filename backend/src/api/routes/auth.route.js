import express from "express";
import { register } from "../controllers/auth.controller";
import protect from "../middlewares/auth.middleware";

const router = express.Router;

router.post('/register', register);

export default router;