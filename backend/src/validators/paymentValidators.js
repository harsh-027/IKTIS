import { z } from 'zod';

const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Validation for recording a payment: POST /api/payments
 */
export const recordPaymentSchema = z.object({
  tenantId: z
    .string({ required_error: 'Tenant ID is required' })
    .uuid('Invalid tenant ID format'),

  amount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, 'Amount must be a positive number greater than ₹0')
    .refine((val) => {
      // At most 2 decimal places
      return Math.round(val * 100) === val * 100;
    }, 'Amount can have at most 2 decimal places'),

  paidAt: z
    .string({ required_error: 'Payment date is required' })
    .regex(dateRegex, 'Payment date must be in YYYY-MM-DD format'),

  method: z
    .string()
    .max(50, 'Payment method must not exceed 50 characters')
    .optional()
    .nullable(),

  reference: z
    .string()
    .max(100, 'Reference must not exceed 100 characters')
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .nullable(),

  allocationMode: z
    .enum(['fifo', 'manual'], {
      errorMap: () => ({ message: 'Allocation mode must be either "fifo" or "manual"' }),
    })
    .default('fifo'),

  allocations: z
    .array(
      z.object({
        rentChargeId: z.string().uuid('Invalid rent charge ID in allocations'),
        amount: z
          .union([z.number(), z.string()])
          .transform((val) => Number(val))
          .refine((val) => !isNaN(val) && val > 0, 'Allocated amount must be greater than ₹0')
          .refine((val) => Math.round(val * 100) === val * 100, 'Allocated amount can have at most 2 decimal places'),
      })
    )
    .optional(),
});

/**
 * Validation for voiding a payment: POST /api/payments/:id/void
 */
export const voidPaymentSchema = z.object({
  reason: z
    .string({ required_error: 'A reason is required to void a payment' })
    .trim()
    .min(3, 'Void reason must be at least 3 characters long')
    .max(500, 'Void reason must not exceed 500 characters'),
});

/**
 * ID param validation
 */
export const paymentIdParamSchema = z.object({
  id: z.string().uuid('Invalid payment ID format'),
});

/**
 * Query schema for listing payments
 */
export const listPaymentsQuerySchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID').optional(),
  status: z.enum(['all', 'valid', 'voided']).default('all').optional(),
  startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD').optional(),
});
