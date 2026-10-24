import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as paymentController from '../controllers/paymentController.js';

const router = Router();

// All payment routes require an active landlord session
router.use(requireAuth);

router.post('/', paymentController.recordPayment);
router.get('/', paymentController.listPayments);
router.get('/tenant-outstanding/:tenantId', paymentController.getTenantOutstandingCharges);
router.get('/:id', paymentController.getPaymentById);
router.get('/:id/receipt', paymentController.getPaymentReceipt);
router.post('/:id/void', paymentController.voidPayment);

export default router;
