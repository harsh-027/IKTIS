import prisma from '../config/db.js';
import { AppError } from '../utils/errors.js';

/**
 * List all tenants owned by a landlord
 */
export async function listTenants(ownerId, { includeArchived = false, search = '' } = {}) {
  const now = new Date();

  const where = {
    ownerId,
    ...(includeArchived ? {} : { archivedAt: null }),
  };

  if (search && search.trim() !== '') {
    const q = search.trim();
    where.OR = [
      { fullName: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const tenants = await prisma.tenant.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      tenancies: {
        where: {
          startDate: { lte: now },
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
        take: 1,
        include: {
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
      },
      _count: {
        select: { tenancies: true },
      },
    },
  });

  return tenants.map((tenant) => {
    const activeTenancy = tenant.tenancies?.[0] || null;
    return {
      id: tenant.id,
      fullName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email,
      notes: tenant.notes,
      archivedAt: tenant.archivedAt,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      currentTenancy: activeTenancy ? {
        id: activeTenancy.id,
        roomId: activeTenancy.roomId,
        roomLabel: activeTenancy.room?.label,
        propertyId: activeTenancy.room?.property?.id,
        propertyName: activeTenancy.room?.property?.name,
        startDate: activeTenancy.startDate,
        endDate: activeTenancy.endDate,
        monthlyRent: activeTenancy.monthlyRent,
        rentDueDay: activeTenancy.rentDueDay,
      } : null,
      stats: {
        totalTenancies: tenant._count?.tenancies || 0,
        isCurrentlyRenting: !!activeTenancy,
      },
    };
  });
}

/**
 * Get tenant by ID with full tenancy history
 */
export async function getTenantById(ownerId, tenantId) {
  const now = new Date();

  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      ownerId,
    },
    include: {
      tenancies: {
        orderBy: { startDate: 'desc' },
        include: {
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
      },
    },
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
  }

  const formattedTenancies = tenant.tenancies.map((t) => {
    const isOngoing = !t.endDate || new Date(t.endDate) >= now;
    const hasStarted = new Date(t.startDate) <= now;
    const isActive = hasStarted && isOngoing;

    return {
      id: t.id,
      roomId: t.roomId,
      roomLabel: t.room?.label,
      propertyId: t.room?.property?.id,
      propertyName: t.room?.property?.name,
      propertyAddress: t.room?.property?.address,
      startDate: t.startDate,
      endDate: t.endDate,
      monthlyRent: t.monthlyRent,
      rentDueDay: t.rentDueDay,
      isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  });

  const activeTenancy = formattedTenancies.find((t) => t.isActive) || null;
  const previousTenancies = formattedTenancies.filter((t) => !t.isActive);

  return {
    id: tenant.id,
    fullName: tenant.fullName,
    phone: tenant.phone,
    email: tenant.email,
    notes: tenant.notes,
    archivedAt: tenant.archivedAt,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
    activeTenancy,
    previousTenancies,
    tenancies: formattedTenancies,
  };
}

/**
 * Create a new tenant record
 */
export async function createTenant(ownerId, { fullName, phone, email, notes }) {
  const tenant = await prisma.tenant.create({
    data: {
      ownerId,
      fullName: fullName.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() ? email.trim().toLowerCase() : null,
      notes: notes?.trim() || null,
    },
  });

  return tenant;
}

/**
 * Update tenant details
 */
export async function updateTenant(ownerId, tenantId, data) {
  const existing = await prisma.tenant.findFirst({
    where: { id: tenantId, ownerId },
  });

  if (!existing) {
    throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
  }

  if (existing.archivedAt) {
    throw new AppError('Cannot update an archived tenant', 400, 'TENANT_ARCHIVED');
  }

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.email !== undefined ? { email: data.email?.trim() ? data.email.trim().toLowerCase() : null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
    },
  });

  return updated;
}

/**
 * Soft-archive a tenant
 */
export async function archiveTenant(ownerId, tenantId) {
  const existing = await prisma.tenant.findFirst({
    where: { id: tenantId, ownerId },
  });

  if (!existing) {
    throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
  }

  if (existing.archivedAt) {
    return existing; // Already archived
  }

  const now = new Date();

  // Check if tenant has an active tenancy
  const activeTenancy = await prisma.tenancy.findFirst({
    where: {
      tenantId,
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
  });

  if (activeTenancy) {
    throw new AppError(
      'Cannot archive a tenant with an active tenancy. End the tenancy first.',
      400,
      'TENANT_HAS_ACTIVE_TENANCY'
    );
  }

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      archivedAt: now,
    },
  });

  return updated;
}
