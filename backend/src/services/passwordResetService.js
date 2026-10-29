import prisma from '../config/db.js';
import { runtimeConfig } from '../config/runtimeConfig.js';
import { generateSessionToken, hashPassword, hashToken } from '../utils/crypto.js';
import { AppError } from '../utils/errors.js';

const RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1000;

async function sendResetEmail({ email, resetUrl }) {
  if (!runtimeConfig.resendApiKey || !runtimeConfig.resendFromEmail) {
    throw new AppError('Password recovery is not configured.', 503, 'PASSWORD_RECOVERY_UNAVAILABLE');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${runtimeConfig.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: runtimeConfig.resendFromEmail,
      to: [email],
      subject: 'Reset your IKTIS password',
      text: `Use this link to reset your IKTIS password. It expires in one hour:\n\n${resetUrl}`,
    }),
  });

  if (!response.ok) {
    throw new AppError('Unable to send password recovery email.', 502, 'PASSWORD_RECOVERY_DELIVERY_FAILED');
  }
}

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true },
  });

  if (!user) return;

  const rawToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_LIFETIME_MS);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt,
      },
    });
  });

  const resetUrl = `${runtimeConfig.frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendResetEmail({ email: user.email, resetUrl });
}

export async function resetUserPassword({ token, newPassword }) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    throw new AppError('This password reset link is invalid or expired.', 400, 'INVALID_RESET_TOKEN');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
    await tx.session.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });
  });
}
