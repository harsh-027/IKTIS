import { z } from 'zod';

// ─── Validators for RentCharge phase ───────────────────────────────────────

// YYYY-MM pattern for selecting a rent period month
const yearMonthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Bulk generation: POST /api/rent-charges/generate
 * Generate rent charges for all active tenancies in a given month.
 */
export const generateRentChargesSchema = z.object({
  month: z
    .string({ required_error: 'Month is required (YYYY-MM format)' })
    .regex(yearMonthRegex, 'Month must be in YYYY-MM format (e.g. 2026-11)'),
});

/**
 * Create a single custom charge: POST /api/rent-charges
 * Used for partial first/last month custom amounts.
 */
export const createRentChargeSchema = z.object({
  tenancyId: z
    .string({ required_error: 'Tenancy ID is required' })
    .uuid('Invalid tenancy ID format'),
  period: z
    .string({ required_error: 'Period is required' })
    .regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, 'Period must be first day of month in YYYY-MM-01 format'),
  amountDue: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, 'Amount due must be greater than ₹0'),
  dueDate: z
    .string({ required_error: 'Due date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
});

/**
 * Update (custom amount override): PATCH /api/rent-charges/:id
 */
export const updateRentChargeSchema = z.object({
  amountDue: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, 'Amount due must be greater than ₹0'),
}).strict();

/**
 * ID param validation
 */
export const rentChargeIdParamSchema = z.object({
  id: z.string().uuid('Invalid rent charge ID format'),
});
