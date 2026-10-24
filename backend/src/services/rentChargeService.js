import prisma from '../config/db.js';
import { AppError } from '../utils/errors.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse "YYYY-MM" into the canonical period date (first of month) and dueDate.
 * @param {string} yearMonth - e.g. "2026-11"
 * @param {number} rentDueDay - 1–31
 * @returns {{ period: Date, dueDate: Date }}
 */
function buildPeriodDates(yearMonth, rentDueDay) {
  const [year, month] = yearMonth.split('-').map(Number);

  // period = first day of the month
  const period = new Date(Date.UTC(year, month - 1, 1));

  // dueDate = rentDueDay of the same month, clamped to last day of month
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(rentDueDay, lastDay);
  const dueDate = new Date(Date.UTC(year, month - 1, day));

  return { period, dueDate };
}

/**
 * Compute the outstanding balance for a single RentCharge.
 * outstanding = amountDue - sum(valid non-voided allocations)
 * @param {object} charge - Prisma RentCharge with allocations included
 * @returns {number}
 */
function computeOutstanding(charge) {
  const allocated = (charge.allocations || []).reduce((sum, a) => {
    // Only count allocations from non-voided payments
    if (!a.payment || a.payment.voidedAt) return sum;
    return sum + Number(a.amountAllocated);
  }, 0);
  return Math.max(0, Number(charge.amountDue) - allocated);
}

/**
 * Compute payment status for a charge.
 * @param {object} charge - with allocations + payment nested
 * @param {Date} now
 * @returns {'unpaid'|'partial'|'paid'|'overdue'}
 */
function computeStatus(charge, now = new Date()) {
  const outstanding = computeOutstanding(charge);
  const amountDue = Number(charge.amountDue);

  if (outstanding <= 0) return 'paid';

  const allocated = amountDue - outstanding;
  const dueDate = new Date(charge.dueDate);

  if (allocated > 0) return 'partial';
  if (dueDate < now) return 'overdue';
  return 'unpaid';
}

/**
 * Serialize a RentCharge record for API responses.
 */
function serializeCharge(charge) {
  const now = new Date();
  const outstanding = computeOutstanding(charge);
  const status = computeStatus(charge, now);

  return {
    id: charge.id,
    ownerId: charge.ownerId,
    tenancyId: charge.tenancyId,
    period: charge.period,
    amountDue: Number(charge.amountDue),
    dueDate: charge.dueDate,
    outstanding,
    amountPaid: Number(charge.amountDue) - outstanding,
    status,
    // Denormalized tenancy context for display
    tenancy: charge.tenancy ? {
      id: charge.tenancy.id,
      monthlyRent: Number(charge.tenancy.monthlyRent),
      rentDueDay: charge.tenancy.rentDueDay,
      startDate: charge.tenancy.startDate,
      endDate: charge.tenancy.endDate,
      tenant: charge.tenancy.tenant ? {
        id: charge.tenancy.tenant.id,
        fullName: charge.tenancy.tenant.fullName,
        phone: charge.tenancy.tenant.phone,
        email: charge.tenancy.tenant.email,
      } : null,
      room: charge.tenancy.room ? {
        id: charge.tenancy.room.id,
        label: charge.tenancy.room.label,
        property: charge.tenancy.room.property ? {
          id: charge.tenancy.room.property.id,
          name: charge.tenancy.room.property.name,
        } : null,
      } : null,
    } : null,
    createdAt: charge.createdAt,
    updatedAt: charge.updatedAt,
  };
}

// ─── Standard include fragment ──────────────────────────────────────────────

const CHARGE_INCLUDE = {
  tenancy: {
    include: {
      tenant: {
        select: { id: true, fullName: true, phone: true, email: true },
      },
      room: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
    },
  },
  allocations: {
    include: {
      payment: { select: { id: true, voidedAt: true } },
    },
  },
};

// ─── Service functions ───────────────────────────────────────────────────────

/**
 * List rent charges for the authenticated landlord.
 * Supports filtering by month (YYYY-MM) and status.
 */
export async function listRentCharges(ownerId, { month, status, tenancyId } = {}) {
  const where = { ownerId };

  if (month) {
    const [year, mon] = month.split('-').map(Number);
    const periodStart = new Date(Date.UTC(year, mon - 1, 1));
    where.period = periodStart;
  }

  if (tenancyId) {
    where.tenancyId = tenancyId;
  }

  const charges = await prisma.rentCharge.findMany({
    where,
    orderBy: [{ period: 'desc' }, { createdAt: 'asc' }],
    include: CHARGE_INCLUDE,
  });

  const serialized = charges.map(serializeCharge);

  // Post-filter by status (derived, not stored in DB)
  if (status && ['unpaid', 'partial', 'paid', 'overdue'].includes(status)) {
    return serialized.filter((c) => c.status === status);
  }

  return serialized;
}

/**
 * Get a single rent charge by ID, verifying landlord ownership.
 */
export async function getRentChargeById(ownerId, chargeId) {
  const charge = await prisma.rentCharge.findFirst({
    where: { id: chargeId, ownerId },
    include: CHARGE_INCLUDE,
  });

  if (!charge) {
    throw new AppError('Rent charge not found', 404, 'RENT_CHARGE_NOT_FOUND');
  }

  return serializeCharge(charge);
}

/**
 * Bulk generate rent charges for all eligible tenancies in a given month.
 * Idempotent: skips existing (tenancyId, period) pairs.
 *
 * Eligibility rules:
 * - Tenancy ownerId === landlord
 * - Tenancy startDate <= last day of month
 * - Tenancy endDate IS NULL OR endDate >= first day of month
 * - Room is NOT archived
 * - Property is NOT archived
 *
 * @param {string} ownerId
 * @param {string} yearMonth - "YYYY-MM"
 * @returns {{ generated: number, skipped: number, charges: object[] }}
 */
export async function generateRentCharges(ownerId, yearMonth) {
  const [year, mon] = yearMonth.split('-').map(Number);
  const periodStart = new Date(Date.UTC(year, mon - 1, 1));
  const periodEnd = new Date(Date.UTC(year, mon, 0)); // last day of month

  // Find all eligible tenancies for this period
  const eligibleTenancies = await prisma.tenancy.findMany({
    where: {
      ownerId,
      startDate: { lte: periodEnd },
      OR: [
        { endDate: null },
        { endDate: { gte: periodStart } },
      ],
      room: {
        archivedAt: null,
        property: {
          archivedAt: null,
        },
      },
    },
    include: {
      room: {
        include: {
          property: { select: { id: true, name: true, archivedAt: true } },
        },
      },
    },
  });

  if (eligibleTenancies.length === 0) {
    return { generated: 0, skipped: 0, total: 0, charges: [] };
  }

  // Find existing charges for this period (to detect duplicates)
  const existingCharges = await prisma.rentCharge.findMany({
    where: {
      ownerId,
      period: periodStart,
      tenancyId: { in: eligibleTenancies.map((t) => t.id) },
    },
    select: { tenancyId: true },
  });

  const alreadyCharged = new Set(existingCharges.map((c) => c.tenancyId));

  const toCreate = eligibleTenancies.filter((t) => !alreadyCharged.has(t.id));
  const skipped = eligibleTenancies.length - toCreate.length;

  if (toCreate.length === 0) {
    return { generated: 0, skipped, total: eligibleTenancies.length, charges: [] };
  }

  // Build charge records
  const chargeData = toCreate.map((tenancy) => {
    const { dueDate } = buildPeriodDates(yearMonth, tenancy.rentDueDay);
    return {
      ownerId,
      tenancyId: tenancy.id,
      period: periodStart,
      amountDue: tenancy.monthlyRent,
      dueDate,
    };
  });

  // Use createMany inside a transaction for atomicity
  // Note: createMany doesn't return full records, so we fetch after
  await prisma.$transaction(async (tx) => {
    await tx.rentCharge.createMany({
      data: chargeData,
      skipDuplicates: true, // DB-level safety net for concurrent requests
    });
  });

  // Fetch the newly created charges to return them
  const newCharges = await prisma.rentCharge.findMany({
    where: {
      ownerId,
      period: periodStart,
      tenancyId: { in: toCreate.map((t) => t.id) },
    },
    include: CHARGE_INCLUDE,
    orderBy: { createdAt: 'asc' },
  });

  return {
    generated: newCharges.length,
    skipped,
    total: eligibleTenancies.length,
    charges: newCharges.map(serializeCharge),
  };
}

/**
 * Create a single custom rent charge (for partial first/last month amounts).
 * Validates:
 * - Tenancy ownership
 * - Period format (YYYY-MM-01)
 * - Duplicate prevention via DB unique constraint
 */
export async function createRentCharge(ownerId, { tenancyId, period, amountDue, dueDate }) {
  // Verify tenancy ownership and active status
  const tenancy = await prisma.tenancy.findFirst({
    where: { id: tenancyId, ownerId },
    include: {
      room: {
        include: {
          property: { select: { archivedAt: true } },
        },
      },
    },
  });

  if (!tenancy) {
    throw new AppError('Tenancy not found', 404, 'TENANCY_NOT_FOUND');
  }

  if (tenancy.room?.archivedAt) {
    throw new AppError('Cannot create charge for an archived room', 400, 'ROOM_ARCHIVED');
  }

  if (tenancy.room?.property?.archivedAt) {
    throw new AppError('Cannot create charge for a room in an archived property', 400, 'PROPERTY_ARCHIVED');
  }

  const periodDate = new Date(period); // Already validated as YYYY-MM-01
  const dueDateObj = new Date(dueDate);

  // Check for duplicate
  const existing = await prisma.rentCharge.findUnique({
    where: {
      tenancyId_period: { tenancyId, period: periodDate },
    },
  });

  if (existing) {
    throw new AppError(
      'A rent charge already exists for this tenancy and period. Use the existing charge or update its amount.',
      409,
      'RENT_CHARGE_DUPLICATE'
    );
  }

  const charge = await prisma.rentCharge.create({
    data: {
      ownerId,
      tenancyId,
      period: periodDate,
      amountDue,
      dueDate: dueDateObj,
    },
    include: CHARGE_INCLUDE,
  });

  return serializeCharge(charge);
}

/**
 * Update a rent charge's amountDue (custom partial month override).
 * Only allowed if the charge has no paid allocations.
 */
export async function updateRentCharge(ownerId, chargeId, { amountDue }) {
  const charge = await prisma.rentCharge.findFirst({
    where: { id: chargeId, ownerId },
    include: {
      allocations: {
        include: {
          payment: { select: { voidedAt: true } },
        },
      },
    },
  });

  if (!charge) {
    throw new AppError('Rent charge not found', 404, 'RENT_CHARGE_NOT_FOUND');
  }

  // Check if any non-voided payment allocations exist
  const hasAllocations = charge.allocations.some(
    (a) => !a.payment?.voidedAt
  );

  if (hasAllocations) {
    throw new AppError(
      'Cannot modify a rent charge that has payment allocations. Void the payment first.',
      400,
      'RENT_CHARGE_HAS_ALLOCATIONS'
    );
  }

  const updated = await prisma.rentCharge.update({
    where: { id: chargeId },
    data: { amountDue },
    include: CHARGE_INCLUDE,
  });

  return serializeCharge(updated);
}

/**
 * Delete a rent charge — only if it has no allocations.
 */
export async function deleteRentCharge(ownerId, chargeId) {
  const charge = await prisma.rentCharge.findFirst({
    where: { id: chargeId, ownerId },
    include: {
      allocations: {
        include: {
          payment: { select: { voidedAt: true } },
        },
      },
    },
  });

  if (!charge) {
    throw new AppError('Rent charge not found', 404, 'RENT_CHARGE_NOT_FOUND');
  }

  const hasAllocations = charge.allocations.some(
    (a) => !a.payment?.voidedAt
  );

  if (hasAllocations) {
    throw new AppError(
      'Cannot delete a rent charge with existing payment allocations. Void the payment first.',
      400,
      'RENT_CHARGE_HAS_ALLOCATIONS'
    );
  }

  await prisma.rentCharge.delete({ where: { id: chargeId } });

  return { deleted: true };
}

/**
 * Get a summary for a given month: total due, total paid, total outstanding,
 * and counts per status.
 */
export async function getRentChargeSummary(ownerId, yearMonth) {
  const [year, mon] = yearMonth.split('-').map(Number);
  const periodStart = new Date(Date.UTC(year, mon - 1, 1));

  const charges = await prisma.rentCharge.findMany({
    where: { ownerId, period: periodStart },
    include: CHARGE_INCLUDE,
  });

  const serialized = charges.map(serializeCharge);

  const summary = {
    month: yearMonth,
    totalCharges: serialized.length,
    totalDue: serialized.reduce((s, c) => s + c.amountDue, 0),
    totalPaid: serialized.reduce((s, c) => s + c.amountPaid, 0),
    totalOutstanding: serialized.reduce((s, c) => s + c.outstanding, 0),
    counts: {
      unpaid: serialized.filter((c) => c.status === 'unpaid').length,
      partial: serialized.filter((c) => c.status === 'partial').length,
      paid: serialized.filter((c) => c.status === 'paid').length,
      overdue: serialized.filter((c) => c.status === 'overdue').length,
    },
  };

  return summary;
}
