import express from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { runtimeConfig } from '../config/runtimeConfig.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();
const requirePasswordRecovery = (req, res, next) => {
  if (!runtimeConfig.passwordRecoveryEnabled) {
    return next(new AppError('Password recovery is temporarily unavailable.', 503, 'PASSWORD_RECOVERY_DISABLED'));
  }
  return next();
};

// Public routes
router.get('/csrf', authController.getCsrfToken);
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, requirePasswordRecovery, authController.forgotPassword);
router.post('/reset-password', authLimiter, requirePasswordRecovery, authController.resetPassword);

// Protected routes
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.post('/password', requireAuth, authController.changePassword);

export default router;
