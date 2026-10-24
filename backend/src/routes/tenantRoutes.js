import express from 'express';
import * as tenantController from '../controllers/tenantController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', tenantController.list);
router.post('/', tenantController.create);
router.get('/:id', tenantController.getById);
router.patch('/:id', tenantController.update);
router.delete('/:id', tenantController.archive);

export default router;
