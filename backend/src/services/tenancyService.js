import prisma from '../config/db.js';
import { AppError } from '../utils/errors.js';

/**
 * Create a new tenancy assignment with strict overlap prevention
 */
export async function createTenancy(ownerId, { tenantId, roomId, startDate, endDate, monthlyRent, rentDueDay }) {
  const start = new Date(startDate);
  const end = endDate && endDate.trim() !== '' ? new Date(endDate) : null;

  if (end && start > end) {
    throw new AppError('Start date must be before or equal to end date', 400, 'INVALID_DATE_RANGE');
  }

  // 1. Verify Tenant ownership and active status
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, ownerId },
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
  }

  if (tenant.archivedAt) {
    throw new AppError('Cannot assign a tenancy to an archived tenant', 400, 'TENANT_ARCHIVED');
  }

  // 2. Verify Room ownership, property ownership, availability, and active status
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
      property: {
        ownerId,
      },
    },
    include: {
      property: true,
    },
  });

  if (!room) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  if (room.archivedAt) {
    throw new AppError('Cannot assign a tenancy to an archived room', 400, 'ROOM_ARCHIVED');
  }

  if (room.property.archivedAt) {
    throw new AppError('Cannot assign a tenancy to a room in an archived property', 400, 'PROPERTY_ARCHIVED');
  }

  if (!room.isAvailable) {
    throw new AppError(
      'Room is currently marked as under maintenance and is not available for new tenancies',
      400,
      'ROOM_NOT_AVAILABLE'
    );
  }

  // 3. Strict Overlap Check for the same room
  const overlappingConditions = [
    ...(end ? [{ startDate: { lte: end } }] : []),
    {
      OR: [
        { endDate: null },
        { endDate: { gte: start } },
      ],
    },
  ];

  const overlapping = await prisma.tenancy.findFirst({
    where: {
      roomId,
      AND: overlappingConditions,
    },
    include: {
      tenant: {
        select: { fullName: true },
      },
    },
  });

  if (overlapping) {
    const existingStart = overlapping.startDate.toISOString().slice(0, 10);
    const existingEnd = overlapping.endDate ? overlapping.endDate.toISOString().slice(0, 10) : 'ongoing';
    throw new AppError(
      `Room already has an active tenancy from ${existingStart} to ${existingEnd} assigned to tenant "${overlapping.tenant?.fullName}". Overlapping tenancies are not permitted.`,
      409,
      'TENANCY_OVERLAP'
    );
  }

  // 4. Create tenancy
  const tenancy = await prisma.tenancy.create({
    data: {
      ownerId,
      tenantId,
      roomId,
      startDate: start,
      endDate: end,
      monthlyRent,
      rentDueDay,
    },
    include: {
      tenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      room: {
        select: {
          id: true,
          label: true,
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      },
    },
  });

  return tenancy;
}

/**
 * End/conclude a tenancy by specifying an end date
 */
export async function endTenancy(ownerId, tenancyId, { endDate }) {
  const tenancy = await prisma.tenancy.findFirst({
    where: { id: tenancyId, ownerId },
    include: {
      room: true,
    },
  });

  if (!tenancy) {
    throw new AppError('Tenancy not found', 404, 'TENANCY_NOT_FOUND');
  }

  const end = new Date(endDate);
  const start = new Date(tenancy.startDate);

  if (end < start) {
    throw new AppError('End date must be on or after the tenancy start date', 400, 'INVALID_DATE_RANGE');
  }

  // Check if concluding at this end date creates an overlap with another tenancy for the room
  const overlapping = await prisma.tenancy.findFirst({
    where: {
      roomId: tenancy.roomId,
      id: { not: tenancyId },
      startDate: { lte: end },
      OR: [
        { endDate: null },
        { endDate: { gte: start } },
      ],
    },
    include: {
      tenant: { select: { fullName: true } },
    },
  });

  if (overlapping) {
    throw new AppError(
      `Setting this end date conflicts with an existing tenancy for tenant "${overlapping.tenant?.fullName}"`,
      409,
      'TENANCY_OVERLAP'
    );
  }

  const updated = await prisma.tenancy.update({
    where: { id: tenancyId },
    data: {
      endDate: end,
    },
    include: {
      tenant: {
        select: {
          id: true,
          fullName: true,
        },
      },
      room: {
        select: {
          id: true,
          label: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return updated;
}

/**
 * Get tenancy by ID ensuring landlord isolation
 */
export async function getTenancyById(ownerId, tenancyId) {
  const tenancy = await prisma.tenancy.findFirst({
    where: { id: tenancyId, ownerId },
    include: {
      tenant: true,
      room: {
        include: {
          property: true,
        },
      },
    },
  });

  if (!tenancy) {
    throw new AppError('Tenancy not found', 404, 'TENANCY_NOT_FOUND');
  }

  const now = new Date();
  const isActive = new Date(tenancy.startDate) <= now && (!tenancy.endDate || new Date(tenancy.endDate) >= now);

  return {
    ...tenancy,
    isActive,
  };
}

/**
 * List tenancies for a landlord with optional filters
 */
export async function listTenancies(ownerId, { roomId, tenantId, status } = {}) {
  const now = new Date();

  const where = {
    ownerId,
    ...(roomId ? { roomId } : {}),
    ...(tenantId ? { tenantId } : {}),
  };

  if (status === 'active') {
    where.startDate = { lte: now };
    where.OR = [
      { endDate: null },
      { endDate: { gte: now } },
    ];
  } else if (status === 'past') {
    where.endDate = { lt: now };
  }

  const tenancies = await prisma.tenancy.findMany({
    where,
    orderBy: { startDate: 'desc' },
    include: {
      tenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      room: {
        select: {
          id: true,
          label: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return tenancies.map((t) => {
    const isActive = new Date(t.startDate) <= now && (!t.endDate || new Date(t.endDate) >= now);
    return {
      ...t,
      isActive,
    };
  });
}
