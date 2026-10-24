import prisma from '../config/db.js';
import { AppError } from '../utils/errors.js';

/**
 * List all rooms for a specific property owned by the landlord
 */
export async function listRooms(ownerId, propertyId, { includeArchived = false } = {}) {
  // Ensure property exists and belongs to the owner
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId },
  });

  if (!property) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  const where = {
    propertyId,
    ...(includeArchived ? {} : { archivedAt: null }),
  };

  const rooms = await prisma.room.findMany({
    where,
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
  });

  return rooms.map(room => {
    const activeTenancy = room.tenancies?.[0] || null;
    return {
      id: room.id,
      propertyId: room.propertyId,
      label: room.label,
      description: room.description,
      isAvailable: room.isAvailable, // Operational availability
      isOccupied: !!activeTenancy,    // Derived from active tenancy
      currentTenancy: activeTenancy ? {
        id: activeTenancy.id,
        tenantId: activeTenancy.tenantId,
        tenantName: activeTenancy.tenant?.fullName,
        startDate: activeTenancy.startDate,
        endDate: activeTenancy.endDate,
      } : null,
      archivedAt: room.archivedAt,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  });
}

/**
 * Get room by ID ensuring landlord ownership
 */
export async function getRoomById(ownerId, roomId) {
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
      property: {
        ownerId,
      },
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          ownerId: true,
        },
      },
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
  });

  if (!room) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  const activeTenancy = room.tenancies?.[0] || null;

  return {
    id: room.id,
    propertyId: room.propertyId,
    property: room.property,
    label: room.label,
    description: room.description,
    isAvailable: room.isAvailable,
    isOccupied: !!activeTenancy,
    currentTenancy: activeTenancy ? {
      id: activeTenancy.id,
      tenantId: activeTenancy.tenantId,
      tenantName: activeTenancy.tenant?.fullName,
      startDate: activeTenancy.startDate,
      endDate: activeTenancy.endDate,
    } : null,
    archivedAt: room.archivedAt,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

/**
 * Create a new room in a property
 */
export async function createRoom(ownerId, propertyId, { label, description, isAvailable = true }) {
  // Ensure property exists, belongs to landlord, and is not archived
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId, archivedAt: null },
  });

  if (!property) {
    throw new AppError('Property not found or is archived', 404, 'PROPERTY_NOT_FOUND');
  }

  const trimmedLabel = label.trim();

  // Check for duplicate room label within the property (consistent with DB unique constraint)
  const existingRoom = await prisma.room.findFirst({
    where: {
      propertyId,
      label: trimmedLabel,
    },
  });

  if (existingRoom) {
    if (existingRoom.archivedAt) {
      throw new AppError(
        `A room with label "${trimmedLabel}" exists as an archived room in this property. Room labels must be unique within the property.`,
        409,
        'ROOM_LABEL_EXISTS'
      );
    }
    throw new AppError(
      `A room with label "${trimmedLabel}" already exists in this property`,
      409,
      'ROOM_LABEL_EXISTS'
    );
  }

  try {
    const room = await prisma.room.create({
      data: {
        propertyId,
        label: trimmedLabel,
        description: description?.trim() || null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      },
    });

    return room;
  } catch (err) {
    // Catch MySQL unique constraint violation if concurrent request occurs
    if (err.code === 'P2002') {
      throw new AppError(
        `A room with label "${trimmedLabel}" already exists in this property`,
        409,
        'ROOM_LABEL_EXISTS'
      );
    }
    throw err;
  }
}

/**
 * Update an existing room
 */
export async function updateRoom(ownerId, roomId, data) {
  const existing = await prisma.room.findFirst({
    where: {
      id: roomId,
      property: {
        ownerId,
      },
    },
    include: {
      property: {
        select: {
          archivedAt: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  if (existing.archivedAt) {
    throw new AppError('Cannot update an archived room', 400, 'ROOM_ARCHIVED');
  }

  if (existing.property?.archivedAt) {
    throw new AppError('Cannot update a room in an archived property', 400, 'PROPERTY_ARCHIVED');
  }

  // If label is changing, check for duplicate within the same property
  if (data.label && data.label.trim() !== existing.label) {
    const trimmedLabel = data.label.trim();
    const duplicate = await prisma.room.findFirst({
      where: {
        propertyId: existing.propertyId,
        label: trimmedLabel,
        id: { not: roomId },
      },
    });

    if (duplicate) {
      if (duplicate.archivedAt) {
        throw new AppError(
          `A room with label "${trimmedLabel}" exists as an archived room in this property. Room labels must be unique within the property.`,
          409,
          'ROOM_LABEL_EXISTS'
        );
      }
      throw new AppError(
        `A room with label "${trimmedLabel}" already exists in this property`,
        409,
        'ROOM_LABEL_EXISTS'
      );
    }
  }

  try {
    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...(data.label ? { label: data.label.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
      },
    });

    return updated;
  } catch (err) {
    if (err.code === 'P2002') {
      throw new AppError(
        `A room with label "${data.label}" already exists in this property`,
        409,
        'ROOM_LABEL_EXISTS'
      );
    }
    throw err;
  }
}

/**
 * Soft-archive a room
 */
export async function archiveRoom(ownerId, roomId) {
  const existing = await prisma.room.findFirst({
    where: {
      id: roomId,
      property: {
        ownerId,
      },
    },
    include: {
      property: {
        select: {
          archivedAt: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  if (existing.archivedAt) {
    return existing; // Already archived
  }

  if (existing.property?.archivedAt) {
    throw new AppError('Cannot archive a room in an already archived property', 400, 'PROPERTY_ARCHIVED');
  }

  // Prevent archiving an occupied room with an active tenancy
  const now = new Date();
  const activeTenancy = await prisma.tenancy.findFirst({
    where: {
      roomId,
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
  });

  if (activeTenancy) {
    throw new AppError(
      'Cannot archive an occupied room with an active tenancy. Conclude or reassign the tenancy first.',
      400,
      'ROOM_IS_OCCUPIED'
    );
  }

  const updated = await prisma.room.update({
    where: { id: roomId },
    data: {
      archivedAt: now,
    },
  });

  return updated;
}
