import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/authValidators.js';
import * as authService from '../services/authService.js';
import * as passwordResetService from '../services/passwordResetService.js';
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getSessionCookieOptions,
  clearSessionCookie,
} from '../utils/cookies.js';

/**
 * Handle new landlord user registration
 */
export async function register(req, res, next) {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { user, sessionToken, expiresAt } = await authService.registerUser(validatedData);

    // Set secure HTTP-only session cookie
    res.cookie(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions(expiresAt));

    return res.status(201).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle landlord sign in
 */
export async function login(req, res, next) {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { user, sessionToken, expiresAt } = await authService.loginUser(validatedData);

    // Set secure HTTP-only session cookie
    res.cookie(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions(expiresAt));

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await passwordResetService.requestPasswordReset(email);
    return res.status(202).json({
      success: true,
      data: {
        message: 'If an account exists for that email, password recovery instructions have been sent.',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    await passwordResetService.resetUserPassword(validatedData);
    return res.status(200).json({
      success: true,
      data: { message: 'Password reset successfully. Please sign in.' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle sign out and session revocation
 */
export async function logout(req, res, next) {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (sessionToken) {
      await authService.logoutUser(sessionToken);
    }

    clearSessionCookie(res);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Signed out successfully.',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return currently authenticated user profile
 */
export async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change the authenticated landlord's password and rotate their session.
 */
export async function changePassword(req, res, next) {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const { sessionToken, expiresAt } = await authService.changeUserPassword({
      userId: req.user.id,
      ...validatedData,
    });

    res.cookie(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions(expiresAt));

    return res.status(200).json({
      success: true,
      data: {
        message: 'Password changed successfully.',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const user = await authService.updateUserProfile(req.user.id, validatedData);

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    await authService.deleteUserAccount(req.user.id);
    clearSessionCookie(res);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Obtain or refresh the CSRF token for state-changing requests
 */
export async function getCsrfToken(req, res, next) {
  try {
    const csrfToken = req.csrfToken || req.cookies?.[CSRF_COOKIE_NAME];

    return res.status(200).json({
      success: true,
      data: {
        csrfToken,
      },
    });
  } catch (error) {
    next(error);
  }
}
