import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z
    .string({ required_error: 'Property name is required' })
    .trim()
    .min(1, { message: 'Property name cannot be empty' })
    .max(191, { message: 'Property name must be under 191 characters' }),
  address: z
    .string({ required_error: 'Property address is required' })
    .trim()
    .min(1, { message: 'Property address cannot be empty' })
    .max(255, { message: 'Property address must be under 255 characters' }),
});

export const updatePropertySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Property name cannot be empty' })
    .max(191, { message: 'Property name must be under 191 characters' })
    .optional(),
  address: z
    .string()
    .trim()
    .min(1, { message: 'Property address cannot be empty' })
    .max(255, { message: 'Property address must be under 255 characters' })
    .optional(),
}).refine(data => data.name !== undefined || data.address !== undefined, {
  message: 'At least one field (name or address) must be provided for update',
});

export const propertyIdParamSchema = z.object({
  id: z.string().trim().min(1, { message: 'Valid property ID is required' }),
});
