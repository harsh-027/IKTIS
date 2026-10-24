import express from 'express';
import * as roomController from '../controllers/roomController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require authentication for all room endpoints
router.use(requireAuth);

// Room direct endpoints
router.get('/:id', roomController.getById);
router.patch('/:id', roomController.update);
router.delete('/:id', roomController.archive);

export default router;
