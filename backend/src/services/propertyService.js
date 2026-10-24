import prisma from '../config/db.js';
import { AppError } from '../utils/errors.js';

/**
 * List all properties owned by a landlord
 */
export async function listProperties(ownerId, { includeArchived = false } = {}) {
  const where = {
    ownerId,
    ...(includeArchived ? {} : { archivedAt: null }),
  };

  const properties = await prisma.property.findMany({
    where,
    include: {
      rooms: {
        where: { archivedAt: null },
        select: {
          id: true,
          label: true,
          isAvailable: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return properties.map(property => {
    const totalRooms = property.rooms.length;
    const availableRooms = property.rooms.filter(r => r.isAvailable).length;

    return {
      id: property.id,
      name: property.name,
      address: property.address,
      archivedAt: property.archivedAt,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      stats: {
        totalRooms,
        availableRooms,
      },
    };
  });
}

/**
 * Get single property by ID ensuring owner isolation
 */
export async function getPropertyById(ownerId, propertyId) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      ownerId,
    },
    include: {
      rooms: {
        where: { archivedAt: null },
        orderBy: { label: 'asc' },
        include: {
          tenancies: {
            where: {
              startDate: { lte: new Date() },
              OR: [
                { endDate: null },
                { endDate: { gte: new Date() } },
              ],
            },
            take: 1,
            select: {
              id: true,
              tenantId: true,
              startDate: true,
              endDate: true,
              tenant: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!property) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  // Format rooms with derived occupancy
  const formattedRooms = property.rooms.map(room => {
    const activeTenancy = room.tenancies?.[0] || null;
    return {
      id: room.id,
      propertyId: room.propertyId,
      label: room.label,
      description: room.description,
      isAvailable: room.isAvailable, // Operational / maintenance availability
      isOccupied: !!activeTenancy,    // Dynamically derived from active tenancy
      currentTenancy: activeTenancy ? {
        id: activeTenancy.id,
        tenantId: activeTenancy.tenantId,
        tenantName: activeTenancy.tenant?.fullName,
        startDate: activeTenancy.startDate,
        endDate: activeTenancy.endDate,
      } : null,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  });

  return {
    id: property.id,
    name: property.name,
    address: property.address,
    archivedAt: property.archivedAt,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
    rooms: formattedRooms,
    stats: {
      totalRooms: formattedRooms.length,
      availableRooms: formattedRooms.filter(r => r.isAvailable).length,
      occupiedRooms: formattedRooms.filter(r => r.isOccupied).length,
    },
  };
}

/**
 * Create a new property
 */
export async function createProperty(ownerId, { name, address }) {
  const property = await prisma.property.create({
    data: {
      ownerId,
      name: name.trim(),
      address: address.trim(),
    },
  });

  return property;
}

/**
 * Update an existing property
 */
export async function updateProperty(ownerId, propertyId, data) {
  // First ensure property exists and belongs to the owner
  const existing = await prisma.property.findFirst({
    where: { id: propertyId, ownerId },
  });

  if (!existing) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  if (existing.archivedAt) {
    throw new AppError('Cannot update an archived property', 400, 'PROPERTY_ARCHIVED');
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.address ? { address: data.address.trim() } : {}),
    },
  });

  return updated;
}

/**
 * Soft-archive a property
 */
export async function archiveProperty(ownerId, propertyId) {
  const existing = await prisma.property.findFirst({
    where: { id: propertyId, ownerId },
  });

  if (!existing) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  if (existing.archivedAt) {
    return existing; // Already archived
  }

  const now = new Date();

  // Check if any room in this property has an active tenancy
  const activeTenancy = await prisma.tenancy.findFirst({
    where: {
      room: {
        propertyId,
      },
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
  });

  if (activeTenancy) {
    throw new AppError(
      'Cannot archive a property with active tenancies. Conclude or reassign active tenancies first.',
      400,
      'PROPERTY_HAS_ACTIVE_TENANCIES'
    );
  }

  // Soft-archive the property and its rooms
  const archived = await prisma.$transaction(async (tx) => {
    // Soft-archive active rooms under this property
    await tx.room.updateMany({
      where: { propertyId, archivedAt: null },
      data: { archivedAt: now },
    });

    return tx.property.update({
      where: { id: propertyId },
      data: { archivedAt: now },
    });
  });

  return archived;
}

