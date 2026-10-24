import { z } from 'zod';

const yearMonthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Validation for GET /api/dashboard/summary
 */
export const dashboardSummaryQuerySchema = z.object({
  month: z
    .string()
    .regex(yearMonthRegex, 'Month must be in YYYY-MM format (e.g. 2026-10)')
    .optional(),
});

/**
 * Validation for GET /api/reports/monthly-trends
 */
export const monthlyTrendsQuerySchema = z.object({
  months: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 36, 'Months must be between 1 and 36')
    .optional(),
  startMonth: z.string().regex(yearMonthRegex, 'startMonth must be YYYY-MM').optional(),
  endMonth: z.string().regex(yearMonthRegex, 'endMonth must be YYYY-MM').optional(),
});

/**
 * Validation for GET /api/reports/payments-ledger
 */
export const paymentsLedgerQuerySchema = z.object({
  startDate: z.string().regex(dateRegex, 'startDate must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(dateRegex, 'endDate must be YYYY-MM-DD').optional(),
  method: z.string().max(50).optional(),
  status: z.enum(['all', 'valid', 'voided']).default('all').optional(),
  tenantId: z.string().uuid('Invalid tenant ID').optional(),
});
