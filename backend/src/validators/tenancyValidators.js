import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createTenancySchema = z.object({
  tenantId: z.string({ required_error: 'Tenant ID is required' }).uuid('Invalid tenant ID format'),
  roomId: z.string({ required_error: 'Room ID is required' }).uuid('Invalid room ID format'),
  startDate: z
    .string({ required_error: 'Start date is required' })
    .regex(dateRegex, 'Start date must be in YYYY-MM-DD format'),
  endDate: z
    .string()
    .regex(dateRegex, 'End date must be in YYYY-MM-DD format')
    .nullable()
    .optional()
    .or(z.literal('')),
  monthlyRent: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, 'Monthly rent must be greater than 0'),
  rentDueDay: z
    .union([z.number(), z.string()])
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 31, 'Rent due day must be between 1 and 31'),
}).refine(
  (data) => {
    if (data.endDate && data.endDate.trim() !== '') {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  }
);

export const endTenancySchema = z.object({
  endDate: z
    .string({ required_error: 'End date is required to conclude tenancy' })
    .regex(dateRegex, 'End date must be in YYYY-MM-DD format'),
});

export const tenancyIdParamSchema = z.object({
  id: z.string().uuid('Invalid tenancy ID format'),
});
