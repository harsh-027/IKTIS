import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as reportController from '../controllers/reportController.js';

const router = Router();

router.use(requireAuth);

router.get('/monthly-trends', reportController.getMonthlyTrends);
router.get('/tenant-balances', reportController.getTenantBalances);
router.get('/property-performance', reportController.getPropertyPerformance);
router.get('/payments-ledger', reportController.getPaymentsLedger);

export default router;
