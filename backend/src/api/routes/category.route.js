import express from 'express';
import * as controller from '../controllers/category.controller.js';
import authorizeRoles from '../middlewares/role.middlewares.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('admin'), controller.createCategory);

export default router;
