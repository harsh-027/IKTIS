import http from 'http';
import app from './server.js';
import prisma from './config/db.js';

const PORT = 5099;
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
          resolve({ status: res.statusCode, headers: res.headers, cookies: res.headers['set-cookie'] || [], body: json });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function parseCookie(c) { return c.split(';')[0]; }

async function runTests() {
  console.log('--- Starting IKTIS Phase 5 Rent Charges Test Suite ---\n');
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

  await new Promise((resolve) => { server = app.listen(PORT, resolve); });

  let userAId = null, userBId = null;

  try {
    // ─── Unauthenticated guard ───────────────────────────────────────────────
    const unauthList = await makeRequest({ method: 'GET', path: '/api/rent-charges' });
    assert(unauthList.status === 401, 'Unauthenticated GET /api/rent-charges → 401');

    const unauthGen = await makeRequest({ method: 'POST', path: '/api/rent-charges/generate', body: { month: '2026-11' } });
    assert(unauthGen.status === 403 || unauthGen.status === 401, 'Unauthenticated POST /api/rent-charges/generate → 401 or 403 (CSRF/auth guard)');

    // ─── Setup ───────────────────────────────────────────────────────────────
    const csrfRes = await makeRequest({ method: 'GET', path: '/api/auth/csrf' });
    const csrfCookie = parseCookie(csrfRes.cookies.find((c) => c.startsWith('iktis_csrf=')));
    const csrfToken = csrfRes.body.data.csrfToken;

    const regA = await makeRequest({
      method: 'POST', path: '/api/auth/register',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: [csrfCookie],
      body: { name: 'Landlord RC A', email: `rc.a.${Date.now()}@example.com`, password: 'Password123!', termsAccepted: true, privacyPolicyAccepted: true },
    });
    assert(regA.status === 201, 'Landlord A registered');
    userAId = regA.body.data.user.id;
    const sessA = parseCookie(regA.cookies.find((c) => c.startsWith('iktis_session=')));
    const authA = [csrfCookie, sessA];

    const regB = await makeRequest({
      method: 'POST', path: '/api/auth/register',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: [csrfCookie],
      body: { name: 'Landlord RC B', email: `rc.b.${Date.now()}@example.com`, password: 'Password123!', termsAccepted: true, privacyPolicyAccepted: true },
    });
    assert(regB.status === 201, 'Landlord B registered');
    userBId = regB.body.data.user.id;
    const sessB = parseCookie(regB.cookies.find((c) => c.startsWith('iktis_session=')));
    const authB = [csrfCookie, sessB];

    // Create Property → Room for A
    const propRes = await makeRequest({
      method: 'POST', path: '/api/properties',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { name: 'RC Test Building', address: '1 Test Street' },
    });
    assert(propRes.status === 201, 'Property created');
    const propId = propRes.body.data.property.id;

    const roomRes = await makeRequest({
      method: 'POST', path: `/api/properties/${propId}/rooms`,
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { label: 'RC-101', isAvailable: true },
    });
    assert(roomRes.status === 201, 'Room created');
    const roomId = roomRes.body.data.room.id;

    const room2Res = await makeRequest({
      method: 'POST', path: `/api/properties/${propId}/rooms`,
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { label: 'RC-102', isAvailable: true },
    });
    assert(room2Res.status === 201, 'Room 2 created');
    const room2Id = room2Res.body.data.room.id;

    // Create Tenant 1 → Tenancy on Room 1 (ongoing, started 2026-01-01)
    const t1Res = await makeRequest({
      method: 'POST', path: '/api/tenants',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { fullName: 'RC Tenant One' },
    });
    assert(t1Res.status === 201, 'Tenant 1 created');
    const tenant1Id = t1Res.body.data.tenant.id;

    const tnc1Res = await makeRequest({
      method: 'POST', path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { tenantId: tenant1Id, roomId, startDate: '2026-01-01', monthlyRent: 15000, rentDueDay: 5 },
    });
    assert(tnc1Res.status === 201, 'Tenancy 1 created (Room 1, ongoing)');
    const tenancy1Id = tnc1Res.body.data.tenancy.id;

    // Create Tenant 2 → Tenancy on Room 2 (active for Nov 2026, ends 2026-11-30)
    const t2Res = await makeRequest({
      method: 'POST', path: '/api/tenants',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { fullName: 'RC Tenant Two' },
    });
    assert(t2Res.status === 201, 'Tenant 2 created');
    const tenant2Id = t2Res.body.data.tenant.id;

    const tnc2Res = await makeRequest({
      method: 'POST', path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { tenantId: tenant2Id, roomId: room2Id, startDate: '2026-11-01', endDate: '2026-11-30', monthlyRent: 12000, rentDueDay: 1 },
    });
    assert(tnc2Res.status === 201, 'Tenancy 2 created (Room 2, Nov only)');
    const tenancy2Id = tnc2Res.body.data.tenancy.id;

    // ─── Input validation ────────────────────────────────────────────────────
    const badMonth = await makeRequest({
      method: 'POST', path: '/api/rent-charges/generate',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { month: '2026-13' },
    });
    assert(badMonth.status === 400, 'Invalid month (13) rejected with 400');

    const missingMonth = await makeRequest({
      method: 'POST', path: '/api/rent-charges/generate',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: {},
    });
    assert(missingMonth.status === 400, 'Missing month rejected with 400');

    // ─── Bulk generation for Nov 2026 ────────────────────────────────────────
    const genRes = await makeRequest({
      method: 'POST', path: '/api/rent-charges/generate',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { month: '2026-11' },
    });
    assert(genRes.status === 200, 'POST /api/rent-charges/generate → 200');
    assert(genRes.body.data.generated === 2, `Generated 2 charges (got ${genRes.body.data.generated})`);
    assert(genRes.body.data.skipped === 0, 'Skipped 0 on first run');
    assert(Array.isArray(genRes.body.data.charges) && genRes.body.data.charges.length === 2, '2 charges returned in response');

    const charge1 = genRes.body.data.charges.find((c) => c.tenancyId === tenancy1Id);
    const charge2 = genRes.body.data.charges.find((c) => c.tenancyId === tenancy2Id);

    assert(charge1 !== undefined, 'Charge for Tenancy 1 (Room 1) generated');
    assert(Number(charge1.amountDue) === 15000, 'Charge 1 amountDue = ₹15,000');
    assert(charge1.status === 'unpaid', 'Charge 1 status = unpaid');

    // dueDate for Tenancy 1: rentDueDay=5 → 2026-11-05
    const c1DueDate = new Date(charge1.dueDate);
    assert(c1DueDate.getUTCDate() === 5, `Charge 1 dueDate day = 5 (got ${c1DueDate.getUTCDate()})`);
    assert(c1DueDate.getUTCMonth() === 10, `Charge 1 dueDate month = Nov (got ${c1DueDate.getUTCMonth() + 1})`);

    assert(charge2 !== undefined, 'Charge for Tenancy 2 (Room 2, Nov only) generated');
    assert(Number(charge2.amountDue) === 12000, 'Charge 2 amountDue = ₹12,000');

    // dueDate for Tenancy 2: rentDueDay=1 → 2026-11-01
    const c2DueDate = new Date(charge2.dueDate);
    assert(c2DueDate.getUTCDate() === 1, `Charge 2 dueDate day = 1 (got ${c2DueDate.getUTCDate()})`);

    // ─── Idempotency: Second generation → zero new, all skipped ────────────
    const gen2Res = await makeRequest({
      method: 'POST', path: '/api/rent-charges/generate',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { month: '2026-11' },
    });
    assert(gen2Res.status === 200, 'Second generation call succeeds (idempotent, 200)');
    assert(gen2Res.body.data.generated === 0, `Second run generates 0 new charges (got ${gen2Res.body.data.generated})`);
    assert(gen2Res.body.data.skipped === 2, `Second run skips 2 existing charges (got ${gen2Res.body.data.skipped})`);

    // ─── Empty month: Tenancy 2 ends Nov 30, so Dec has only Tenancy 1 ─────
    const genDecRes = await makeRequest({
      method: 'POST', path: '/api/rent-charges/generate',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { month: '2026-12' },
    });
    assert(genDecRes.status === 200, 'December generation succeeds');
    assert(genDecRes.body.data.generated === 1, `December generates 1 charge (Tenancy 1 only) — got ${genDecRes.body.data.generated}`);

    // ─── Month with no eligible tenancies ────────────────────────────────────
    const genFutureRes = await makeRequest({
      method: 'POST', path: '/api/rent-charges/generate',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { month: '2025-01' },
    });
    assert(genFutureRes.status === 200, 'Generation for month before any tenancy returns 200');
    assert(genFutureRes.body.data.generated === 0, 'No charges generated for month before tenancies started');

    // ─── List rent charges for Nov 2026 ──────────────────────────────────────
    const listRes = await makeRequest({
      method: 'GET', path: '/api/rent-charges?month=2026-11',
      cookies: authA,
    });
    assert(listRes.status === 200, 'GET /api/rent-charges?month=2026-11 → 200');
    assert(listRes.body.data.charges.length === 2, `Listed 2 charges for Nov 2026 (got ${listRes.body.data.charges.length})`);

    // Status filter
    const listUnpaid = await makeRequest({
      method: 'GET', path: '/api/rent-charges?month=2026-11&status=unpaid',
      cookies: authA,
    });
    assert(listUnpaid.status === 200, 'Filter by status=unpaid → 200');
    assert(listUnpaid.body.data.charges.length === 2, 'Both charges are unpaid');

    const listPaid = await makeRequest({
      method: 'GET', path: '/api/rent-charges?month=2026-11&status=paid',
      cookies: authA,
    });
    assert(listPaid.body.data.charges.length === 0, 'No paid charges yet');

    // ─── Get single charge ────────────────────────────────────────────────────
    const charge1Id = charge1.id;
    const getRes = await makeRequest({
      method: 'GET', path: `/api/rent-charges/${charge1Id}`,
      cookies: authA,
    });
    assert(getRes.status === 200, 'GET /api/rent-charges/:id → 200');
    assert(getRes.body.data.charge.id === charge1Id, 'Returned correct charge');
    assert(getRes.body.data.charge.tenancy?.tenant?.fullName === 'RC Tenant One', 'Charge includes tenant name');
    assert(getRes.body.data.charge.tenancy?.room?.label === 'RC-101', 'Charge includes room label');

    // ─── Summary endpoint ─────────────────────────────────────────────────────
    const summaryRes = await makeRequest({
      method: 'GET', path: '/api/rent-charges/summary?month=2026-11',
      cookies: authA,
    });
    assert(summaryRes.status === 200, 'GET /api/rent-charges/summary → 200');
    assert(summaryRes.body.data.totalCharges === 2, 'Summary shows 2 charges');
    assert(summaryRes.body.data.totalDue === 27000, `Summary totalDue = 27000 (got ${summaryRes.body.data.totalDue})`);
    assert(summaryRes.body.data.totalOutstanding === 27000, 'Summary totalOutstanding = 27000');
    assert(summaryRes.body.data.counts.unpaid === 2, 'Summary counts.unpaid = 2');

    const summarBad = await makeRequest({
      method: 'GET', path: '/api/rent-charges/summary',
      cookies: authA,
    });
    assert(summarBad.status === 400, 'Summary without month → 400');

    // ─── Custom single charge creation ───────────────────────────────────────
    // Partial first month charge for Oct 2026 for Tenant 1 (custom ₹8000 for partial)
    const customRes = await makeRequest({
      method: 'POST', path: '/api/rent-charges',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: {
        tenancyId: tenancy1Id,
        period: '2026-10-01',
        amountDue: 8000,
        dueDate: '2026-10-05',
      },
    });
    assert(customRes.status === 201, 'Custom partial-month charge created (201)');
    assert(Number(customRes.body.data.charge.amountDue) === 8000, 'Custom charge amountDue = ₹8000');
    const customChargeId = customRes.body.data.charge.id;

    // Duplicate single charge creation → 409
    const dupRes = await makeRequest({
      method: 'POST', path: '/api/rent-charges',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: {
        tenancyId: tenancy1Id,
        period: '2026-10-01',
        amountDue: 9000,
        dueDate: '2026-10-05',
      },
    });
    assert(dupRes.status === 409 && dupRes.body.error?.code === 'RENT_CHARGE_DUPLICATE', 'Duplicate custom charge rejected with 409 RENT_CHARGE_DUPLICATE');

    // Invalid amountDue ≤ 0
    const badAmtRes = await makeRequest({
      method: 'POST', path: '/api/rent-charges',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: {
        tenancyId: tenancy1Id,
        period: '2026-09-01',
        amountDue: -100,
        dueDate: '2026-09-05',
      },
    });
    assert(badAmtRes.status === 400, 'Negative amountDue rejected with 400');

    // ─── Update (custom amount override) ────────────────────────────────────
    const updateRes = await makeRequest({
      method: 'PATCH', path: `/api/rent-charges/${customChargeId}`,
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
      body: { amountDue: 7500 },
    });
    assert(updateRes.status === 200, 'PATCH /api/rent-charges/:id → 200');
    assert(Number(updateRes.body.data.charge.amountDue) === 7500, 'Updated amountDue = ₹7500');

    // ─── Delete (no allocations) ──────────────────────────────────────────────
    const deleteRes = await makeRequest({
      method: 'DELETE', path: `/api/rent-charges/${customChargeId}`,
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authA,
    });
    assert(deleteRes.status === 200, 'DELETE /api/rent-charges/:id → 200');
    assert(deleteRes.body.data.deleted === true, 'Delete response confirms deletion');

    // Verify deleted charge is gone
    const getDeleted = await makeRequest({
      method: 'GET', path: `/api/rent-charges/${customChargeId}`,
      cookies: authA,
    });
    assert(getDeleted.status === 404, 'Deleted charge returns 404');

    // ─── Landlord isolation ───────────────────────────────────────────────────
    const crossList = await makeRequest({
      method: 'GET', path: '/api/rent-charges?month=2026-11',
      cookies: authB,
    });
    assert(crossList.status === 200, 'Landlord B GET rent-charges returns 200');
    assert(crossList.body.data.charges.length === 0, 'Landlord B sees 0 charges (isolation)');

    const crossGet = await makeRequest({
      method: 'GET', path: `/api/rent-charges/${charge1Id}`,
      cookies: authB,
    });
    assert(crossGet.status === 404, 'Landlord B cannot access Landlord A charge (404)');

    const crossPatch = await makeRequest({
      method: 'PATCH', path: `/api/rent-charges/${charge1Id}`,
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authB,
      body: { amountDue: 99999 },
    });
    assert(crossPatch.status === 404, 'Landlord B cannot update Landlord A charge (404)');

    const crossDelete = await makeRequest({
      method: 'DELETE', path: `/api/rent-charges/${charge1Id}`,
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authB,
    });
    assert(crossDelete.status === 404, 'Landlord B cannot delete Landlord A charge (404)');

    const crossGen = await makeRequest({
      method: 'POST', path: '/api/rent-charges/generate',
      headers: { 'X-CSRF-Token': csrfToken }, cookies: authB,
      body: { month: '2026-11' },
    });
    assert(crossGen.status === 200 && crossGen.body.data.generated === 0, 'Landlord B generates 0 charges (no tenancies)');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up test records ---');
    try {
      const userIds = [userAId, userBId].filter(Boolean);
      if (userIds.length) {
        await prisma.rentCharge.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.tenancy.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.room.deleteMany({ where: { property: { ownerId: { in: userIds } } } });
        await prisma.property.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.tenant.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } catch (e) {
      console.error('Cleanup error:', e.message);
    }

    if (server) await new Promise((r) => server.close(r));
    await prisma.$disconnect();

    console.log(`\nTest results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  }
}

runTests();
