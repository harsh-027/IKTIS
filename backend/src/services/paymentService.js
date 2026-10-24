import prisma from '../config/db.js';
import { AppError } from '../utils/errors.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Deterministic unique receipt number for a payment: RCP-YYYYMM-XXXXXXXX
 * @param {object} payment
 * @returns {string}
 */
export function getReceiptNumber(payment) {
  const d = new Date(payment.paidAt);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const slug = (payment.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
  return `RCP-${y}${m}-${slug}`;
}

/**
 * Compute outstanding balance for a charge considering only non-voided payments.
 * @param {object} charge
 * @returns {number}
 */
export function computeChargeOutstanding(charge) {
  const allocated = (charge.allocations || []).reduce((sum, a) => {
    if (!a.payment || a.payment.voidedAt) return sum;
    return sum + Number(a.amountAllocated);
  }, 0);
  return Math.max(0, Number((Number(charge.amountDue) - allocated).toFixed(2)));
}

/**
 * Serialize a payment record for responses.
 */
function serializePayment(payment) {
  const isVoided = !!payment.voidedAt;
  const receiptNumber = getReceiptNumber(payment);

  const allocations = (payment.allocations || []).map((a) => {
    const charge = a.rentCharge;
    const periodStr = charge?.period
      ? new Date(charge.period).toISOString().slice(0, 7)
      : null;

    return {
      id: a.id,
      amountAllocated: Number(a.amountAllocated),
      rentChargeId: a.rentChargeId,
      period: periodStr,
      dueDate: charge?.dueDate || null,
      chargeAmountDue: charge ? Number(charge.amountDue) : null,
      tenancy: charge?.tenancy ? {
        id: charge.tenancy.id,
        roomLabel: charge.tenancy.room?.label || null,
        propertyName: charge.tenancy.room?.property?.name || null,
      } : null,
      createdAt: a.createdAt,
    };
  });

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amountAllocated, 0);

  return {
    id: payment.id,
    receiptNumber,
    ownerId: payment.ownerId,
    tenantId: payment.tenantId,
    amount: Number(payment.amount),
    paidAt: payment.paidAt,
    method: payment.method || 'Cash',
    reference: payment.reference || null,
    notes: payment.notes || null,
    isVoided,
    voidedAt: payment.voidedAt,
    voidReason: payment.voidReason || null,
    totalAllocated: Number(totalAllocated.toFixed(2)),
    allocations,
    tenant: payment.tenant ? {
      id: payment.tenant.id,
      fullName: payment.tenant.fullName,
      phone: payment.tenant.phone,
      email: payment.tenant.email,
    } : null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

// ─── Standard Include Fragment ──────────────────────────────────────────────

const PAYMENT_INCLUDE = {
  tenant: {
    select: { id: true, fullName: true, phone: true, email: true },
  },
  allocations: {
    orderBy: { createdAt: 'asc' },
    include: {
      rentCharge: {
        include: {
          tenancy: {
            include: {
              room: {
                include: {
                  property: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  },
};

// ─── Service Functions ───────────────────────────────────────────────────────

/**
 * Get outstanding rent charges for a given tenant.
 * Ordered chronologically (FIFO order: dueDate ASC, period ASC, createdAt ASC).
 */
export async function getTenantOutstandingCharges(ownerId, tenantId) {
  // Verify tenant ownership
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, ownerId },
  });
  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
  }

  // Find all charges for this tenant's tenancies
  const charges = await prisma.rentCharge.findMany({
    where: {
      ownerId,
      tenancy: { tenantId },
    },
    include: {
      tenancy: {
        include: {
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
    },
    orderBy: [
      { dueDate: 'asc' },
      { period: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  // Calculate balances and filter to charges with remaining balance > 0
  const outstandingCharges = [];
  let totalOutstanding = 0;

  for (const c of charges) {
    const outstanding = computeChargeOutstanding(c);
    if (outstanding > 0) {
      const allocated = Number((Number(c.amountDue) - outstanding).toFixed(2));
      const periodStr = new Date(c.period).toISOString().slice(0, 7);
      outstandingCharges.push({
        id: c.id,
        tenancyId: c.tenancyId,
        period: periodStr,
        dueDate: c.dueDate,
        amountDue: Number(c.amountDue),
        amountPaid: allocated,
        outstanding,
        propertyName: c.tenancy?.room?.property?.name || 'Unknown Property',
        roomLabel: c.tenancy?.room?.label || 'Unknown Room',
      });
      totalOutstanding += outstanding;
    }
  }

  totalOutstanding = Number(totalOutstanding.toFixed(2));

  return {
    tenant: {
      id: tenant.id,
      fullName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email,
    },
    totalOutstanding,
    charges: outstandingCharges,
  };
}

/**
 * Record a payment for a tenant with FIFO or manual allocation.
 * Executes atomically in a transaction to prevent race conditions and over-allocations.
 */
export async function recordPayment(ownerId, {
  tenantId,
  amount,
  paidAt,
  method = 'Cash',
  reference = null,
  notes = null,
  allocationMode = 'fifo',
  allocations: manualAllocations = null,
}) {
  const paymentAmount = Number(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    throw new AppError('Payment amount must be greater than ₹0', 400, 'INVALID_AMOUNT');
  }

  // Execute within transaction to guarantee consistency and concurrency safety
  return await prisma.$transaction(async (tx) => {
    // 1. Verify tenant belongs to owner
    const tenant = await tx.tenant.findFirst({
      where: { id: tenantId, ownerId },
    });
    if (!tenant) {
      throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
    }

    // 2. Fetch all charges for this tenant under this owner
    const charges = await tx.rentCharge.findMany({
      where: {
        ownerId,
        tenancy: { tenantId },
      },
      include: {
        allocations: {
          include: {
            payment: { select: { id: true, voidedAt: true } },
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { period: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // 3. Compute current real-time outstanding balances
    const chargeBalanceMap = new Map();
    let totalOutstanding = 0;

    for (const c of charges) {
      const remaining = computeChargeOutstanding(c);
      chargeBalanceMap.set(c.id, { charge: c, remaining });
      totalOutstanding += remaining;
    }
    totalOutstanding = Number(totalOutstanding.toFixed(2));

    if (totalOutstanding <= 0) {
      throw new AppError(
        'Tenant has no outstanding rent charges. Overpayments are not supported.',
        400,
        'NO_OUTSTANDING_BALANCE'
      );
    }

    // 4. Plan allocations based on mode
    const plannedAllocations = [];

    if (allocationMode === 'fifo') {
      // Check total overpayment
      if (paymentAmount > totalOutstanding) {
        throw new AppError(
          `Payment amount (₹${paymentAmount.toFixed(2)}) exceeds tenant's total outstanding balance (₹${totalOutstanding.toFixed(2)}). Overpayments are not supported.`,
          400,
          'OVERPAYMENT_REJECTED'
        );
      }

      let remainingToAllocate = paymentAmount;

      for (const c of charges) {
        if (remainingToAllocate <= 0.001) break;
        const info = chargeBalanceMap.get(c.id);
        if (!info || info.remaining <= 0) continue;

        const allocAmount = Math.min(remainingToAllocate, info.remaining);
        const roundedAlloc = Number(allocAmount.toFixed(2));

        if (roundedAlloc > 0) {
          plannedAllocations.push({
            rentChargeId: c.id,
            amountAllocated: roundedAlloc,
          });
          remainingToAllocate = Number((remainingToAllocate - roundedAlloc).toFixed(2));
        }
      }

      // Final sanity check
      if (remainingToAllocate > 0.009) {
        throw new AppError(
          'Unable to allocate entire payment amount using FIFO.',
          400,
          'ALLOCATION_FAILED'
        );
      }
    } else {
      // MANUAL mode
      if (!Array.isArray(manualAllocations) || manualAllocations.length === 0) {
        throw new AppError(
          'Allocations list must not be empty when using manual allocation mode',
          400,
          'EMPTY_ALLOCATIONS'
        );
      }

      // Check duplicate rentChargeIds
      const seenChargeIds = new Set();
      let manualSum = 0;

      for (const ma of manualAllocations) {
        if (seenChargeIds.has(ma.rentChargeId)) {
          throw new AppError(
            `Duplicate allocation for rent charge ${ma.rentChargeId}`,
            400,
            'DUPLICATE_CHARGE_ALLOCATION'
          );
        }
        seenChargeIds.add(ma.rentChargeId);

        const allocAmount = Number(ma.amount);
        if (isNaN(allocAmount) || allocAmount <= 0) {
          throw new AppError(
            'Allocated amount for each charge must be greater than ₹0',
            400,
            'INVALID_ALLOCATION_AMOUNT'
          );
        }

        const info = chargeBalanceMap.get(ma.rentChargeId);
        if (!info) {
          throw new AppError(
            `Rent charge ${ma.rentChargeId} not found or does not belong to this tenant`,
            400,
            'CHARGE_NOT_ELIGIBLE'
          );
        }

        if (allocAmount > info.remaining + 0.001) {
          throw new AppError(
            `Allocated amount (₹${allocAmount.toFixed(2)}) exceeds charge's remaining balance (₹${info.remaining.toFixed(2)})`,
            400,
            'CHARGE_OVERALLOCATION'
          );
        }

        manualSum += allocAmount;
        plannedAllocations.push({
          rentChargeId: ma.rentChargeId,
          amountAllocated: Number(allocAmount.toFixed(2)),
        });
      }

      manualSum = Number(manualSum.toFixed(2));
      if (Math.abs(manualSum - paymentAmount) > 0.009) {
        throw new AppError(
          `Sum of manual allocations (₹${manualSum.toFixed(2)}) must exactly equal payment amount (₹${paymentAmount.toFixed(2)})`,
          400,
          'ALLOCATION_SUM_MISMATCH'
        );
      }
    }

    // 5. Create Payment record
    const payment = await tx.payment.create({
      data: {
        ownerId,
        tenantId,
        amount: paymentAmount,
        paidAt: new Date(paidAt),
        method: method || 'Cash',
        reference: reference || null,
        notes: notes || null,
      },
    });

    // 6. Create PaymentAllocation records
    for (const alloc of plannedAllocations) {
      await tx.paymentAllocation.create({
        data: {
          ownerId,
          paymentId: payment.id,
          rentChargeId: alloc.rentChargeId,
          amountAllocated: alloc.amountAllocated,
        },
      });
    }

    // 7. Fetch full payment with relations to return
    const createdPayment = await tx.payment.findUnique({
      where: { id: payment.id },
      include: PAYMENT_INCLUDE,
    });

    return serializePayment(createdPayment);
  });
}

/**
 * List payments for the authenticated landlord.
 */
export async function listPayments(ownerId, {
  tenantId,
  status = 'all',
  startDate,
  endDate,
} = {}) {
  const where = { ownerId };

  if (tenantId) {
    where.tenantId = tenantId;
  }

  if (status === 'valid') {
    where.voidedAt = null;
  } else if (status === 'voided') {
    where.voidedAt = { not: null };
  }

  if (startDate || endDate) {
    where.paidAt = {};
    if (startDate) where.paidAt.gte = new Date(startDate);
    if (endDate) where.paidAt.lte = new Date(endDate);
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: [
      { paidAt: 'desc' },
      { createdAt: 'desc' },
    ],
    include: PAYMENT_INCLUDE,
  });

  return payments.map(serializePayment);
}

/**
 * Get payment by ID with tenant and allocation details.
 */
export async function getPaymentById(ownerId, paymentId) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, ownerId },
    include: PAYMENT_INCLUDE,
  });

  if (!payment) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }

  return serializePayment(payment);
}

/**
 * Void a payment with mandatory audit reason.
 * Preserves the payment and allocation records, marking them voided.
 */
export async function voidPayment(ownerId, paymentId, { reason }) {
  if (!reason || reason.trim().length < 3) {
    throw new AppError('A valid void reason (at least 3 characters) is required', 400, 'VOID_REASON_REQUIRED');
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, ownerId },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }

  if (payment.voidedAt) {
    throw new AppError('This payment has already been voided', 400, 'PAYMENT_ALREADY_VOIDED');
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      voidedAt: new Date(),
      voidReason: reason.trim(),
    },
    include: PAYMENT_INCLUDE,
  });

  return serializePayment(updated);
}

/**
 * Get full printable receipt data for a payment.
 */
export async function getPaymentReceipt(ownerId, paymentId) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, ownerId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tenant: { select: { id: true, fullName: true, phone: true, email: true } },
      allocations: {
        include: {
          rentCharge: {
            include: {
              tenancy: {
                include: {
                  room: {
                    include: {
                      property: { select: { id: true, name: true, address: true } },
                    },
                  },
                },
              },
              allocations: {
                include: {
                  payment: { select: { id: true, voidedAt: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }

  // Compute tenant's current total outstanding balance
  const tenantCharges = await prisma.rentCharge.findMany({
    where: {
      ownerId,
      tenancy: { tenantId: payment.tenantId },
    },
    include: {
      allocations: {
        include: {
          payment: { select: { id: true, voidedAt: true } },
        },
      },
    },
  });

  let currentTenantOutstanding = 0;
  for (const tc of tenantCharges) {
    currentTenantOutstanding += computeChargeOutstanding(tc);
  }
  currentTenantOutstanding = Number(currentTenantOutstanding.toFixed(2));

  const receiptNumber = getReceiptNumber(payment);

  const allocationsBreakdown = payment.allocations.map((a) => {
    const charge = a.rentCharge;
    const periodStr = charge?.period
      ? new Date(charge.period).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      : 'N/A';
    const remainingOnCharge = charge ? computeChargeOutstanding(charge) : 0;

    return {
      id: a.id,
      period: periodStr,
      propertyName: charge?.tenancy?.room?.property?.name || 'Property',
      propertyAddress: charge?.tenancy?.room?.property?.address || '',
      roomLabel: charge?.tenancy?.room?.label || 'Room',
      chargeAmountDue: charge ? Number(charge.amountDue) : 0,
      amountAllocated: Number(a.amountAllocated),
      chargeRemainingBalance: remainingOnCharge,
    };
  });

  return {
    receiptNumber,
    paymentId: payment.id,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    amount: Number(payment.amount),
    method: payment.method || 'Cash',
    reference: payment.reference || null,
    notes: payment.notes || null,
    status: payment.voidedAt ? 'VOIDED' : 'VALID',
    voidedAt: payment.voidedAt,
    voidReason: payment.voidReason,
    landlord: {
      name: payment.owner?.name || 'Landlord',
      email: payment.owner?.email || '',
    },
    tenant: {
      id: payment.tenant?.id,
      fullName: payment.tenant?.fullName || 'Tenant',
      phone: payment.tenant?.phone || '—',
      email: payment.tenant?.email || '—',
    },
    allocations: allocationsBreakdown,
    totalAllocated: Number(
      allocationsBreakdown.reduce((sum, a) => sum + a.amountAllocated, 0).toFixed(2)
    ),
    tenantCurrentOutstanding: currentTenantOutstanding,
  };
}
