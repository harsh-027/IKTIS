import prisma from '../config/db.js';

/**
 * Helper to compute outstanding on a charge
 */
function computeChargeOutstanding(charge) {
  const allocated = (charge.allocations || []).reduce((sum, a) => {
    if (!a.payment || a.payment.voidedAt) return sum;
    return sum + Number(a.amountAllocated);
  }, 0);
  return Math.max(0, Number((Number(charge.amountDue) - allocated).toFixed(2)));
}

/**
 * Get comprehensive landlord dashboard summary
 */
export async function getDashboardSummary(ownerId, yearMonth) {
  const now = new Date();

  // If no month provided, default to current UTC month YYYY-MM
  const targetMonth = yearMonth || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const [year, mon] = targetMonth.split('-').map(Number);
  const periodStart = new Date(Date.UTC(year, mon - 1, 1));

  // ─── 1. Portfolio & Occupancy Metrics ───────────────────────────────────────
  const [totalProperties, totalRooms, activeTenancies] = await Promise.all([
    prisma.property.count({
      where: { ownerId, archivedAt: null },
    }),
    prisma.room.count({
      where: {
        archivedAt: null,
        property: { ownerId, archivedAt: null },
      },
    }),
    prisma.tenancy.findMany({
      where: {
        ownerId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        room: {
          archivedAt: null,
          property: { archivedAt: null },
        },
      },
      select: { roomId: true, tenantId: true },
    }),
  ]);

  const occupiedRoomIds = new Set(activeTenancies.map((t) => t.roomId));
  const occupiedRooms = occupiedRoomIds.size;
  const vacantRooms = Math.max(0, totalRooms - occupiedRooms);
  const activeTenants = new Set(activeTenancies.map((t) => t.tenantId)).size;
  const activeTenanciesCount = activeTenancies.length;
  const occupancyRate = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0;

  // ─── 2. Monthly Financial Metrics ──────────────────────────────────────────
  const monthlyCharges = await prisma.rentCharge.findMany({
    where: { ownerId, period: periodStart },
    include: {
      allocations: {
        include: {
          payment: { select: { id: true, voidedAt: true } },
        },
      },
      tenancy: {
        include: {
          tenant: { select: { id: true, fullName: true } },
          room: {
            include: { property: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  let monthlyCharged = 0;
  let monthlyCollected = 0;
  let monthlyOutstanding = 0;
  let monthlyOverdue = 0;

  for (const c of monthlyCharges) {
    const due = Number(c.amountDue);
    const outstanding = computeChargeOutstanding(c);
    const collected = Number((due - outstanding).toFixed(2));

    monthlyCharged += due;
    monthlyCollected += collected;
    monthlyOutstanding += outstanding;

    if (outstanding > 0 && new Date(c.dueDate) < now) {
      monthlyOverdue += outstanding;
    }
  }

  monthlyCharged = Number(monthlyCharged.toFixed(2));
  monthlyCollected = Number(monthlyCollected.toFixed(2));
  monthlyOutstanding = Number(monthlyOutstanding.toFixed(2));
  monthlyOverdue = Number(monthlyOverdue.toFixed(2));
  const collectionRate = monthlyCharged > 0 ? Number(((monthlyCollected / monthlyCharged) * 100).toFixed(1)) : 0;

  // ─── 3. Lifetime Financial Metrics ─────────────────────────────────────────
  const allCharges = await prisma.rentCharge.findMany({
    where: { ownerId },
    include: {
      allocations: {
        include: {
          payment: { select: { id: true, voidedAt: true } },
        },
      },
    },
  });

  let lifetimeCharged = 0;
  let lifetimeOutstanding = 0;
  let lifetimeOverdue = 0;

  for (const c of allCharges) {
    const due = Number(c.amountDue);
    const outstanding = computeChargeOutstanding(c);
    lifetimeCharged += due;
    lifetimeOutstanding += outstanding;
    if (outstanding > 0 && new Date(c.dueDate) < now) {
      lifetimeOverdue += outstanding;
    }
  }

  // Lifetime collected from valid payments
  const validPaymentsSum = await prisma.payment.aggregate({
    where: { ownerId, voidedAt: null },
    _sum: { amount: true },
    _count: { id: true },
  });

  const lifetimeCollected = Number((Number(validPaymentsSum._sum.amount || 0)).toFixed(2));
  lifetimeCharged = Number(lifetimeCharged.toFixed(2));
  lifetimeOutstanding = Number(lifetimeOutstanding.toFixed(2));
  lifetimeOverdue = Number(lifetimeOverdue.toFixed(2));

  // ─── 4. Upcoming Rent Due Dates (Next 5 unpaid charges) ─────────────────────
  const upcomingCharges = await prisma.rentCharge.findMany({
    where: {
      ownerId,
      dueDate: { gte: new Date(now.toISOString().slice(0, 10)) },
    },
    include: {
      tenancy: {
        include: {
          tenant: { select: { id: true, fullName: true, phone: true } },
          room: {
            include: { property: { select: { id: true, name: true } } },
          },
        },
      },
      allocations: {
        include: {
          payment: { select: { id: true, voidedAt: true } },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  const upcomingDueList = [];
  for (const c of upcomingCharges) {
    if (upcomingDueList.length >= 5) break;
    const outstanding = computeChargeOutstanding(c);
    if (outstanding > 0) {
      upcomingDueList.push({
        id: c.id,
        tenancyId: c.tenancyId,
        tenantName: c.tenancy?.tenant?.fullName || 'Tenant',
        tenantPhone: c.tenancy?.tenant?.phone || '',
        propertyName: c.tenancy?.room?.property?.name || 'Property',
        roomLabel: c.tenancy?.room?.label || 'Room',
        dueDate: c.dueDate,
        amountDue: Number(c.amountDue),
        outstanding,
      });
    }
  }

  // ─── 5. Recent Payments (Latest 5 records) ──────────────────────────────────
  const recentPaymentsRaw = await prisma.payment.findMany({
    where: { ownerId },
    take: 5,
    orderBy: [
      { paidAt: 'desc' },
      { createdAt: 'desc' },
    ],
    include: {
      tenant: { select: { id: true, fullName: true } },
    },
  });

  const recentPayments = recentPaymentsRaw.map((p) => {
    const d = new Date(p.paidAt);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const slug = (p.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
    const receiptNumber = `RCP-${y}${m}-${slug}`;

    return {
      id: p.id,
      receiptNumber,
      amount: Number(p.amount),
      paidAt: p.paidAt,
      method: p.method || 'Cash',
      reference: p.reference,
      isVoided: Boolean(p.voidedAt),
      voidReason: p.voidReason,
      tenant: p.tenant ? {
        id: p.tenant.id,
        fullName: p.tenant.fullName,
      } : null,
    };
  });

  return {
    selectedMonth: targetMonth,
    portfolio: {
      totalProperties,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      activeTenants,
      activeTenancies: activeTenanciesCount,
      occupancyRate,
    },
    monthlyFinancials: {
      month: targetMonth,
      rentCharged: monthlyCharged,
      paymentsCollected: monthlyCollected,
      outstandingRent: monthlyOutstanding,
      overdueRent: monthlyOverdue,
      collectionRate,
      chargesCount: monthlyCharges.length,
    },
    lifetimeFinancials: {
      lifetimeCharged,
      lifetimeCollected,
      lifetimeOutstanding,
      totalOverdue: lifetimeOverdue,
      totalPaymentsCount: validPaymentsSum._count.id || 0,
    },
    upcomingDue: upcomingDueList,
    recentPayments,
  };
}
