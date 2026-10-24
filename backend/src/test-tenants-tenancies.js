import http from 'http';
import app from './server.js';
import prisma from './config/db.js';

const PORT = 5098;
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
          try {
            json = JSON.parse(rawData);
          } catch {
            json = rawData;
          }
          const setCookies = res.headers['set-cookie'] || [];
          resolve({
            status: res.statusCode,
            headers: res.headers,
            cookies: setCookies,
            body: json,
          });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function parseCookie(cookieStr) {
  return cookieStr.split(';')[0];
}

async function runTests() {
  console.log('--- Starting IKTIS Phase 4 Tenants & Tenancies Test Suite ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  let userAId = null;
  let userBId = null;

  try {
    // 1. Unauthenticated checks
    const unauthTenants = await makeRequest({ method: 'GET', path: '/api/tenants' });
    assert(unauthTenants.status === 401, 'Unauthenticated GET /api/tenants is rejected (HTTP 401)');

    const unauthTenancies = await makeRequest({ method: 'GET', path: '/api/tenancies' });
    assert(unauthTenancies.status === 401, 'Unauthenticated GET /api/tenancies is rejected (HTTP 401)');

    // 2. Fetch CSRF token
    const csrfRes = await makeRequest({ method: 'GET', path: '/api/auth/csrf' });
    const csrfCookie = parseCookie(csrfRes.cookies.find((c) => c.startsWith('iktis_csrf=')));
    const csrfToken = csrfRes.body.data.csrfToken;

    // 3. Register Landlord A
    const emailA = `landlord.a.${Date.now()}@example.com`;
    const regARes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: [csrfCookie],
      body: { name: 'Landlord A', email: emailA, password: 'Password123!' },
    });
    assert(regARes.status === 201, 'Landlord A registered successfully');
    userAId = regARes.body.data.user.id;
    const sessionCookieA = parseCookie(regARes.cookies.find((c) => c.startsWith('iktis_session=')));
    const authCookiesA = [csrfCookie, sessionCookieA];

    // 4. Register Landlord B
    const emailB = `landlord.b.${Date.now()}@example.com`;
    const regBRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: [csrfCookie],
      body: { name: 'Landlord B', email: emailB, password: 'Password123!' },
    });
    assert(regBRes.status === 201, 'Landlord B registered successfully');
    userBId = regBRes.body.data.user.id;
    const sessionCookieB = parseCookie(regBRes.cookies.find((c) => c.startsWith('iktis_session=')));
    const authCookiesB = [csrfCookie, sessionCookieB];

    // 5. Landlord A creates Property & Rooms
    const propRes = await makeRequest({
      method: 'POST',
      path: '/api/properties',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { name: 'Lotus Residency', address: '123 MG Road, Bengaluru' },
    });
    assert(propRes.status === 201, 'Property created for Landlord A');
    const propertyAId = propRes.body.data.property.id;

    // Room 101 (Available)
    const room101Res = await makeRequest({
      method: 'POST',
      path: `/api/properties/${propertyAId}/rooms`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { label: 'Room 101', description: 'Master Bedroom', isAvailable: true },
    });
    assert(room101Res.status === 201, 'Room 101 created (Available)');
    const room101Id = room101Res.body.data.room.id;

    // Room 102 (Under Maintenance)
    const room102Res = await makeRequest({
      method: 'POST',
      path: `/api/properties/${propertyAId}/rooms`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { label: 'Room 102', description: 'Standard Room', isAvailable: false },
    });
    assert(room102Res.status === 201, 'Room 102 created (Under Maintenance)');
    const room102Id = room102Res.body.data.room.id;

    // ==========================================
    // 6. Tenant Management Tests
    // ==========================================

    // 6.1 Create Tenant 1
    const createTenantRes = await makeRequest({
      method: 'POST',
      path: '/api/tenants',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        fullName: 'Rahul Sharma',
        phone: '+91 9876543210',
        email: 'rahul.sharma@example.com',
        notes: 'Works at Tech Corp, quiet tenant',
      },
    });
    assert(createTenantRes.status === 201, 'Tenant 1 created successfully (HTTP 201)');
    assert(createTenantRes.body.data.tenant.fullName === 'Rahul Sharma', 'Tenant 1 fullName matched');
    assert(createTenantRes.body.data.tenant.phone === '+91 9876543210', 'Tenant 1 phone matched');
    const tenant1Id = createTenantRes.body.data.tenant.id;

    // 6.2 Create Tenant 2 (Minimal fields)
    const createTenant2Res = await makeRequest({
      method: 'POST',
      path: '/api/tenants',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        fullName: 'Priya Patel',
      },
    });
    assert(createTenant2Res.status === 201, 'Tenant 2 created with minimal required fields (HTTP 201)');
    const tenant2Id = createTenant2Res.body.data.tenant.id;

    // 6.3 List Tenants
    const listTenantsRes = await makeRequest({
      method: 'GET',
      path: '/api/tenants',
      cookies: authCookiesA,
    });
    assert(listTenantsRes.status === 200, 'GET /api/tenants returns 200');
    assert(Array.isArray(listTenantsRes.body.data.tenants) && listTenantsRes.body.data.tenants.length === 2, 'Listed exactly 2 tenants for Landlord A');

    // 6.4 Search Tenants (by fullName, phone, email)
    const searchName = await makeRequest({
      method: 'GET',
      path: '/api/tenants?search=Rahul',
      cookies: authCookiesA,
    });
    assert(searchName.body.data.tenants.length === 1 && searchName.body.data.tenants[0].id === tenant1Id, 'Search by name returns correct tenant');

    const searchPhone = await makeRequest({
      method: 'GET',
      path: '/api/tenants?search=9876543210',
      cookies: authCookiesA,
    });
    assert(searchPhone.body.data.tenants.length === 1 && searchPhone.body.data.tenants[0].id === tenant1Id, 'Search by phone returns correct tenant');

    const searchEmail = await makeRequest({
      method: 'GET',
      path: '/api/tenants?search=rahul.sharma',
      cookies: authCookiesA,
    });
    assert(searchEmail.body.data.tenants.length === 1 && searchEmail.body.data.tenants[0].id === tenant1Id, 'Search by email returns correct tenant');

    // 6.5 Get Tenant Details & History
    const getTenantRes = await makeRequest({
      method: 'GET',
      path: `/api/tenants/${tenant1Id}`,
      cookies: authCookiesA,
    });
    assert(getTenantRes.status === 200, 'GET /api/tenants/:id returns 200');
    assert(getTenantRes.body.data.tenant.activeTenancy === null, 'Newly created tenant has no active tenancy');
    assert(Array.isArray(getTenantRes.body.data.tenant.previousTenancies), 'Previous tenancies is an array');

    // 6.6 Update Tenant
    const updateTenantRes = await makeRequest({
      method: 'PATCH',
      path: `/api/tenants/${tenant1Id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        phone: '+91 9999988888',
        notes: 'Updated contact notes',
      },
    });
    assert(updateTenantRes.status === 200, 'PATCH /api/tenants/:id updates tenant successfully');
    assert(updateTenantRes.body.data.tenant.phone === '+91 9999988888', 'Updated phone reflected in response');

    // 6.7 Landlord Isolation on Tenants: Landlord B cannot access Landlord A's tenant
    const crossGetTenant = await makeRequest({
      method: 'GET',
      path: `/api/tenants/${tenant1Id}`,
      cookies: authCookiesB,
    });
    assert(crossGetTenant.status === 404, 'Landlord B cannot access Landlord A tenant (HTTP 404)');

    const crossUpdateTenant = await makeRequest({
      method: 'PATCH',
      path: `/api/tenants/${tenant1Id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesB,
      body: { fullName: 'Hacked Tenant' },
    });
    assert(crossUpdateTenant.status === 404, 'Landlord B cannot update Landlord A tenant (HTTP 404)');

    const crossArchiveTenant = await makeRequest({
      method: 'DELETE',
      path: `/api/tenants/${tenant1Id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesB,
    });
    assert(crossArchiveTenant.status === 404, 'Landlord B cannot archive Landlord A tenant (HTTP 404)');

    // ==========================================
    // 7. Tenancy Management Tests
    // ==========================================

    // 7.1 Validation: Invalid date range (end < start)
    const invalidDateRes = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        tenantId: tenant1Id,
        roomId: room101Id,
        startDate: '2026-06-01',
        endDate: '2026-05-01',
        monthlyRent: 15000,
        rentDueDay: 5,
      },
    });
    assert(invalidDateRes.status === 400, 'Tenancy with endDate < startDate is rejected with HTTP 400');

    // 7.2 Validation: Invalid rent (negative or 0)
    const invalidRentRes = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        tenantId: tenant1Id,
        roomId: room101Id,
        startDate: '2026-06-01',
        monthlyRent: -500,
        rentDueDay: 5,
      },
    });
    assert(invalidRentRes.status === 400, 'Negative monthly rent is rejected');

    // 7.3 Validation: Invalid rent due day (> 31)
    const invalidDueDayRes = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        tenantId: tenant1Id,
        roomId: room101Id,
        startDate: '2026-06-01',
        monthlyRent: 15000,
        rentDueDay: 35,
      },
    });
    assert(invalidDueDayRes.status === 400, 'Rent due day > 31 is rejected');

    // 7.4 Validation: Room under maintenance (isAvailable: false)
    const roomMaintRes = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        tenantId: tenant1Id,
        roomId: room102Id,
        startDate: '2026-06-01',
        monthlyRent: 12000,
        rentDueDay: 1,
      },
    });
    assert(roomMaintRes.status === 400 && roomMaintRes.body.error?.code === 'ROOM_NOT_AVAILABLE', 'Assigning room under maintenance is rejected with ROOM_NOT_AVAILABLE');

    // 7.5 Create valid Tenancy for Tenant 1 on Room 101 (Open-ended, ongoing)
    const tenancy1Res = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        tenantId: tenant1Id,
        roomId: room101Id,
        startDate: '2026-01-01',
        monthlyRent: 18000,
        rentDueDay: 5,
      },
    });
    assert(tenancy1Res.status === 201, 'Valid tenancy created on Room 101 (HTTP 201)');
    assert(Number(tenancy1Res.body.data.tenancy.monthlyRent) === 18000, 'Monthly rent saved correctly');
    assert(tenancy1Res.body.data.tenancy.rentDueDay === 5, 'Rent due day saved correctly');
    const tenancy1Id = tenancy1Res.body.data.tenancy.id;

    // 7.6 Verify Room 101 is now occupied
    const room101Check = await makeRequest({
      method: 'GET',
      path: `/api/rooms/${room101Id}`,
      cookies: authCookiesA,
    });
    assert(room101Check.body.data.room.isOccupied === true, 'Room 101 isOccupied is now true');
    assert(room101Check.body.data.room.currentTenancy?.tenantName === 'Rahul Sharma', 'Room 101 currentTenancy displays tenant name');

    // 7.7 Verify Tenant 1 now has activeTenancy
    const tenant1Check = await makeRequest({
      method: 'GET',
      path: `/api/tenants/${tenant1Id}`,
      cookies: authCookiesA,
    });
    assert(tenant1Check.body.data.tenant.activeTenancy !== null, 'Tenant 1 now has activeTenancy populated');
    assert(tenant1Check.body.data.tenant.activeTenancy.roomLabel === 'Room 101', 'Tenant 1 activeTenancy displays Room 101');

    // ==========================================
    // 8. Overlapping Tenancy Prevention
    // ==========================================

    // 8.1 Attempt to assign Tenant 2 to Room 101 while Tenancy 1 is active
    const overlapRes = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        tenantId: tenant2Id,
        roomId: room101Id,
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        monthlyRent: 19000,
        rentDueDay: 1,
      },
    });
    assert(overlapRes.status === 409 && overlapRes.body.error?.code === 'TENANCY_OVERLAP', 'Assigning overlapping tenancy to Room 101 returns HTTP 409 TENANCY_OVERLAP');

    // 8.2 Landlord B cannot create tenancy for Landlord A's room
    const crossTenancyRes = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesB,
      body: {
        tenantId: tenant1Id,
        roomId: room101Id,
        startDate: '2026-06-01',
        monthlyRent: 20000,
        rentDueDay: 1,
      },
    });
    assert(crossTenancyRes.status === 404, 'Landlord B cannot assign tenancy to Landlord A room/tenant (HTTP 404)');

    // ==========================================
    // 9. End Tenancy
    // ==========================================

    // 9.1 End date before start date rejected
    const invalidEndRes = await makeRequest({
      method: 'PATCH',
      path: `/api/tenancies/${tenancy1Id}/end`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { endDate: '2025-12-31' },
    });
    assert(invalidEndRes.status === 400 && invalidEndRes.body.error?.code === 'INVALID_DATE_RANGE', 'Ending tenancy with endDate < startDate rejected');

    // 9.2 End tenancy successfully with date in past
    const endTenancyRes = await makeRequest({
      method: 'PATCH',
      path: `/api/tenancies/${tenancy1Id}/end`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { endDate: '2026-04-30' },
    });
    assert(endTenancyRes.status === 200, 'Tenancy ended successfully with endDate (HTTP 200)');

    // 9.3 Room 101 is now vacant
    const room101AfterEnd = await makeRequest({
      method: 'GET',
      path: `/api/rooms/${room101Id}`,
      cookies: authCookiesA,
    });
    assert(room101AfterEnd.body.data.room.isOccupied === false, 'Room 101 isOccupied is now false');
    assert(room101AfterEnd.body.data.room.currentTenancy === null, 'Room 101 currentTenancy is null');

    // 9.4 Tenancy 1 is now in Tenant 1's previousTenancies
    const tenant1AfterEnd = await makeRequest({
      method: 'GET',
      path: `/api/tenants/${tenant1Id}`,
      cookies: authCookiesA,
    });
    assert(tenant1AfterEnd.body.data.tenant.activeTenancy === null, 'Tenant 1 has no active tenancy');
    assert(tenant1AfterEnd.body.data.tenant.previousTenancies.length === 1, 'Tenant 1 has 1 previous tenancy in history');
    assert(tenant1AfterEnd.body.data.tenant.previousTenancies[0].id === tenancy1Id, 'Previous tenancy ID matches Tenancy 1');

    // ==========================================
    // 10. Tenant Archival & Protection
    // ==========================================

    // 10.1 Assign Tenant 2 to Room 101 now that it is vacant (Starting 2026-05-01)
    const tenancy2Res = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        tenantId: tenant2Id,
        roomId: room101Id,
        startDate: '2026-05-01',
        monthlyRent: 20000,
        rentDueDay: 1,
      },
    });
    assert(tenancy2Res.status === 201, 'Tenant 2 successfully assigned to Room 101');
    const tenancy2Id = tenancy2Res.body.data.tenancy.id;

    // 10.2 Attempt to archive Tenant 2 while tenancy is ongoing -> Should be rejected
    const archiveActiveTenantRes = await makeRequest({
      method: 'DELETE',
      path: `/api/tenants/${tenant2Id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
    });
    assert(archiveActiveTenantRes.status === 400 && archiveActiveTenantRes.body.error?.code === 'TENANT_HAS_ACTIVE_TENANCY', 'Archiving tenant with active tenancy is rejected (400 TENANT_HAS_ACTIVE_TENANCY)');

    // 10.3 End Tenant 2's tenancy
    const endTenancy2Res = await makeRequest({
      method: 'PATCH',
      path: `/api/tenancies/${tenancy2Id}/end`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { endDate: '2026-06-30' },
    });
    assert(endTenancy2Res.status === 200, 'Tenant 2 tenancy ended');

    // 10.4 Archive Tenant 2 now that tenancy is concluded
    const archiveTenant2Res = await makeRequest({
      method: 'DELETE',
      path: `/api/tenants/${tenant2Id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
    });
    assert(archiveTenant2Res.status === 200, 'Tenant 2 archived successfully (HTTP 200)');

    // 10.5 Verify Tenant 2 is excluded by default from listTenants
    const listWithoutArchived = await makeRequest({
      method: 'GET',
      path: '/api/tenants',
      cookies: authCookiesA,
    });
    assert(listWithoutArchived.body.data.tenants.length === 1, 'Default listTenants excludes archived Tenant 2');

    // 10.6 Verify Tenant 2 appears when includeArchived=true
    const listWithArchived = await makeRequest({
      method: 'GET',
      path: '/api/tenants?includeArchived=true',
      cookies: authCookiesA,
    });
    assert(listWithArchived.body.data.tenants.length === 2, 'listTenants with includeArchived=true includes Tenant 2');

    // 10.7 Verify editing archived Tenant 2 is rejected
    const updateArchivedRes = await makeRequest({
      method: 'PATCH',
      path: `/api/tenants/${tenant2Id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { fullName: 'Updated Name' },
    });
    assert(updateArchivedRes.status === 400 && updateArchivedRes.body.error?.code === 'TENANT_ARCHIVED', 'Editing archived tenant rejected (400 TENANT_ARCHIVED)');

    // 10.8 Verify assigning tenancy to archived Tenant 2 is rejected
    const assignArchivedRes = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: {
        tenantId: tenant2Id,
        roomId: room101Id,
        startDate: '2026-07-01',
        monthlyRent: 20000,
        rentDueDay: 1,
      },
    });
    assert(assignArchivedRes.status === 400 && assignArchivedRes.body.error?.code === 'TENANT_ARCHIVED', 'Assigning tenancy to archived tenant rejected (400 TENANT_ARCHIVED)');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    // Teardown test data
    console.log('\n--- Cleaning up test records ---');
    try {
      if (userAId || userBId) {
        const userIds = [userAId, userBId].filter(Boolean);
        await prisma.tenancy.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.room.deleteMany({ where: { property: { ownerId: { in: userIds } } } });
        await prisma.property.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.tenant.deleteMany({ where: { ownerId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr.message);
    }

    if (server) {
      await new Promise((res) => server.close(res));
    }
    await prisma.$disconnect();

    console.log(`\nTest results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
