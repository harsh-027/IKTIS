import { z } from 'zod';

export const createTenantSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(1, 'Full name cannot be empty')
    .max(191, 'Full name cannot exceed 191 characters'),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone cannot exceed 30 characters')
    .nullable()
    .optional(),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(191, 'Email cannot exceed 191 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .nullable()
    .optional(),
});

export const updateTenantSchema = createTenantSchema.partial();

export const tenantIdParamSchema = z.object({
  id: z.string().uuid('Invalid tenant ID format'),
});
