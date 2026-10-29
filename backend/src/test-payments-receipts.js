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
  console.log('--- Starting IKTIS Phase 6 Payments & Receipts Test Suite ---\n');
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
    // ─── 1. Unauthenticated Guard ───────────────────────────────────────────
    const unauthList = await makeRequest({ method: 'GET', path: '/api/payments' });
    assert(unauthList.status === 401, 'Unauthenticated GET /api/payments → 401');

    const unauthPost = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      body: { tenantId: '00000000-0000-0000-0000-000000000000', amount: 1000, paidAt: '2026-10-01' },
    });
    assert(unauthPost.status === 401 || unauthPost.status === 403, 'Unauthenticated POST /api/payments → 401 or 403');

    // ─── 2. Setup Landlord A & CSRF ─────────────────────────────────────────
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
        name: 'Landlord Payments Tester A',
        email: `payments_a_${ts}@test.com`,
        password: 'Password123!',
        termsAccepted: true,
        privacyPolicyAccepted: true,
      },
    });
    assert(regResA.status === 201, 'Register Landlord A → 201');
    userAId = regResA.body.data.user.id;
    const sessA = parseCookie(regResA.cookies.find((c) => c.startsWith('iktis_session=')));
    const cookiesA = [csrfCookie, sessA];
    const csrfHeadersA = csrfHeaders;

    // ─── 3. Create Property, Room, Tenant, Tenancy for Landlord A ────────────
    const propRes = await makeRequest({
      method: 'POST',
      path: '/api/properties',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { name: 'Lotus Heights', address: '100 Sunset Blvd' },
    });
    assert(propRes.status === 201, 'Create Property → 201');
    const propertyId = propRes.body.data.property.id;

    const roomRes = await makeRequest({
      method: 'POST',
      path: `/api/properties/${propertyId}/rooms`,
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { label: 'Room 301', description: 'Deluxe Studio', isAvailable: true },
    });
    assert(roomRes.status === 201, 'Create Room 301 → 201');
    const roomId = roomRes.body.data.room.id;

    const tenantRes = await makeRequest({
      method: 'POST',
      path: '/api/tenants',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        fullName: 'Rahul Sharma',
        phone: '+91 98765 43210',
        email: 'rahul.payments@test.com',
      },
    });
    assert(tenantRes.status === 201, 'Create Tenant Rahul Sharma → 201');
    const tenantId = tenantRes.body.data.tenant.id;

    const tenancyRes = await makeRequest({
      method: 'POST',
      path: '/api/tenancies',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        tenantId,
        roomId,
        startDate: '2026-09-01',
        monthlyRent: 12000,
        rentDueDay: 5,
      },
    });
    assert(tenancyRes.status === 201, 'Create Tenancy (₹12,000/mo) → 201');
    const tenancyId = tenancyRes.body.data.tenancy.id;

    // Create 2 rent charges: September 2026 (₹12,000) and October 2026 (₹12,000)
    const charge1Res = await makeRequest({
      method: 'POST',
      path: '/api/rent-charges',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        tenancyId,
        period: '2026-09-01',
        amountDue: 12000,
        dueDate: '2026-09-05',
      },
    });
    assert(charge1Res.status === 201, 'Create Charge 1 (Sep 2026, ₹12,000) → 201');
    const charge1Id = charge1Res.body.data.charge.id;

    const charge2Res = await makeRequest({
      method: 'POST',
      path: '/api/rent-charges',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        tenancyId,
        period: '2026-10-01',
        amountDue: 12000,
        dueDate: '2026-10-05',
      },
    });
    assert(charge2Res.status === 201, 'Create Charge 2 (Oct 2026, ₹12,000) → 201');
    const charge2Id = charge2Res.body.data.charge.id;

    // ─── 4. Check Outstanding Charges Endpoint ──────────────────────────────
    const outRes1 = await makeRequest({
      method: 'GET',
      path: `/api/payments/tenant-outstanding/${tenantId}`,
      cookies: cookiesA,
    });
    assert(outRes1.status === 200, 'GET tenant-outstanding → 200');
    assert(outRes1.body.data.totalOutstanding === 24000, 'Total outstanding is ₹24,000', outRes1.body);
    assert(outRes1.body.data.charges.length === 2, '2 outstanding charges returned');
    assert(outRes1.body.data.charges[0].id === charge1Id, 'FIFO: oldest charge (Sep) is first');

    // ─── 5. Invalid Payment Amounts ─────────────────────────────────────────
    const zeroRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { tenantId, amount: 0, paidAt: '2026-09-06' },
    });
    assert(zeroRes.status === 400, 'Reject zero amount → 400');

    const negRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { tenantId, amount: -1000, paidAt: '2026-09-06' },
    });
    assert(negRes.status === 400, 'Reject negative amount → 400');

    const invalidRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { tenantId, amount: 'abc', paidAt: '2026-09-06' },
    });
    assert(invalidRes.status === 400, 'Reject non-numeric amount → 400');

    const decimalRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { tenantId, amount: 100.555, paidAt: '2026-09-06' },
    });
    assert(decimalRes.status === 400, 'Reject amount with > 2 decimal places → 400');

    // ─── 6. Strict Overpayment Rejection ────────────────────────────────────
    const overpayRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { tenantId, amount: 25000, paidAt: '2026-09-06' },
    });
    assert(overpayRes.status === 400, 'Reject overpayment (₹25,000 > ₹24,000) → 400');
    assert(overpayRes.body.error?.code === 'OVERPAYMENT_REJECTED', 'Error code OVERPAYMENT_REJECTED');

    // ─── 7. Partial Payment via FIFO (Payment 1: ₹5,000) ────────────────────
    const pay1Res = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        tenantId,
        amount: 5000,
        paidAt: '2026-09-06',
        method: 'UPI',
        reference: 'UPI-9876543210',
        notes: 'Partial payment for Sep',
        allocationMode: 'fifo',
      },
    });
    assert(pay1Res.status === 201, 'Record Partial Payment 1 (₹5,000) → 201');
    const payment1 = pay1Res.body.data.payment;
    assert(payment1.amount === 5000, 'Payment 1 amount is ₹5,000');
    assert(payment1.allocations.length === 1, 'Payment 1 allocated to 1 charge');
    assert(payment1.allocations[0].rentChargeId === charge1Id, 'Allocated to Charge 1 (Sep)');
    assert(payment1.allocations[0].amountAllocated === 5000, '₹5,000 allocated to Charge 1');
    assert(payment1.receiptNumber.startsWith('RCP-202609-'), 'Receipt number format RCP-202609-XXXX');

    // Verify Charge 1 outstanding is now 12000 - 5000 = 7000
    const outRes2 = await makeRequest({
      method: 'GET',
      path: `/api/payments/tenant-outstanding/${tenantId}`,
      cookies: cookiesA,
    });
    assert(outRes2.body.data.totalOutstanding === 19000, 'Total outstanding is now ₹19,000');
    assert(outRes2.body.data.charges[0].outstanding === 7000, 'Charge 1 remaining is ₹7,000');
    assert(outRes2.body.data.charges[1].outstanding === 12000, 'Charge 2 remaining is ₹12,000');

    // ─── 8. Multi-Charge Payment via FIFO (Payment 2: ₹10,000) ──────────────
    // Charge 1 needs ₹7,000. Remainder ₹3,000 should go to Charge 2.
    const pay2Res = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        tenantId,
        amount: 10000,
        paidAt: '2026-10-06',
        method: 'Bank Transfer',
        reference: 'NEFT-55443322',
        allocationMode: 'fifo',
      },
    });
    assert(pay2Res.status === 201, 'Record Multi-Charge Payment 2 (₹10,000) → 201');
    const payment2 = pay2Res.body.data.payment;
    assert(payment2.allocations.length === 2, 'Payment 2 allocated across 2 charges');
    const allocC1 = payment2.allocations.find((a) => a.rentChargeId === charge1Id);
    const allocC2 = payment2.allocations.find((a) => a.rentChargeId === charge2Id);
    assert(allocC1 !== undefined, 'First allocation to Charge 1 exists');
    assert(allocC1?.amountAllocated === 7000, '₹7,000 to clear Charge 1');
    assert(allocC2 !== undefined, 'Second allocation to Charge 2 exists');
    assert(allocC2?.amountAllocated === 3000, '₹3,000 allocated to Charge 2');

    // Verify Charge 1 status is 'paid', Charge 2 is 'partial'
    const chargesRes = await makeRequest({
      method: 'GET',
      path: '/api/rent-charges',
      cookies: cookiesA,
    });
    const c1 = chargesRes.body.data.charges.find((c) => c.id === charge1Id);
    const c2 = chargesRes.body.data.charges.find((c) => c.id === charge2Id);
    assert(c1.status === 'paid', 'Charge 1 status is paid');
    assert(c1.outstanding === 0, 'Charge 1 outstanding is ₹0');
    assert(c2.status === 'partial', 'Charge 2 status is partial');
    assert(c2.outstanding === 9000, 'Charge 2 outstanding is ₹9,000 (12000 - 3000)');

    // ─── 9. Manual Allocation Validation ────────────────────────────────────
    // Total remaining is ₹9,000 on Charge 2.
    // Test: empty allocations array
    const emptyAllocRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        tenantId,
        amount: 4000,
        paidAt: '2026-10-10',
        allocationMode: 'manual',
        allocations: [],
      },
    });
    assert(emptyAllocRes.status === 400, 'Manual allocation rejects empty array → 400');

    // Test: sum mismatch (amount 4000, allocation 3000)
    const mismatchRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        tenantId,
        amount: 4000,
        paidAt: '2026-10-10',
        allocationMode: 'manual',
        allocations: [{ rentChargeId: charge2Id, amount: 3000 }],
      },
    });
    assert(mismatchRes.status === 400, 'Manual allocation rejects sum mismatch → 400');

    // Test: overallocating individual charge (trying to allocate ₹10,000 when remaining is ₹9,000)
    const overAllocRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        tenantId,
        amount: 10000,
        paidAt: '2026-10-10',
        allocationMode: 'manual',
        allocations: [{ rentChargeId: charge2Id, amount: 10000 }],
      },
    });
    assert(overAllocRes.status === 400, 'Manual allocation rejects exceeding charge balance → 400');

    // Successful manual allocation: Payment 3 of ₹4,000 to Charge 2
    const pay3Res = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        tenantId,
        amount: 4000,
        paidAt: '2026-10-10',
        method: 'Cash',
        allocationMode: 'manual',
        allocations: [{ rentChargeId: charge2Id, amount: 4000 }],
      },
    });
    assert(pay3Res.status === 201, 'Record Manual Payment 3 (₹4,000) → 201');
    const payment3 = pay3Res.body.data.payment;
    assert(payment3.amount === 4000, 'Payment 3 amount ₹4,000');
    assert(payment3.allocations[0].amountAllocated === 4000, 'Allocated ₹4,000 to Charge 2');

    // Charge 2 remaining is now 9000 - 4000 = 5000
    const outRes3 = await makeRequest({
      method: 'GET',
      path: `/api/payments/tenant-outstanding/${tenantId}`,
      cookies: cookiesA,
    });
    assert(outRes3.body.data.totalOutstanding === 5000, 'Total outstanding is now ₹5,000');

    // ─── 10. Final Payment to Clear Balance ─────────────────────────────────
    const pay4Res = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {
        tenantId,
        amount: 5000,
        paidAt: '2026-10-15',
        method: 'Cheque',
        reference: 'CHQ-123456',
        allocationMode: 'fifo',
      },
    });
    assert(pay4Res.status === 201, 'Record Payment 4 to clear balance (₹5,000) → 201');
    const payment4 = pay4Res.body.data.payment;

    // Outstanding balance is now ₹0
    const outRes4 = await makeRequest({
      method: 'GET',
      path: `/api/payments/tenant-outstanding/${tenantId}`,
      cookies: cookiesA,
    });
    assert(outRes4.body.data.totalOutstanding === 0, 'Total outstanding is now ₹0');
    assert(outRes4.body.data.charges.length === 0, '0 outstanding charges remaining');

    // Attempt payment when outstanding balance is ₹0 → 400 NO_OUTSTANDING_BALANCE
    const zeroBalancePay = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { tenantId, amount: 1000, paidAt: '2026-10-16' },
    });
    assert(zeroBalancePay.status === 400, 'Reject payment when balance is ₹0 → 400');
    assert(zeroBalancePay.body.error?.code === 'NO_OUTSTANDING_BALANCE', 'Code NO_OUTSTANDING_BALANCE');

    // ─── 11. Printable Receipt Generation & Details ─────────────────────────
    const receiptRes = await makeRequest({
      method: 'GET',
      path: `/api/payments/${payment4.id}/receipt`,
      cookies: cookiesA,
    });
    assert(receiptRes.status === 200, 'GET /api/payments/:id/receipt → 200');
    const receipt = receiptRes.body.data.receipt;
    assert(receipt.receiptNumber.startsWith('RCP-202610-'), 'Receipt number formatted correctly');
    assert(receipt.landlord.name === 'Landlord Payments Tester A', 'Landlord name present');
    assert(receipt.tenant.fullName === 'Rahul Sharma', 'Tenant name present');
    assert(receipt.amount === 5000, 'Receipt amount ₹5,000');
    assert(receipt.method === 'Cheque', 'Payment method Cheque');
    assert(receipt.reference === 'CHQ-123456', 'Reference CHQ-123456');
    assert(receipt.status === 'VALID', 'Receipt status VALID');
    assert(receipt.tenantCurrentOutstanding === 0, 'Tenant outstanding balance is ₹0');
    assert(receipt.allocations.length === 1, 'Allocation breakdown present');
    assert(receipt.allocations[0].amountAllocated === 5000, 'Allocation amount ₹5,000');

    // ─── 12. Listing and Filtering Payments ─────────────────────────────────
    const listAllRes = await makeRequest({ method: 'GET', path: '/api/payments', cookies: cookiesA });
    assert(listAllRes.status === 200, 'List all payments → 200');
    assert(listAllRes.body.data.payments.length === 4, 'All 4 payments listed');

    const listTenantRes = await makeRequest({
      method: 'GET',
      path: `/api/payments?tenantId=${tenantId}`,
      cookies: cookiesA,
    });
    assert(listTenantRes.body.data.payments.length === 4, 'Filter by tenantId returns 4 payments');

    const listValidRes = await makeRequest({
      method: 'GET',
      path: '/api/payments?status=valid',
      cookies: cookiesA,
    });
    assert(listValidRes.body.data.payments.length === 4, 'Filter status=valid returns 4 payments');

    // ─── 13. Void Workflow & Audit Trail ────────────────────────────────────
    // Attempt void without reason
    const noReasonRes = await makeRequest({
      method: 'POST',
      path: `/api/payments/${payment4.id}/void`,
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: {},
    });
    assert(noReasonRes.status === 400, 'Void without reason rejected → 400');

    // Attempt void with empty/too short reason
    const shortReasonRes = await makeRequest({
      method: 'POST',
      path: `/api/payments/${payment4.id}/void`,
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { reason: '  no ' },
    });
    assert(shortReasonRes.status === 400, 'Void with short reason rejected → 400');

    // Successful void of Payment 4 (₹5,000 cheque bounced)
    const voidRes = await makeRequest({
      method: 'POST',
      path: `/api/payments/${payment4.id}/void`,
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { reason: 'Tenant cheque bounced at bank' },
    });
    assert(voidRes.status === 200, 'Void payment with valid reason → 200');
    const voidedPayment = voidRes.body.data.payment;
    assert(voidedPayment.isVoided === true, 'Payment marked as voided');
    assert(voidedPayment.voidedAt !== null, 'voidedAt timestamp set');
    assert(voidedPayment.voidReason === 'Tenant cheque bounced at bank', 'voidReason audit trail saved');

    // Verify outstanding balance immediately recalculates (Charge 2 balance restored to ₹5,000)
    const outRes5 = await makeRequest({
      method: 'GET',
      path: `/api/payments/tenant-outstanding/${tenantId}`,
      cookies: cookiesA,
    });
    assert(outRes5.body.data.totalOutstanding === 5000, 'Charge 2 outstanding restored to ₹5,000');
    assert(outRes5.body.data.charges.length === 1, '1 charge outstanding after void');

    // Verify receipt for voided payment shows VOIDED status
    const voidReceiptRes = await makeRequest({
      method: 'GET',
      path: `/api/payments/${payment4.id}/receipt`,
      cookies: cookiesA,
    });
    assert(voidReceiptRes.body.data.receipt.status === 'VOIDED', 'Receipt status is VOIDED');
    assert(voidReceiptRes.body.data.receipt.voidReason === 'Tenant cheque bounced at bank', 'Receipt shows void reason');

    // Attempting to void an already voided payment → 400
    const alreadyVoidRes = await makeRequest({
      method: 'POST',
      path: `/api/payments/${payment4.id}/void`,
      headers: csrfHeadersA,
      cookies: cookiesA,
      body: { reason: 'Trying to void again' },
    });
    assert(alreadyVoidRes.status === 400, 'Void already voided payment → 400');
    assert(alreadyVoidRes.body.error?.code === 'PAYMENT_ALREADY_VOIDED', 'Code PAYMENT_ALREADY_VOIDED');

    // ─── 14. Landlord Isolation ─────────────────────────────────────────────
    const regResB = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: csrfHeaders,
      cookies: [csrfCookie],
      body: {
        name: 'Landlord Payments Tester B',
        email: `payments_b_${ts}@test.com`,
        password: 'Password123!',
        termsAccepted: true,
        privacyPolicyAccepted: true,
      },
    });
    assert(regResB.status === 201, 'Register Landlord B → 201');
    userBId = regResB.body.data.user.id;
    const sessB = parseCookie(regResB.cookies.find((c) => c.startsWith('iktis_session=')));
    const cookiesB = [csrfCookie, sessB];
    const csrfHeadersB = csrfHeaders;

    // Landlord B GET /api/payments → sees 0
    const listB = await makeRequest({ method: 'GET', path: '/api/payments', cookies: cookiesB });
    assert(listB.status === 200, 'Landlord B lists payments → 200');
    assert(listB.body.data.payments.length === 0, 'Landlord B sees 0 payments (isolation)');

    // Landlord B cannot access Landlord A payment
    const getB = await makeRequest({ method: 'GET', path: `/api/payments/${payment1.id}`, cookies: cookiesB });
    assert(getB.status === 404, 'Landlord B cannot access Landlord A payment (404)');

    // Landlord B cannot access Landlord A receipt
    const receiptB = await makeRequest({ method: 'GET', path: `/api/payments/${payment1.id}/receipt`, cookies: cookiesB });
    assert(receiptB.status === 404, 'Landlord B cannot access Landlord A receipt (404)');

    // Landlord B cannot void Landlord A payment
    const voidB = await makeRequest({
      method: 'POST',
      path: `/api/payments/${payment1.id}/void`,
      headers: csrfHeadersB,
      cookies: cookiesB,
      body: { reason: 'Unauthorized void attempt' },
    });
    assert(voidB.status === 404, 'Landlord B cannot void Landlord A payment (404)');

    // Landlord B cannot allocate payment to Landlord A tenant
    const crossPayB = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: csrfHeadersB,
      cookies: cookiesB,
      body: { tenantId, amount: 1000, paidAt: '2026-10-10' },
    });
    assert(crossPayB.status === 404, 'Landlord B cannot record payment for Landlord A tenant (404)');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    // ─── 15. Cleanup ────────────────────────────────────────────────────────
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
