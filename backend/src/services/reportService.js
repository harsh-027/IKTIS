import prisma from '../config/db.js';

function computeChargeOutstanding(charge) {
  const allocated = (charge.allocations || []).reduce((sum, a) => {
    if (!a.payment || a.payment.voidedAt) return sum;
    return sum + Number(a.amountAllocated);
  }, 0);
  return Math.max(0, Number((Number(charge.amountDue) - allocated).toFixed(2)));
}

/**
 * Report 1: Monthly Financial Trends (last N months)
 */
export async function getMonthlyTrends(ownerId, { months = 6 } = {}) {
  const now = new Date();
  const numMonths = Math.min(Math.max(Number(months) || 6, 1), 36);

  // Generate list of months in chronological order
  const monthList = [];
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    monthList.push({ periodStart: d, month: ym });
  }

  // Fetch all charges for owner within the entire period range
  const earliestPeriod = monthList[0].periodStart;
  const latestPeriod = monthList[monthList.length - 1].periodStart;

  const charges = await prisma.rentCharge.findMany({
    where: {
      ownerId,
      period: {
        gte: earliestPeriod,
        lte: latestPeriod,
      },
    },
    include: {
      allocations: {
        include: {
          payment: { select: { id: true, voidedAt: true } },
        },
      },
    },
    orderBy: { period: 'asc' },
  });

  // Group by month
  const monthlyMap = new Map();
  for (const m of monthList) {
    monthlyMap.set(m.month, {
      month: m.month,
      rentCharged: 0,
      paymentsCollected: 0,
      outstandingRent: 0,
      overdueRent: 0,
      chargesCount: 0,
    });
  }

  for (const c of charges) {
    const ym = new Date(c.period).toISOString().slice(0, 7);
    const entry = monthlyMap.get(ym);
    if (!entry) continue;

    const due = Number(c.amountDue);
    const outstanding = computeChargeOutstanding(c);
    const collected = Number((due - outstanding).toFixed(2));

    entry.rentCharged += due;
    entry.paymentsCollected += collected;
    entry.outstandingRent += outstanding;
    entry.chargesCount += 1;

    if (outstanding > 0 && new Date(c.dueDate) < now) {
      entry.overdueRent += outstanding;
    }
  }

  // Finalize decimals and compute collection rates
  const trends = [];
  for (const [, val] of monthlyMap) {
    const rentCharged = Number(val.rentCharged.toFixed(2));
    const paymentsCollected = Number(val.paymentsCollected.toFixed(2));
    const outstandingRent = Number(val.outstandingRent.toFixed(2));
    const overdueRent = Number(val.overdueRent.toFixed(2));
    const collectionRate = rentCharged > 0 ? Number(((paymentsCollected / rentCharged) * 100).toFixed(1)) : 0;

    trends.push({
      month: val.month,
      rentCharged,
      paymentsCollected,
      outstandingRent,
      overdueRent,
      chargesCount: val.chargesCount,
      collectionRate,
    });
  }

  return trends;
}

/**
 * Report 2: Tenant Balances
 * Grouped balances, payment history, and collection status per tenant
 */
export async function getTenantBalances(ownerId) {
  const now = new Date();

  // Fetch all tenants with tenancies and charges
  const tenants = await prisma.tenant.findMany({
    where: { ownerId, archivedAt: null },
    include: {
      tenancies: {
        orderBy: { startDate: 'desc' },
        include: {
          room: {
            include: {
              property: { select: { id: true, name: true } },
            },
          },
        },
      },
      payments: {
        where: { voidedAt: null },
        orderBy: { paidAt: 'desc' },
        take: 1,
        select: { amount: true, paidAt: true },
      },
    },
    orderBy: { fullName: 'asc' },
  });

  // Fetch all charges for owner
  const charges = await prisma.rentCharge.findMany({
    where: { ownerId },
    include: {
      tenancy: { select: { tenantId: true } },
      allocations: {
        include: {
          payment: { select: { id: true, voidedAt: true } },
        },
      },
    },
  });

  // Aggregate charges per tenantId
  const tenantChargeMap = new Map();
  for (const c of charges) {
    const tId = c.tenancy?.tenantId;
    if (!tId) continue;

    if (!tenantChargeMap.has(tId)) {
      tenantChargeMap.set(tId, { totalCharged: 0, totalPaid: 0, totalOutstanding: 0, overdueBalance: 0 });
    }

    const tInfo = tenantChargeMap.get(tId);
    const due = Number(c.amountDue);
    const outstanding = computeChargeOutstanding(c);
    const paid = Number((due - outstanding).toFixed(2));

    tInfo.totalCharged += due;
    tInfo.totalPaid += paid;
    tInfo.totalOutstanding += outstanding;

    if (outstanding > 0 && new Date(c.dueDate) < now) {
      tInfo.overdueBalance += outstanding;
    }
  }

  const reports = tenants.map((t) => {
    const activeTenancy = t.tenancies.find((ten) => {
      const hasStarted = new Date(ten.startDate) <= now;
      const isOngoing = !ten.endDate || new Date(ten.endDate) >= now;
      return hasStarted && isOngoing;
    }) || null;

    const cInfo = tenantChargeMap.get(t.id) || { totalCharged: 0, totalPaid: 0, totalOutstanding: 0, overdueBalance: 0 };
    const totalCharged = Number(cInfo.totalCharged.toFixed(2));
    const totalPaid = Number(cInfo.totalPaid.toFixed(2));
    const totalOutstanding = Number(cInfo.totalOutstanding.toFixed(2));
    const overdueBalance = Number(cInfo.overdueBalance.toFixed(2));

    let status = 'Current';
    if (overdueBalance > 0) status = 'Overdue';
    else if (totalOutstanding > 0) status = 'Pending';

    const lastPayment = t.payments?.[0] || null;

    return {
      tenantId: t.id,
      fullName: t.fullName,
      phone: t.phone,
      email: t.email,
      currentRoom: activeTenancy?.room?.label || null,
      currentProperty: activeTenancy?.room?.property?.name || null,
      monthlyRent: activeTenancy ? Number(activeTenancy.monthlyRent) : 0,
      totalCharged,
      totalPaid,
      totalOutstanding,
      overdueBalance,
      status,
      lastPaymentDate: lastPayment ? lastPayment.paidAt : null,
      lastPaymentAmount: lastPayment ? Number(lastPayment.amount) : null,
    };
  });

  // Sort by totalOutstanding DESC, then overdueBalance DESC
  reports.sort((a, b) => b.totalOutstanding - a.totalOutstanding || b.overdueBalance - a.overdueBalance);

  return reports;
}

/**
 * Report 3: Property Performance & Occupancy Summary
 */
export async function getPropertyPerformance(ownerId, yearMonth) {
  const now = new Date();
  const targetMonth = yearMonth || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const [year, mon] = targetMonth.split('-').map(Number);
  const periodStart = new Date(Date.UTC(year, mon - 1, 1));

  const properties = await prisma.property.findMany({
    where: { ownerId, archivedAt: null },
    include: {
      rooms: {
        where: { archivedAt: null },
        include: {
          tenancies: {
            where: {
              startDate: { lte: now },
              OR: [{ endDate: null }, { endDate: { gte: now } }],
            },
            take: 1,
            select: { id: true, monthlyRent: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Fetch charges for this month grouped by property
  const monthCharges = await prisma.rentCharge.findMany({
    where: {
      ownerId,
      period: periodStart,
    },
    include: {
      tenancy: {
        include: {
          room: { select: { propertyId: true } },
        },
      },
      allocations: {
        include: {
          payment: { select: { id: true, voidedAt: true } },
        },
      },
    },
  });

  const propertyFinancialMap = new Map();
  for (const c of monthCharges) {
    const propId = c.tenancy?.room?.propertyId;
    if (!propId) continue;

    if (!propertyFinancialMap.has(propId)) {
      propertyFinancialMap.set(propId, { charged: 0, collected: 0, outstanding: 0 });
    }

    const fin = propertyFinancialMap.get(propId);
    const due = Number(c.amountDue);
    const outstanding = computeChargeOutstanding(c);
    fin.charged += due;
    fin.collected += Number((due - outstanding).toFixed(2));
    fin.outstanding += outstanding;
  }

  const reports = properties.map((prop) => {
    const totalRooms = prop.rooms.length;
    let occupiedRooms = 0;
    let monthlyRentRoll = 0;

    for (const r of prop.rooms) {
      if (r.tenancies.length > 0) {
        occupiedRooms++;
        monthlyRentRoll += Number(r.tenancies[0].monthlyRent);
      }
    }

    const vacantRooms = Math.max(0, totalRooms - occupiedRooms);
    const occupancyRate = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0;

    const fin = propertyFinancialMap.get(prop.id) || { charged: 0, collected: 0, outstanding: 0 };

    return {
      propertyId: prop.id,
      name: prop.name,
      address: prop.address,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
      monthlyRentRoll: Number(monthlyRentRoll.toFixed(2)),
      monthlyCharged: Number(fin.charged.toFixed(2)),
      monthlyCollected: Number(fin.collected.toFixed(2)),
      monthlyOutstanding: Number(fin.outstanding.toFixed(2)),
    };
  });

  return {
    month: targetMonth,
    properties: reports,
  };
}

/**
 * Report 4: Payments Ledger
 * Filterable payment transaction log with receipt details
 */
export async function getPaymentsLedger(ownerId, {
  startDate,
  endDate,
  method,
  status = 'all',
  tenantId,
} = {}) {
  const where = { ownerId };

  if (tenantId) where.tenantId = tenantId;
  if (method && method.trim() !== '' && method.toLowerCase() !== 'all') {
    where.method = method;
  }

  if (status === 'valid') where.voidedAt = null;
  else if (status === 'voided') where.voidedAt = { not: null };

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
    include: {
      tenant: { select: { id: true, fullName: true, phone: true } },
      allocations: {
        include: {
          rentCharge: {
            include: {
              tenancy: {
                include: {
                  room: {
                    include: { property: { select: { id: true, name: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  let totalCollected = 0;
  let totalVoided = 0;

  const entries = payments.map((p) => {
    const isVoided = Boolean(p.voidedAt);
    const amount = Number(p.amount);

    if (isVoided) {
      totalVoided += amount;
    } else {
      totalCollected += amount;
    }

    const d = new Date(p.paidAt);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const slug = (p.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
    const receiptNumber = `RCP-${y}${m}-${slug}`;

    const allocations = p.allocations.map((a) => {
      const charge = a.rentCharge;
      const periodStr = charge?.period ? new Date(charge.period).toISOString().slice(0, 7) : null;
      return {
        id: a.id,
        amountAllocated: Number(a.amountAllocated),
        period: periodStr,
        propertyName: charge?.tenancy?.room?.property?.name || 'Property',
        roomLabel: charge?.tenancy?.room?.label || 'Room',
      };
    });

    return {
      id: p.id,
      receiptNumber,
      amount,
      paidAt: p.paidAt,
      method: p.method || 'Cash',
      reference: p.reference || null,
      notes: p.notes || null,
      isVoided,
      voidedAt: p.voidedAt,
      voidReason: p.voidReason || null,
      tenant: p.tenant ? {
        id: p.tenant.id,
        fullName: p.tenant.fullName,
        phone: p.tenant.phone,
      } : null,
      allocations,
    };
  });

  return {
    summary: {
      totalCollected: Number(totalCollected.toFixed(2)),
      totalVoided: Number(totalVoided.toFixed(2)),
      count: entries.length,
    },
    payments: entries,
  };
}
