import prisma from '../config/db.js';
import { generateSessionToken, hashToken, hashPassword, comparePassword } from '../utils/crypto.js';
import { AppError } from '../utils/errors.js';

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Register a new landlord user and create an initial active session
 */
export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(password);

  // Transactionally create user and their initial session
  const sessionToken = generateSessionToken();
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  const { user } = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    await tx.session.create({
      data: {
        userId: createdUser.id,
        tokenHash,
        expiresAt,
      },
    });

    return { user: createdUser };
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    sessionToken,
    expiresAt,
  };
}

/**
 * Authenticate landlord user and issue a new database-backed session
 */
export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Use generic credential error to prevent email enumeration
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Issue new cryptographically random session token
  const sessionToken = generateSessionToken();
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    sessionToken,
    expiresAt,
  };
}

/**
 * Validate an incoming session token against MySQL Session table
 */
export async function validateSession(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') {
    return null;
  }

  const tokenHash = hashToken(sessionToken);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Check if session has been explicitly revoked
  if (session.revokedAt !== null) {
    return null;
  }

  // Check if session has expired
  if (new Date(session.expiresAt) <= new Date()) {
    return null;
  }

  if (!session.user) {
    return null;
  }

  return {
    session: {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    },
    user: session.user,
  };
}

/**
 * Invalidate a session upon logout
 */
export async function logoutUser(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') {
    return;
  }

  const tokenHash = hashToken(sessionToken);

  await prisma.session.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Revoke all active sessions belonging to a user (used on password change)
 */
export async function revokeAllUserSessions(userId) {
  if (!userId) return;

  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Change a password, revoke all previous sessions, and issue a replacement session.
 */
export async function changeUserPassword({ userId, currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
    throw new AppError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
  }

  const passwordHash = await hashPassword(newPassword);
  const sessionToken = generateSessionToken();
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await tx.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await tx.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  });

  return { sessionToken, expiresAt };
}
