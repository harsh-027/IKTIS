import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', dashboardController.getDashboardSummary);

export default router;
