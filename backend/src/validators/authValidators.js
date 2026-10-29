import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be under 100 characters' }),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email({ message: 'Please provide a valid email address' }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(100, { message: 'Password must be under 100 characters' }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms of Service' }),
  }),
  privacyPolicyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge the Privacy Policy' }),
  }),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email({ message: 'Please provide a valid email address' }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, { message: 'Password is required' }),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, { message: 'Current password is required' }),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, { message: 'New password must be at least 8 characters' })
    .max(100, { message: 'New password must be under 100 characters' }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email({ message: 'Please provide a valid email address' }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, { message: 'New password must be at least 8 characters' })
    .max(100, { message: 'New password must be under 100 characters' }),
});
