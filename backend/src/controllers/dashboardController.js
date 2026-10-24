import * as dashboardService from '../services/dashboardService.js';
import { dashboardSummaryQuerySchema } from '../validators/dashboardValidators.js';

/**
 * GET /api/dashboard/summary
 */
export async function getDashboardSummary(req, res, next) {
  try {
    const query = dashboardSummaryQuerySchema.parse(req.query);
    const data = await dashboardService.getDashboardSummary(req.user.id, query.month);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}
