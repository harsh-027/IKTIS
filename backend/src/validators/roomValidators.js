import { z } from 'zod';

export const createRoomSchema = z.object({
  label: z
    .string({ required_error: 'Room label is required' })
    .trim()
    .min(1, { message: 'Room label cannot be empty' })
    .max(100, { message: 'Room label must be under 100 characters' }),
  description: z
    .string()
    .trim()
    .max(255, { message: 'Description must be under 255 characters' })
    .optional()
    .nullable(),
  isAvailable: z
    .boolean()
    .optional()
    .default(true),
});

export const updateRoomSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, { message: 'Room label cannot be empty' })
    .max(100, { message: 'Room label must be under 100 characters' })
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, { message: 'Description must be under 255 characters' })
    .optional()
    .nullable(),
  isAvailable: z
    .boolean()
    .optional(),
}).refine(data => data.label !== undefined || data.description !== undefined || data.isAvailable !== undefined, {
  message: 'At least one field (label, description, or isAvailable) must be provided for update',
});

export const roomIdParamSchema = z.object({
  id: z.string().trim().min(1, { message: 'Valid room ID is required' }),
});
