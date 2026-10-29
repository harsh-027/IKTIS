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
  console.log('--- Starting IKTIS Phase 3 Properties & Rooms Test Suite ---\n');
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
    const unauthProp = await makeRequest({ method: 'GET', path: '/api/properties' });
    assert(unauthProp.status === 401, 'Unauthenticated GET /api/properties is rejected (HTTP 401)');

    const unauthRoom = await makeRequest({ method: 'GET', path: '/api/rooms/dummy-id' });
    assert(unauthRoom.status === 401, 'Unauthenticated GET /api/rooms/:id is rejected (HTTP 401)');

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
      body: { name: 'Landlord A', email: emailA, password: 'Password123!', termsAccepted: true, privacyPolicyAccepted: true },
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
      body: { name: 'Landlord B', email: emailB, password: 'Password123!', termsAccepted: true, privacyPolicyAccepted: true },
    });
    assert(regBRes.status === 201, 'Landlord B registered successfully');
    userBId = regBRes.body.data.user.id;
    const sessionCookieB = parseCookie(regBRes.cookies.find((c) => c.startsWith('iktis_session=')));
    const authCookiesB = [csrfCookie, sessionCookieB];

    // 5. Landlord A creates Property 1
    const createPropRes = await makeRequest({
      method: 'POST',
      path: '/api/properties',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { name: 'Sunset Palms', address: '100 Coastal Highway' },
    });
    assert(createPropRes.status === 201, 'Landlord A creates property (HTTP 201)');
    const property1 = createPropRes.body.data.property;
    assert(property1.name === 'Sunset Palms', 'Property name is correct');

    // 6. Property validation: missing address
    const invalidPropRes = await makeRequest({
      method: 'POST',
      path: '/api/properties',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { name: 'No Address Property' },
    });
    assert(invalidPropRes.status === 400, 'Property creation without address fails with HTTP 400 (Zod)');

    // 7. Landlord A lists properties -> includes Property 1
    const listARes = await makeRequest({
      method: 'GET',
      path: '/api/properties',
      cookies: authCookiesA,
    });
    assert(listARes.status === 200, 'Landlord A lists properties');
    assert(listARes.body.data.properties.length === 1, 'Landlord A sees exactly 1 property');
    assert(listARes.body.data.properties[0].id === property1.id, 'List contains Property 1');

    // 8. Strict Owner Isolation: Landlord B lists properties -> 0 properties
    const listBRes = await makeRequest({
      method: 'GET',
      path: '/api/properties',
      cookies: authCookiesB,
    });
    assert(listBRes.status === 200, 'Landlord B lists properties');
    assert(listBRes.body.data.properties.length === 0, 'Landlord B sees 0 properties (owner isolation enforced)');

    // 9. Cross-owner access: Landlord B tries to view Property 1 -> 404
    const crossViewRes = await makeRequest({
      method: 'GET',
      path: `/api/properties/${property1.id}`,
      cookies: authCookiesB,
    });
    assert(crossViewRes.status === 404, 'Landlord B accessing Property 1 gets HTTP 404 (isolated)');

    // 10. Cross-owner access: Landlord B tries to update Property 1 -> 404
    const crossUpdateRes = await makeRequest({
      method: 'PATCH',
      path: `/api/properties/${property1.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesB,
      body: { name: 'Hacked Name' },
    });
    assert(crossUpdateRes.status === 404, 'Landlord B updating Property 1 gets HTTP 404 (isolated)');

    // 11. Cross-owner access: Landlord B tries to archive Property 1 -> 404
    const crossArchiveRes = await makeRequest({
      method: 'DELETE',
      path: `/api/properties/${property1.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesB,
    });
    assert(crossArchiveRes.status === 404, 'Landlord B archiving Property 1 gets HTTP 404 (isolated)');

    // 12. Landlord A updates Property 1
    const updatePropRes = await makeRequest({
      method: 'PATCH',
      path: `/api/properties/${property1.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { name: 'Sunset Palms Villa' },
    });
    assert(updatePropRes.status === 200, 'Landlord A updates Property 1 name');
    assert(updatePropRes.body.data.property.name === 'Sunset Palms Villa', 'Updated name reflected');

    // 13. Landlord A creates Room 101 in Property 1
    const createRoomRes = await makeRequest({
      method: 'POST',
      path: `/api/properties/${property1.id}/rooms`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { label: 'Room 101', description: 'Corner room with sea view', isAvailable: true },
    });
    assert(createRoomRes.status === 201, 'Landlord A creates Room 101 (HTTP 201)');
    const room101 = createRoomRes.body.data.room;
    assert(room101.label === 'Room 101', 'Room label is correct');
    assert(room101.isAvailable === true, 'Room isAvailable is true');

    // 14. Room validation: missing label
    const invalidRoomRes = await makeRequest({
      method: 'POST',
      path: `/api/properties/${property1.id}/rooms`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { description: 'Missing label' },
    });
    assert(invalidRoomRes.status === 400, 'Room creation without label fails with HTTP 400 (Zod)');

    // 15. Duplicate room label in same property rejected
    const dupRoomRes = await makeRequest({
      method: 'POST',
      path: `/api/properties/${property1.id}/rooms`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { label: 'Room 101', description: 'Duplicate attempt' },
    });
    assert(dupRoomRes.status === 409, 'Duplicate room label in same property rejected with HTTP 409');
    assert(dupRoomRes.body.error?.code === 'ROOM_LABEL_EXISTS', 'Returns code ROOM_LABEL_EXISTS');

    // 16. Same room label in a different property is allowed
    const propBRes = await makeRequest({
      method: 'POST',
      path: '/api/properties',
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesB,
      body: { name: 'Blue Ridge Heights', address: '50 Mountain Pass' },
    });
    const propertyB = propBRes.body.data.property;

    const roomBRes = await makeRequest({
      method: 'POST',
      path: `/api/properties/${propertyB.id}/rooms`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesB,
      body: { label: 'Room 101', description: 'Allowed in different property' },
    });
    assert(roomBRes.status === 201, 'Room with same label in a different property created successfully');

    // 17. Landlord B tries to create room in Landlord A's Property 1 -> 404
    const crossCreateRoomRes = await makeRequest({
      method: 'POST',
      path: `/api/properties/${property1.id}/rooms`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesB,
      body: { label: 'Illegal Room' },
    });
    assert(crossCreateRoomRes.status === 404, 'Landlord B creating room in Property 1 gets HTTP 404 (isolated)');

    // 18. Landlord B tries to view Landlord A's Room 101 -> 404
    const crossViewRoomRes = await makeRequest({
      method: 'GET',
      path: `/api/rooms/${room101.id}`,
      cookies: authCookiesB,
    });
    assert(crossViewRoomRes.status === 404, 'Landlord B viewing Room 101 gets HTTP 404 (isolated)');

    // 19. Landlord B tries to update Landlord A's Room 101 -> 404
    const crossUpdateRoomRes = await makeRequest({
      method: 'PATCH',
      path: `/api/rooms/${room101.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesB,
      body: { label: 'Hacked Room' },
    });
    assert(crossUpdateRoomRes.status === 404, 'Landlord B updating Room 101 gets HTTP 404 (isolated)');

    // 20. Landlord A updates Room 101 (e.g. maintenance toggle)
    const updateRoomRes = await makeRequest({
      method: 'PATCH',
      path: `/api/rooms/${room101.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { isAvailable: false },
    });
    assert(updateRoomRes.status === 200, 'Landlord A sets Room 101 isAvailable to false (Maintenance)');
    assert(updateRoomRes.body.data.room.isAvailable === false, 'Updated availability reflected');

    // 21. Landlord A views Property 1 detail -> includes Room 101 with stats
    const propDetailRes = await makeRequest({
      method: 'GET',
      path: `/api/properties/${property1.id}`,
      cookies: authCookiesA,
    });
    assert(propDetailRes.status === 200, 'Landlord A views Property 1 details');
    assert(propDetailRes.body.data.property.rooms.length === 1, 'Property includes 1 room');
    assert(propDetailRes.body.data.property.rooms[0].isAvailable === false, 'Room maintenance status preserved');
    assert(propDetailRes.body.data.property.rooms[0].isOccupied === false, 'Derived occupancy is false (no active tenancy)');

    // 22. Test Occupied Room Protection
    // Create Tenant and active Tenancy for Room 101 to simulate active occupation
    const testTenant = await prisma.tenant.create({
      data: {
        ownerId: userAId,
        fullName: 'Active Test Tenant',
      },
    });

    const activeTenancy = await prisma.tenancy.create({
      data: {
        ownerId: userAId,
        tenantId: testTenant.id,
        roomId: room101.id,
        startDate: new Date(),
        monthlyRent: 15000.00,
        rentDueDay: 5,
      },
    });

    // Attempt to archive occupied Room 101 -> MUST be rejected with HTTP 400
    const occupiedArchiveRoomRes = await makeRequest({
      method: 'DELETE',
      path: `/api/rooms/${room101.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
    });
    assert(occupiedArchiveRoomRes.status === 400, 'Archiving an occupied room is rejected (HTTP 400)');
    assert(occupiedArchiveRoomRes.body.error?.code === 'ROOM_IS_OCCUPIED', 'Returns code ROOM_IS_OCCUPIED');

    // Attempt to archive property containing active tenancy -> MUST be rejected with HTTP 400
    const occupiedArchivePropRes = await makeRequest({
      method: 'DELETE',
      path: `/api/properties/${property1.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
    });
    assert(occupiedArchivePropRes.status === 400, 'Archiving a property with active tenancies is rejected (HTTP 400)');
    assert(occupiedArchivePropRes.body.error?.code === 'PROPERTY_HAS_ACTIVE_TENANCIES', 'Returns code PROPERTY_HAS_ACTIVE_TENANCIES');

    // Conclude the tenancy so room becomes unoccupied
    await prisma.tenancy.delete({ where: { id: activeTenancy.id } });
    await prisma.tenant.delete({ where: { id: testTenant.id } });

    // 23. Landlord A archives unoccupied Room 101 -> succeeds
    const archiveRoomRes = await makeRequest({
      method: 'DELETE',
      path: `/api/rooms/${room101.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
    });
    assert(archiveRoomRes.status === 200, 'Landlord A archives unoccupied Room 101');
    assert(archiveRoomRes.body.data.room.archivedAt !== null, 'Room archivedAt timestamp is set');

    // 24. Attempt to edit archived Room 101 -> MUST be rejected with HTTP 400
    const updateArchivedRoomRes = await makeRequest({
      method: 'PATCH',
      path: `/api/rooms/${room101.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { description: 'Updated while archived' },
    });
    assert(updateArchivedRoomRes.status === 400, 'Editing an archived room is rejected with HTTP 400');
    assert(updateArchivedRoomRes.body.error?.code === 'ROOM_ARCHIVED', 'Returns code ROOM_ARCHIVED');

    // 25. Attempt to create room with same label as archived room -> Rejected with HTTP 409
    const createArchivedLabelRoomRes = await makeRequest({
      method: 'POST',
      path: `/api/properties/${property1.id}/rooms`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { label: 'Room 101', description: 'Re-creating archived label' },
    });
    assert(createArchivedLabelRoomRes.status === 409, 'Recreating room with archived label rejected (HTTP 409, consistent with DB unique constraint)');
    assert(createArchivedLabelRoomRes.body.error?.code === 'ROOM_LABEL_EXISTS', 'Returns code ROOM_LABEL_EXISTS');

    // Verify room no longer in active property rooms
    const propAfterRoomArchive = await makeRequest({
      method: 'GET',
      path: `/api/properties/${property1.id}`,
      cookies: authCookiesA,
    });
    assert(propAfterRoomArchive.body.data.property.rooms.length === 0, 'Archived room excluded from active room list');

    // 26. Landlord A archives Property 1
    const archivePropRes = await makeRequest({
      method: 'DELETE',
      path: `/api/properties/${property1.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
    });
    assert(archivePropRes.status === 200, 'Landlord A archives Property 1');
    assert(archivePropRes.body.data.property.archivedAt !== null, 'Property archivedAt timestamp is set');

    // 27. Attempt to edit archived Property 1 -> MUST be rejected with HTTP 400
    const updateArchivedPropRes = await makeRequest({
      method: 'PATCH',
      path: `/api/properties/${property1.id}`,
      headers: { 'X-CSRF-Token': csrfToken },
      cookies: authCookiesA,
      body: { name: 'Attempted Name Change' },
    });
    assert(updateArchivedPropRes.status === 400, 'Editing an archived property is rejected with HTTP 400');
    assert(updateArchivedPropRes.body.error?.code === 'PROPERTY_ARCHIVED', 'Returns code PROPERTY_ARCHIVED');

    // Verify property no longer in active properties list
    const listAfterArchive = await makeRequest({
      method: 'GET',
      path: '/api/properties',
      cookies: authCookiesA,
    });
    assert(listAfterArchive.body.data.properties.length === 0, 'Archived property excluded from active list');

    // 28. Clean up test users and records
    await prisma.room.deleteMany({ where: { propertyId: property1.id } });
    await prisma.room.deleteMany({ where: { propertyId: propertyB.id } });
    await prisma.property.deleteMany({ where: { ownerId: userAId } });
    await prisma.property.deleteMany({ where: { ownerId: userBId } });
    await prisma.session.deleteMany({ where: { userId: userAId } });
    await prisma.session.deleteMany({ where: { userId: userBId } });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    console.log('[Clean-up] Phase 3 test data cleaned up successfully.');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
    server.close();
    console.log(`\n--- Test Results: ${passed} Passed, ${failed} Failed ---`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
