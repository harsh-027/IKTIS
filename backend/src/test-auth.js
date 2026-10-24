import http from 'http';
import app from './server.js';
import prisma from './config/db.js';
import { hashToken } from './utils/crypto.js';

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

          // Extract set-cookie headers
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
  console.log('--- Starting IKTIS Phase 2 Authentication Test Suite ---\n');
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

  // Start temporary test server
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  try {
    const testEmail = `test.landlord.${Date.now()}@example.com`;
    const testPassword = 'StrongPassword123!';
    const testName = 'Test Landlord';

    // Test 1: Fetch initial CSRF token
    const csrfRes = await makeRequest({ method: 'GET', path: '/api/auth/csrf' });
    assert(csrfRes.status === 200, 'GET /api/auth/csrf returns HTTP 200');
    assert(!!csrfRes.body?.data?.csrfToken, 'GET /api/auth/csrf returns csrfToken');

    const csrfCookie = csrfRes.cookies.find((c) => c.startsWith('iktis_csrf='));
    assert(!!csrfCookie, 'Response sets iktis_csrf cookie');

    const rawCsrfToken = csrfRes.body.data.csrfToken;
    const clientCookies = [parseCookie(csrfCookie)];

    // Test 2: CSRF protection blocks state-changing request without X-CSRF-Token header
    const noCsrfRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      cookies: clientCookies,
      body: { name: testName, email: testEmail, password: testPassword },
    });
    assert(noCsrfRes.status === 403, 'POST /api/auth/register without X-CSRF-Token is rejected (HTTP 403)');
    assert(noCsrfRes.body?.error?.code === 'CSRF_TOKEN_MISSING', 'Returns code CSRF_TOKEN_MISSING');

    // Test 3: Validation failure for invalid input
    const invalidRegRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: { 'X-CSRF-Token': rawCsrfToken },
      cookies: clientCookies,
      body: { name: 'A', email: 'invalid-email', password: 'short' },
    });
    assert(invalidRegRes.status === 400, 'Registration with invalid fields rejected with HTTP 400 (Zod)');
    assert(invalidRegRes.body?.error?.code === 'VALIDATION_ERROR', 'Returns code VALIDATION_ERROR');

    // Test 4: Successful registration
    const regRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: { 'X-CSRF-Token': rawCsrfToken },
      cookies: clientCookies,
      body: { name: testName, email: testEmail, password: testPassword },
    });
    assert(regRes.status === 201, 'POST /api/auth/register creates user and returns HTTP 201');
    assert(regRes.body?.data?.user?.email === testEmail, 'Returns registered user profile');
    assert(!regRes.body?.data?.user?.passwordHash, 'Never returns passwordHash in response');
    assert(!regRes.body?.data?.sessionToken, 'Never returns sessionToken in JSON body');

    const sessionCookie = regRes.cookies.find((c) => c.startsWith('iktis_session='));
    assert(!!sessionCookie, 'Response sets iktis_session cookie');
    assert(sessionCookie.includes('HttpOnly'), 'iktis_session cookie has HttpOnly flag');
    assert(sessionCookie.includes('SameSite=Lax'), 'iktis_session cookie has SameSite=Lax flag');

    // Extract the raw session token from cookie to verify database hashing
    const rawSessionCookieValue = parseCookie(sessionCookie);
    const rawSessionToken = rawSessionCookieValue.replace('iktis_session=', '');
    const activeAuthCookies = [parseCookie(csrfCookie), rawSessionCookieValue];

    // Test 5: Verify database storage security (Only hashed tokens stored, bcrypt password)
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    assert(!!dbUser, 'User is persisted in MySQL users table');
    assert(dbUser.passwordHash.startsWith('$2'), 'Password stored as bcrypt hash');
    assert(dbUser.passwordHash !== testPassword, 'Password is not plaintext');

    const expectedTokenHash = hashToken(rawSessionToken);
    const dbSession = await prisma.session.findUnique({ where: { tokenHash: expectedTokenHash } });
    assert(!!dbSession, 'Session is persisted in MySQL sessions table via SHA-256 hash');
    assert(dbSession.userId === dbUser.id, 'Session correctly references User id');
    assert(dbSession.revokedAt === null, 'Active session has revokedAt as null');

    // Test 6: Duplicate email registration rejected
    const dupRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: { 'X-CSRF-Token': rawCsrfToken },
      cookies: clientCookies,
      body: { name: 'Another Landlord', email: testEmail, password: testPassword },
    });
    assert(dupRes.status === 409, 'Duplicate email registration rejected with HTTP 409');
    assert(dupRes.body?.error?.code === 'EMAIL_EXISTS', 'Returns code EMAIL_EXISTS');

    // Test 7: GET /api/auth/me with valid session cookie
    const meRes = await makeRequest({
      method: 'GET',
      path: '/api/auth/me',
      cookies: activeAuthCookies,
    });
    assert(meRes.status === 200, 'GET /api/auth/me with valid cookie returns HTTP 200');
    assert(meRes.body?.data?.user?.email === testEmail, 'GET /api/auth/me returns current user');
    assert(!meRes.body?.data?.user?.passwordHash, 'GET /api/auth/me does not expose passwordHash');

    // Test 8: GET /api/auth/me without session cookie
    const unauthRes = await makeRequest({
      method: 'GET',
      path: '/api/auth/me',
      cookies: [parseCookie(csrfCookie)],
    });
    assert(unauthRes.status === 401, 'GET /api/auth/me without session returns HTTP 401');

    // Test 9: Login with wrong password (generic error)
    const wrongPassRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      headers: { 'X-CSRF-Token': rawCsrfToken },
      cookies: clientCookies,
      body: { email: testEmail, password: 'WrongPassword999!' },
    });
    assert(wrongPassRes.status === 401, 'Login with incorrect password returns HTTP 401');
    assert(wrongPassRes.body?.error?.message === 'Invalid email or password', 'Uses generic login error');

    // Test 10: Login with non-existent email (generic error)
    const wrongEmailRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      headers: { 'X-CSRF-Token': rawCsrfToken },
      cookies: clientCookies,
      body: { email: 'nonexistent@example.com', password: 'SomePassword123!' },
    });
    assert(wrongEmailRes.status === 401, 'Login with non-existent email returns HTTP 401');
    assert(wrongEmailRes.body?.error?.message === 'Invalid email or password', 'Uses generic login error');

    // Test 11: Successful Login
    const loginRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      headers: { 'X-CSRF-Token': rawCsrfToken },
      cookies: clientCookies,
      body: { email: testEmail, password: testPassword },
    });
    assert(loginRes.status === 200, 'Login with valid credentials returns HTTP 200');
    assert(loginRes.body?.data?.user?.email === testEmail, 'Returns authenticated user data');

    const newSessionCookie = loginRes.cookies.find((c) => c.startsWith('iktis_session='));
    assert(!!newSessionCookie, 'Login issues new session cookie');
    const loggedInCookies = [parseCookie(csrfCookie), parseCookie(newSessionCookie)];

    // Test 12: Logout revokes session and clears cookie
    const logoutRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/logout',
      headers: { 'X-CSRF-Token': rawCsrfToken },
      cookies: loggedInCookies,
    });
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns HTTP 200');

    // Check cookie clear header
    const clearedCookie = logoutRes.cookies.find((c) => c.startsWith('iktis_session=;'));
    assert(!!clearedCookie, 'Logout clears iktis_session cookie');

    // Verify session revoked in database
    const loggedInRawToken = parseCookie(newSessionCookie).replace('iktis_session=', '');
    const revokedSession = await prisma.session.findUnique({
      where: { tokenHash: hashToken(loggedInRawToken) },
    });
    assert(revokedSession?.revokedAt !== null, 'Session record in database is marked revokedAt !== null');

    // Test 13: Subsequent request using logged-out session token is rejected
    const postLogoutMeRes = await makeRequest({
      method: 'GET',
      path: '/api/auth/me',
      cookies: loggedInCookies,
    });
    assert(postLogoutMeRes.status === 401, 'Subsequent GET /api/auth/me with revoked token rejected (HTTP 401)');

    // Clean up test records
    await prisma.session.deleteMany({ where: { userId: dbUser.id } });
    await prisma.user.delete({ where: { id: dbUser.id } });
    console.log('[Clean-up] Test user and session records removed.');

  } catch (err) {
    console.error('Unexpected test execution error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
    server.close();
    console.log(`\n--- Test Results: ${passed} Passed, ${failed} Failed ---`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
