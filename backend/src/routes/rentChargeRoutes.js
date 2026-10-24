import express from 'express';
import * as rentChargeController from '../controllers/rentChargeController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

// Summary endpoint BEFORE /:id to avoid route conflict
router.get('/summary', rentChargeController.summary);

// Bulk generation endpoint BEFORE /:id
router.post('/generate', rentChargeController.generate);

// Standard CRUD
router.get('/', rentChargeController.list);
router.post('/', rentChargeController.create);
router.get('/:id', rentChargeController.getById);
router.patch('/:id', rentChargeController.update);
router.delete('/:id', rentChargeController.remove);

export default router;
