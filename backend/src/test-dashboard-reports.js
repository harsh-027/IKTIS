import http from 'http';
import app from './server.js';
import prisma from './config/db.js';

const PORT = 5097;
let server;

function makeRequest({ method = 'GET', path, headers = {}, body = null, cookies = [] }) {
  return new Promise((resolve, reject) => {
    const cookieHeader = cookies.length ? cookies.join('; ') : '';
    const reqHeaders = {
      ...headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    };

    const req = http.request(
      `http://localhost:${PORT}${path}`,
      { method, headers: reqHeaders },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(rawData); } catch { json = rawData; }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            cookies: res.headers['set-cookie'] || [],
            body: json,
          });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function parseCookie(c) {
  return c.split(';')[0];
}

async function runTests() {
  console.log('--- Starting IKTIS Phase 7 Dashboard & Reports Test Suite ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, debugInfo) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`, debugInfo ? JSON.stringify(debugInfo, null, 2) : '');
      failed++;
    }
  }

  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  let userAId = null, userBId = null;

  try {
    // ─── 1. Unauthenticated Guards ──────────────────────────────────────────
    const unauthDash = await makeRequest({ method: 'GET', path: '/api/dashboard/summary' });
    assert(unauthDash.status === 401, 'Unauthenticated GET /api/dashboard/summary → 401');

    const unauthTrends = await makeRequest({ method: 'GET', path: '/api/reports/monthly-trends' });
    assert(unauthTrends.status === 401, 'Unauthenticated GET /api/reports/monthly-trends → 401');

    const unauthBalances = await makeRequest({ method: 'GET', path: '/api/reports/tenant-balances' });
    assert(unauthBalances.status === 401, 'Unauthenticated GET /api/reports/tenant-balances → 401');

    const unauthPerf = await makeRequest({ method: 'GET', path: '/api/reports/property-performance' });
    assert(unauthPerf.status === 401, 'Unauthenticated GET /api/reports/property-performance → 401');

    const unauthLedger = await makeRequest({ method: 'GET', path: '/api/reports/payments-ledger' });
    assert(unauthLedger.status === 401, 'Unauthenticated GET /api/reports/payments-ledger → 401');

    // ─── 2. Setup Landlord A ────────────────────────────────────────────────
    const csrfRes = await makeRequest({ method: 'GET', path: '/api/auth/csrf' });
    const csrfCookie = parseCookie(csrfRes.cookies.find((c) => c.startsWith('iktis_csrf=')));
    const csrfToken = csrfRes.body.data.csrfToken;
    const csrfHeaders = { 'X-CSRF-Token': csrfToken };

    const ts = Date.now();
    const regResA = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: csrfHeaders,
      cookies: [csrfCookie],
      body: {
        name: 'Landlord Dashboard Tester A',
        email: `dashboard_a_${ts}@test.com`,
        password: 'Password123!',
      },
    });
    assert(regResA.status === 201, 'Register Landlord A → 201');
    userAId = regResA.body.data.user.id;
    const sessA = parseCookie(regResA.cookies.find((c) => c.startsWith('iktis_session=')));
    const cookiesA = [csrfCookie, sessA];

    // ─── 3. Create Properties & Rooms for Landlord A ────────────────────────
    // Property 1: 2 rooms (Room 101, Room 102)
    const p1Res = await makeRequest({
      method: 'POST',
      path: '/api/properties',
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { name: 'Palm Residency', address: '10 Palm Beach Rd' },
    });
    assert(p1Res.status === 201, 'Create Property 1 → 201');
    const p1Id = p1Res.body.data.property.id;

    const r101Res = await makeRequest({
      method: 'POST',
      path: `/api/properties/${p1Id}/rooms`,
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { label: 'Room 101', description: 'Studio A', isAvailable: true },
    });
    assert(r101Res.status === 201, 'Create Room 101 → 201');
    const r101Id = r101Res.body.data.room.id;

    const r102Res = await makeRequest({
      method: 'POST',
      path: `/api/properties/${p1Id}/rooms`,
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { label: 'Room 102', description: 'Studio B', isAvailable: true },
    });
    assert(r102Res.status === 201, 'Create Room 102 → 201');

    // Property 2: 1 room (Room 201)
    const p2Res = await makeRequest({
      method: 'POST',
      path: '/api/properties',
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { name: 'Ocean Vista', address: '22 Marine Drive' },
    });
    assert(p2Res.status === 201, 'Create Property 2 → 201');
    const p2Id = p2Res.body.data.property.id;

    const r201Res = await makeRequest({
      method: 'POST',
      path: `/api/properties/${p2Id}/rooms`,
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { label: 'Room 201', description: 'Sea View', isAvailable: true },
    });
    assert(r201Res.status === 201, 'Create Room 201 → 201');

    // ─── 4. Create Tenant & Tenancy ─────────────────────────────────────────
    const tenantRes = await makeRequest({
      method: 'POST',
      path: '/api/tenants',
      headers: csrfHeaders,
      cookies: cookiesA,
      body: {
        fullName: 'Vikram Seth',
        phone: '+91 99887 76655',
        email: 'vikram.seth@test.com',
      },
    });
    assert(tenantRes.status === 201, 'Create Tenant Vikram Seth → 201');
    const tenantId = tenantRes.body.data.tenant.id;

    // Active Tenancy on Room 101: 2026-09-01 ongoing, monthlyRent = ₹10,000
    const tenancyRes = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: csrfHeaders,
      cookies: cookiesA,
      body: {
        tenantId,
        roomId: r101Id,
        startDate: '2026-09-01',
        monthlyRent: 10000,
        rentDueDay: 5,
      },
    });
    assert(tenancyRes.status === 201, 'Create Tenancy on Room 101 (₹10,000/mo) → 201');
    const tenancyId = tenancyRes.body.data.tenancy.id;

    // ─── 5. Financial Charges & Payments Setup ──────────────────────────────
    // Charge 1: September 2026 (₹10,000), due 2026-09-05
    const c1Res = await makeRequest({
      method: 'POST',
      path: '/api/rent-charges',
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { tenancyId, period: '2026-09-01', amountDue: 10000, dueDate: '2026-09-05' },
    });
    assert(c1Res.status === 201, 'Create Sep Charge (₹10,000) → 201');

    // Fully pay Sep charge with Payment 1 (₹10,000)
    const pay1Res = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { tenantId, amount: 10000, paidAt: '2026-09-05', method: 'Bank Transfer' },
    });
    assert(pay1Res.status === 201, 'Payment 1 (₹10,000 fully paid) → 201');

    // Charge 2: October 2026 (₹10,000), due 2026-10-05 (in past, overdue)
    const c2Res = await makeRequest({
      method: 'POST',
      path: '/api/rent-charges',
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { tenancyId, period: '2026-10-01', amountDue: 10000, dueDate: '2026-10-05' },
    });
    assert(c2Res.status === 201, 'Create Oct Charge (₹10,000) → 201');

    // Partial pay Oct charge with Payment 2 (₹4,000)
    const pay2Res = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { tenantId, amount: 4000, paidAt: '2026-10-06', method: 'UPI', reference: 'UPI-112233' },
    });
    assert(pay2Res.status === 201, 'Payment 2 (₹4,000 partial) → 201');

    // Payment 3: ₹2,000 recorded on 2026-10-10, then VOIDED
    const pay3Res = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { tenantId, amount: 2000, paidAt: '2026-10-10', method: 'Cheque', reference: 'CHQ-999' },
    });
    assert(pay3Res.status === 201, 'Payment 3 (₹2,000) → 201');
    const pay3Id = pay3Res.body.data.payment.id;

    const voidRes = await makeRequest({
      method: 'POST',
      path: `/api/payments/${pay3Id}/void`,
      headers: csrfHeaders,
      cookies: cookiesA,
      body: { reason: 'Cheque bounced at bank' },
    });
    assert(voidRes.status === 200, 'Void Payment 3 → 200');

    // ─── 6. Dashboard Summary Verification for October 2026 ─────────────────
    const dashRes = await makeRequest({
      method: 'GET',
      path: '/api/dashboard/summary?month=2026-10',
      cookies: cookiesA,
    });
    assert(dashRes.status === 200, 'GET /api/dashboard/summary?month=2026-10 → 200');
    const dash = dashRes.body.data;

    // Portfolio metrics
    assert(dash.portfolio.totalProperties === 2, 'Portfolio: 2 total properties', dash.portfolio);
    assert(dash.portfolio.totalRooms === 3, 'Portfolio: 3 total rooms', dash.portfolio);
    assert(dash.portfolio.occupiedRooms === 1, 'Portfolio: 1 occupied room', dash.portfolio);
    assert(dash.portfolio.vacantRooms === 2, 'Portfolio: 2 vacant rooms', dash.portfolio);
    assert(dash.portfolio.activeTenants === 1, 'Portfolio: 1 active tenant', dash.portfolio);
    assert(dash.portfolio.activeTenancies === 1, 'Portfolio: 1 active tenancy', dash.portfolio);
    assert(dash.portfolio.occupancyRate === 33.3, 'Portfolio: 33.3% occupancy rate', dash.portfolio);

    // Monthly Financials (2026-10)
    assert(dash.monthlyFinancials.rentCharged === 10000, 'Monthly rent charged: ₹10,000', dash.monthlyFinancials);
    assert(dash.monthlyFinancials.paymentsCollected === 4000, 'Monthly collected: ₹4,000 (excludes voided ₹2,000)', dash.monthlyFinancials);
    assert(dash.monthlyFinancials.outstandingRent === 6000, 'Monthly outstanding: ₹6,000', dash.monthlyFinancials);
    assert(dash.monthlyFinancials.overdueRent === 6000, 'Monthly overdue: ₹6,000 (dueDate 2026-10-05 is past)', dash.monthlyFinancials);
    assert(dash.monthlyFinancials.collectionRate === 40.0, 'Monthly collection rate: 40.0%', dash.monthlyFinancials);

    // Lifetime Financials (Separated from monthly)
    assert(dash.lifetimeFinancials.lifetimeCharged === 20000, 'Lifetime charged: ₹20,000 (Sep 10k + Oct 10k)', dash.lifetimeFinancials);
    assert(dash.lifetimeFinancials.lifetimeCollected === 14000, 'Lifetime collected: ₹14,000 (Sep 10k + Oct 4k, excludes voided)', dash.lifetimeFinancials);
    assert(dash.lifetimeFinancials.lifetimeOutstanding === 6000, 'Lifetime outstanding: ₹6,000', dash.lifetimeFinancials);
    assert(dash.lifetimeFinancials.totalOverdue === 6000, 'Lifetime total overdue: ₹6,000', dash.lifetimeFinancials);
    assert(dash.lifetimeFinancials.totalPaymentsCount === 2, 'Lifetime valid payments count: 2 (excludes voided)', dash.lifetimeFinancials);

    // Recent Payments
    assert(dash.recentPayments.length === 3, 'Recent payments: 3 records returned');
    const voidedRecent = dash.recentPayments.find((p) => p.id === pay3Id);
    assert(voidedRecent.isVoided === true, 'Voided payment marked in recent payments');
    assert(voidedRecent.voidReason === 'Cheque bounced at bank', 'Void reason preserved in recent payments');

    // ─── 7. Report 1: Monthly Financial Trends ──────────────────────────────
    const trendsRes = await makeRequest({
      method: 'GET',
      path: '/api/reports/monthly-trends?months=6',
      cookies: cookiesA,
    });
    assert(trendsRes.status === 200, 'GET /api/reports/monthly-trends → 200');
    const trends = trendsRes.body.data.trends;
    assert(Array.isArray(trends) && trends.length === 6, 'Trends returned 6 months');

    const sepTrend = trends.find((t) => t.month === '2026-09');
    const octTrend = trends.find((t) => t.month === '2026-10');
    assert(sepTrend?.rentCharged === 10000, 'Sep trend charged: ₹10,000');
    assert(sepTrend?.paymentsCollected === 10000, 'Sep trend collected: ₹10,000');
    assert(sepTrend?.outstandingRent === 0, 'Sep trend outstanding: ₹0');
    assert(sepTrend?.collectionRate === 100, 'Sep trend collection rate: 100%');

    assert(octTrend?.rentCharged === 10000, 'Oct trend charged: ₹10,000');
    assert(octTrend?.paymentsCollected === 4000, 'Oct trend collected: ₹4,000');
    assert(octTrend?.outstandingRent === 6000, 'Oct trend outstanding: ₹6,000');
    assert(octTrend?.overdueRent === 6000, 'Oct trend overdue: ₹6,000');
    assert(octTrend?.collectionRate === 40, 'Oct trend collection rate: 40%');

    // ─── 8. Report 2: Tenant Balances ───────────────────────────────────────
    const balancesRes = await makeRequest({
      method: 'GET',
      path: '/api/reports/tenant-balances',
      cookies: cookiesA,
    });
    assert(balancesRes.status === 200, 'GET /api/reports/tenant-balances → 200');
    const balances = balancesRes.body.data.balances;
    assert(balances.length === 1, '1 tenant in balance report');

    const tb = balances[0];
    assert(tb.fullName === 'Vikram Seth', 'Tenant name Vikram Seth');
    assert(tb.currentRoom === 'Room 101', 'Current room Room 101');
    assert(tb.currentProperty === 'Palm Residency', 'Current property Palm Residency');
    assert(tb.totalCharged === 20000, 'Tenant total charged: ₹20,000');
    assert(tb.totalPaid === 14000, 'Tenant total paid: ₹14,000');
    assert(tb.totalOutstanding === 6000, 'Tenant total outstanding: ₹6,000');
    assert(tb.overdueBalance === 6000, 'Tenant overdue balance: ₹6,000');
    assert(tb.status === 'Overdue', 'Tenant status is Overdue');
    assert(tb.lastPaymentAmount === 4000, 'Last non-voided payment amount is ₹4,000');

    // ─── 9. Report 3: Property Performance ──────────────────────────────────
    const perfRes = await makeRequest({
      method: 'GET',
      path: '/api/reports/property-performance?month=2026-10',
      cookies: cookiesA,
    });
    assert(perfRes.status === 200, 'GET /api/reports/property-performance → 200');
    const perf = perfRes.body.data;
    assert(perf.properties.length === 2, '2 properties in performance report');

    const prop1 = perf.properties.find((p) => p.name === 'Palm Residency');
    const prop2 = perf.properties.find((p) => p.name === 'Ocean Vista');

    assert(prop1.totalRooms === 2, 'Property 1 total rooms: 2');
    assert(prop1.occupiedRooms === 1, 'Property 1 occupied: 1');
    assert(prop1.vacantRooms === 1, 'Property 1 vacant: 1');
    assert(prop1.occupancyRate === 50, 'Property 1 occupancy: 50%');
    assert(prop1.monthlyRentRoll === 10000, 'Property 1 rent roll: ₹10,000');
    assert(prop1.monthlyCharged === 10000, 'Property 1 charged: ₹10,000');
    assert(prop1.monthlyCollected === 4000, 'Property 1 collected: ₹4,000');
    assert(prop1.monthlyOutstanding === 6000, 'Property 1 outstanding: ₹6,000');

    assert(prop2.totalRooms === 1, 'Property 2 total rooms: 1');
    assert(prop2.occupiedRooms === 0, 'Property 2 occupied: 0');
    assert(prop2.vacantRooms === 1, 'Property 2 vacant: 1');
    assert(prop2.occupancyRate === 0, 'Property 2 occupancy: 0%');
    assert(prop2.monthlyRentRoll === 0, 'Property 2 rent roll: ₹0');
    assert(prop2.monthlyCharged === 0, 'Property 2 charged: ₹0');

    // ─── 10. Report 4: Payments Ledger & Filtering ──────────────────────────
    const ledgerAll = await makeRequest({
      method: 'GET',
      path: '/api/reports/payments-ledger',
      cookies: cookiesA,
    });
    assert(ledgerAll.status === 200, 'GET /api/reports/payments-ledger → 200');
    assert(ledgerAll.body.data.summary.count === 3, 'Ledger total count: 3');
    assert(ledgerAll.body.data.summary.totalCollected === 14000, 'Ledger collected: ₹14,000 (valid only)');
    assert(ledgerAll.body.data.summary.totalVoided === 2000, 'Ledger voided: ₹2,000');

    // Filter status=valid
    const ledgerValid = await makeRequest({
      method: 'GET',
      path: '/api/reports/payments-ledger?status=valid',
      cookies: cookiesA,
    });
    assert(ledgerValid.body.data.payments.length === 2, 'Ledger filter status=valid: 2 payments');

    // Filter status=voided
    const ledgerVoided = await makeRequest({
      method: 'GET',
      path: '/api/reports/payments-ledger?status=voided',
      cookies: cookiesA,
    });
    assert(ledgerVoided.body.data.payments.length === 1, 'Ledger filter status=voided: 1 payment');

    // Filter method=UPI
    const ledgerUpi = await makeRequest({
      method: 'GET',
      path: '/api/reports/payments-ledger?method=UPI',
      cookies: cookiesA,
    });
    assert(ledgerUpi.body.data.payments.length === 1, 'Ledger filter method=UPI: 1 payment');
    assert(ledgerUpi.body.data.payments[0].reference === 'UPI-112233', 'UPI reference verified');

    // ─── 11. Empty Dataset & Isolation Check (Landlord B) ───────────────────
    const regResB = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: csrfHeaders,
      cookies: [csrfCookie],
      body: {
        name: 'Landlord Dashboard Tester B',
        email: `dashboard_b_${ts}@test.com`,
        password: 'Password123!',
      },
    });
    assert(regResB.status === 201, 'Register Landlord B → 201');
    userBId = regResB.body.data.user.id;
    const sessB = parseCookie(regResB.cookies.find((c) => c.startsWith('iktis_session=')));
    const cookiesB = [csrfCookie, sessB];

    // Landlord B Dashboard: all 0s, empty arrays, no leak
    const dashB = await makeRequest({
      method: 'GET',
      path: '/api/dashboard/summary',
      cookies: cookiesB,
    });
    assert(dashB.status === 200, 'Landlord B dashboard → 200');
    assert(dashB.body.data.portfolio.totalProperties === 0, 'Landlord B: 0 properties (isolation)');
    assert(dashB.body.data.portfolio.totalRooms === 0, 'Landlord B: 0 rooms');
    assert(dashB.body.data.portfolio.occupiedRooms === 0, 'Landlord B: 0 occupied');
    assert(dashB.body.data.portfolio.occupancyRate === 0, 'Landlord B: 0% occupancy');
    assert(dashB.body.data.monthlyFinancials.rentCharged === 0, 'Landlord B: ₹0 rent charged');
    assert(dashB.body.data.monthlyFinancials.paymentsCollected === 0, 'Landlord B: ₹0 collected');
    assert(dashB.body.data.lifetimeFinancials.lifetimeCharged === 0, 'Landlord B: ₹0 lifetime charged');
    assert(dashB.body.data.recentPayments.length === 0, 'Landlord B: 0 recent payments');
    assert(dashB.body.data.upcomingDue.length === 0, 'Landlord B: 0 upcoming due');

    // Landlord B Reports: empty arrays
    const tbB = await makeRequest({ method: 'GET', path: '/api/reports/tenant-balances', cookies: cookiesB });
    assert(tbB.body.data.balances.length === 0, 'Landlord B: 0 tenant balances');

    const ppB = await makeRequest({ method: 'GET', path: '/api/reports/property-performance', cookies: cookiesB });
    assert(ppB.body.data.properties.length === 0, 'Landlord B: 0 property reports');

    // ─── 12. Input Validation ───────────────────────────────────────────────
    const invalidMonth = await makeRequest({
      method: 'GET',
      path: '/api/dashboard/summary?month=2026-99',
      cookies: cookiesA,
    });
    assert(invalidMonth.status === 400, 'Reject invalid month format (2026-99) → 400');

    const invalidMonths = await makeRequest({
      method: 'GET',
      path: '/api/reports/monthly-trends?months=999',
      cookies: cookiesA,
    });
    assert(invalidMonths.status === 400, 'Reject invalid months count (999) → 400');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    // ─── 13. Cleanup ────────────────────────────────────────────────────────
    console.log('\n--- Cleaning up test records ---');
    try {
      const userIds = [userAId, userBId].filter(Boolean);
      if (userIds.length > 0) {
        await prisma.paymentAllocation.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.payment.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.rentCharge.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.tenancy.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.room.deleteMany({ where: { property: { ownerId: { in: userIds } } } });
        await prisma.property.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.tenant.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } catch (cleanupErr) {
      console.warn('Cleanup error (ignored):', cleanupErr.message);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    console.log(`\nTest results: ${passed} passed, ${failed} failed.\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
