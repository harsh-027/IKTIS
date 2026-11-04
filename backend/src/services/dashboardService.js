import { Prisma } from '@prisma/client';
import prisma from '../config/db.js';
import { toPeriodDateString, toUtcDateString, toUtcDateTimeString } from '../utils/dashboardDates.js';

function toNumber(value) {
  return Number(value || 0);
}

function computeCollectionRate(collected, charged) {
  return charged > 0 ? Number(((collected / charged) * 100).toFixed(1)) : 0;
}

/**
 * Get comprehensive landlord dashboard summary.
 */
export async function getDashboardSummary(ownerId, yearMonth) {
  const now = new Date();
  const targetMonth = yearMonth || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const periodStart = toPeriodDateString(targetMonth);
  const today = toUtcDateString(now);
  const utcNow = toUtcDateTimeString(now);

  const allocationTotals = Prisma.sql`
    SELECT pa.rentChargeId, SUM(pa.amountAllocated) AS allocated
    FROM payment_allocations pa
    INNER JOIN payments p ON p.id = pa.paymentId
    WHERE p.voidedAt IS NULL
      AND pa.ownerId = ${ownerId}
    GROUP BY pa.rentChargeId
  `;

  const [portfolio, financials, upcomingCharges, recentPaymentsRaw] = await Promise.all([
    Promise.all([
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
    ]),
    Promise.all([
      prisma.$queryRaw(Prisma.sql`
        SELECT
          COALESCE(SUM(rc.amountDue), 0) AS charged,
          COALESCE(SUM(GREATEST(rc.amountDue - COALESCE(at.allocated, 0), 0)), 0) AS outstanding,
          COALESCE(SUM(CASE
            WHEN rc.dueDate < CAST(${utcNow} AS DATETIME(3))
              AND rc.amountDue - COALESCE(at.allocated, 0) > 0
            THEN rc.amountDue - COALESCE(at.allocated, 0)
            ELSE 0
          END), 0) AS overdue,
          COUNT(rc.id) AS chargesCount
        FROM rent_charges rc
        LEFT JOIN (${allocationTotals}) at ON at.rentChargeId = rc.id
        WHERE rc.ownerId = ${ownerId} AND rc.period = CAST(${periodStart} AS DATE)
      `),
      prisma.$queryRaw(Prisma.sql`
        SELECT
          COALESCE(SUM(rc.amountDue), 0) AS charged,
          COALESCE(SUM(GREATEST(rc.amountDue - COALESCE(at.allocated, 0), 0)), 0) AS outstanding,
          COALESCE(SUM(CASE
            WHEN rc.dueDate < CAST(${utcNow} AS DATETIME(3))
              AND rc.amountDue - COALESCE(at.allocated, 0) > 0
            THEN rc.amountDue - COALESCE(at.allocated, 0)
            ELSE 0
          END), 0) AS overdue
        FROM rent_charges rc
        LEFT JOIN (${allocationTotals}) at ON at.rentChargeId = rc.id
        WHERE rc.ownerId = ${ownerId}
      `),
      prisma.payment.aggregate({
        where: { ownerId, voidedAt: null },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]),
    prisma.$queryRaw(Prisma.sql`
      SELECT
        rc.id,
        rc.tenancyId,
        rc.dueDate,
        rc.amountDue,
        t.fullName AS tenantName,
        t.phone AS tenantPhone,
        p.name AS propertyName,
        r.label AS roomLabel,
        (rc.amountDue - COALESCE(at.allocated, 0)) AS outstanding
      FROM rent_charges rc
      INNER JOIN tenancies te ON te.id = rc.tenancyId
      INNER JOIN tenants t ON t.id = te.tenantId
      INNER JOIN rooms r ON r.id = te.roomId
      INNER JOIN properties p ON p.id = r.propertyId
      LEFT JOIN (${allocationTotals}) at ON at.rentChargeId = rc.id
      WHERE rc.ownerId = ${ownerId}
        AND rc.dueDate >= CAST(${today} AS DATE)
        AND rc.amountDue - COALESCE(at.allocated, 0) > 0
      ORDER BY rc.dueDate ASC
      LIMIT 5
    `),
    prisma.payment.findMany({
      where: { ownerId },
      take: 5,
      orderBy: [
        { paidAt: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        amount: true,
        paidAt: true,
        method: true,
        reference: true,
        voidedAt: true,
        voidReason: true,
        tenant: { select: { id: true, fullName: true } },
      },
    }),
  ]);

  const [totalProperties, totalRooms, activeTenancies] = portfolio;
  const occupiedRoomIds = new Set(activeTenancies.map((t) => t.roomId));
  const occupiedRooms = occupiedRoomIds.size;
  const vacantRooms = Math.max(0, totalRooms - occupiedRooms);
  const activeTenants = new Set(activeTenancies.map((t) => t.tenantId)).size;
  const activeTenanciesCount = activeTenancies.length;
  const occupancyRate = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0;

  const [monthlyRows, lifetimeRows, validPaymentsSum] = financials;
  const monthly = monthlyRows[0] || {};
  const lifetime = lifetimeRows[0] || {};
  const monthlyCharged = toNumber(monthly.charged);
  const monthlyOutstanding = toNumber(monthly.outstanding);
  const monthlyCollected = Number((monthlyCharged - monthlyOutstanding).toFixed(2));
  const monthlyOverdue = toNumber(monthly.overdue);
  const lifetimeCharged = toNumber(lifetime.charged);
  const lifetimeOutstanding = toNumber(lifetime.outstanding);
  const lifetimeOverdue = toNumber(lifetime.overdue);
  const lifetimeCollected = Number(toNumber(validPaymentsSum._sum.amount).toFixed(2));

  const upcomingDue = upcomingCharges.map((charge) => ({
    id: charge.id,
    tenancyId: charge.tenancyId,
    tenantName: charge.tenantName || 'Tenant',
    tenantPhone: charge.tenantPhone || '',
    propertyName: charge.propertyName || 'Property',
    roomLabel: charge.roomLabel || 'Room',
    dueDate: charge.dueDate,
    amountDue: toNumber(charge.amountDue),
    outstanding: toNumber(charge.outstanding),
  }));

  const recentPayments = recentPaymentsRaw.map((payment) => {
    const date = new Date(payment.paidAt);
    const yearPart = date.getUTCFullYear();
    const monthPart = String(date.getUTCMonth() + 1).padStart(2, '0');
    const slug = (payment.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();

    return {
      id: payment.id,
      receiptNumber: `RCP-${yearPart}${monthPart}-${slug}`,
      amount: toNumber(payment.amount),
      paidAt: payment.paidAt,
      method: payment.method || 'Cash',
      reference: payment.reference,
      isVoided: Boolean(payment.voidedAt),
      voidReason: payment.voidReason,
      tenant: payment.tenant ? {
        id: payment.tenant.id,
        fullName: payment.tenant.fullName,
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
      collectionRate: computeCollectionRate(monthlyCollected, monthlyCharged),
      chargesCount: Number(monthly.chargesCount || 0),
    },
    lifetimeFinancials: {
      lifetimeCharged,
      lifetimeCollected,
      lifetimeOutstanding,
      totalOverdue: lifetimeOverdue,
      totalPaymentsCount: validPaymentsSum._count.id || 0,
    },
    upcomingDue,
    recentPayments,
  };
}
