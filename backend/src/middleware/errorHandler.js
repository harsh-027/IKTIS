import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

/**
 * Centralized Express Error Handling Middleware
 * Guarantees a consistent JSON error response contract across all API endpoints
 */
export function errorHandler(err, req, res, next) {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed. Please check the submitted fields.',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      },
    });
  }

  // Handle custom application operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
  }

  // Handle malformed JSON request bodies
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Malformed JSON payload in request body.',
        code: 'INVALID_JSON',
      },
    });
  }

  // Generic unhandled exceptions
  console.error('[Unhandled API Error]:', err);

  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    error: {
      message: 'An unexpected internal server error occurred. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}
