import express from 'express';
import * as controller from '../controllers/tag.controller.js';
import protect from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/role.middlewares.js';

const router = express.Router();

router.get('/search', controller.searchTags); // GET /api/tags/search?q=ele

router.get('/', controller.getAllTags);

router.post('/', protect, controller.createTag);

router.delete('/:id', protect, authorizeRoles('admin'), controller.deleteTag);

export default router;
