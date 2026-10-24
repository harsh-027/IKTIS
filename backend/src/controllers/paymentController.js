import * as paymentService from '../services/paymentService.js';
import {
  recordPaymentSchema,
  voidPaymentSchema,
  paymentIdParamSchema,
  listPaymentsQuerySchema,
} from '../validators/paymentValidators.js';

/**
 * POST /api/payments
 * Record a payment (FIFO or manual allocation)
 */
export async function recordPayment(req, res, next) {
  try {
    const validatedData = recordPaymentSchema.parse(req.body);
    const payment = await paymentService.recordPayment(req.user.id, validatedData);

    res.status(201).json({
      success: true,
      data: { payment },
      message: 'Payment recorded successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/payments
 * List payments for authenticated landlord
 */
export async function listPayments(req, res, next) {
  try {
    const query = listPaymentsQuerySchema.parse(req.query);
    const payments = await paymentService.listPayments(req.user.id, query);

    res.status(200).json({
      success: true,
      data: {
        payments,
        total: payments.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/payments/:id
 * Get single payment details
 */
export async function getPaymentById(req, res, next) {
  try {
    const { id } = paymentIdParamSchema.parse(req.params);
    const payment = await paymentService.getPaymentById(req.user.id, id);

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payments/:id/void
 * Void a payment with audit reason
 */
export async function voidPayment(req, res, next) {
  try {
    const { id } = paymentIdParamSchema.parse(req.params);
    const { reason } = voidPaymentSchema.parse(req.body);
    const payment = await paymentService.voidPayment(req.user.id, id, { reason });

    res.status(200).json({
      success: true,
      data: { payment },
      message: 'Payment voided successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/payments/:id/receipt
 * Get printable receipt data
 */
export async function getPaymentReceipt(req, res, next) {
  try {
    const { id } = paymentIdParamSchema.parse(req.params);
    const receipt = await paymentService.getPaymentReceipt(req.user.id, id);

    res.status(200).json({
      success: true,
      data: { receipt },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/payments/tenant-outstanding/:tenantId
 * Get unpaid/partially-paid charges for a tenant to prepare allocation
 */
export async function getTenantOutstandingCharges(req, res, next) {
  try {
    const { tenantId } = req.params;
    const data = await paymentService.getTenantOutstandingCharges(req.user.id, tenantId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}
