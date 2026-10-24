import express from 'express';
import * as tenancyController from '../controllers/tenancyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', tenancyController.list);
router.post('/', tenancyController.create);
router.get('/:id', tenancyController.getById);
router.patch('/:id/end', tenancyController.endTenancy);

export default router;
