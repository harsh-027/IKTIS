import * as reportService from '../services/reportService.js';
import {
  monthlyTrendsQuerySchema,
  paymentsLedgerQuerySchema,
  dashboardSummaryQuerySchema,
} from '../validators/dashboardValidators.js';

/**
 * GET /api/reports/monthly-trends
 */
export async function getMonthlyTrends(req, res, next) {
  try {
    const query = monthlyTrendsQuerySchema.parse(req.query);
    const trends = await reportService.getMonthlyTrends(req.user.id, query);

    res.status(200).json({
      success: true,
      data: { trends },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/tenant-balances
 */
export async function getTenantBalances(req, res, next) {
  try {
    const balances = await reportService.getTenantBalances(req.user.id);

    res.status(200).json({
      success: true,
      data: { balances },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/property-performance
 */
export async function getPropertyPerformance(req, res, next) {
  try {
    const query = dashboardSummaryQuerySchema.parse(req.query);
    const data = await reportService.getPropertyPerformance(req.user.id, query.month);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/payments-ledger
 */
export async function getPaymentsLedger(req, res, next) {
  try {
    const query = paymentsLedgerQuerySchema.parse(req.query);
    const data = await reportService.getPaymentsLedger(req.user.id, query);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}
