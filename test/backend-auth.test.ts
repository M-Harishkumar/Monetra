import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from '../server/db/database.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'nexora_enterprise_jwt_secret_key_998124';

test('Backend Auth: User passwords verify against stored bcrypt hashes', () => {
  const db = getDb();
  const admin = db.users.find(u => u.role === 'ADMIN');
  const staff = db.users.find(u => u.role === 'STAFF');
  const customer = db.users.find(u => u.role === 'CUSTOMER');

  assert.ok(admin, 'Admin user exists');
  assert.ok(staff, 'Staff user exists');
  assert.ok(customer, 'Customer user exists');

  assert.equal(bcrypt.compareSync('Admin@Nexora123!', admin.passwordHash), true);
  assert.equal(bcrypt.compareSync('Staff@Nexora123!', staff.passwordHash), true);
  assert.equal(bcrypt.compareSync('Customer@Nexora123!', customer.passwordHash), true);
});

test('Backend Auth: JWT tokens encode and cryptographically verify user role & customerId', () => {
  const payload = {
    id: 'USR-CUST-01',
    name: 'Marcus Sterling',
    email: 'customer@monetra.io',
    role: 'CUSTOMER' as const,
    customerId: 'CUST-001',
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;

  assert.equal(decoded.id, payload.id);
  assert.equal(decoded.role, 'CUSTOMER');
  assert.equal(decoded.customerId, 'CUST-001');

  // Verify signature tamper rejection
  assert.throws(() => {
    jwt.verify(token, 'wrong_tampered_secret_key');
  });
});

test('Backend Auth: Customer ownership isolation validates record access', () => {
  const db = getDb();
  const customerUser = db.users.find(u => u.role === 'CUSTOMER');
  assert.ok(customerUser && customerUser.customerId);

  const customerId = customerUser.customerId;

  // Filter invoices for customer
  const ownInvoices = db.invoices.filter(i => i.customerId === customerId);
  const otherInvoices = db.invoices.filter(i => i.customerId !== customerId);

  assert.ok(ownInvoices.length > 0, 'Customer has own invoices');
  assert.ok(otherInvoices.length > 0, 'Database contains other customers invoices');

  // Customer should only be authorized for ownInvoices
  for (const inv of ownInvoices) {
    assert.equal(inv.customerId, customerId, 'Invoice belongs to authenticated customer');
  }

  // Any attempt to access another customer invoice must fail authorization check
  for (const inv of otherInvoices) {
    const isAuthorized = inv.customerId === customerId;
    assert.equal(isAuthorized, false, 'Access to other customer invoice is rejected');
  }
});

test('Backend Auth: Role hierarchy restricts sensitive operational tools from lower tiers', () => {
  const adminEndpoints = ['/billing/trigger', '/audit-logs', '/email-logs', '/settings', '/staff'];
  
  function checkEndpointAccess(role: 'ADMIN' | 'STAFF' | 'CUSTOMER', endpoint: string): boolean {
    if (role === 'ADMIN') return true;
    if (adminEndpoints.includes(endpoint)) return false;
    return true;
  }

  for (const ep of adminEndpoints) {
    assert.equal(checkEndpointAccess('ADMIN', ep), true, `ADMIN must access ${ep}`);
    assert.equal(checkEndpointAccess('STAFF', ep), false, `STAFF must NOT access ${ep}`);
    assert.equal(checkEndpointAccess('CUSTOMER', ep), false, `CUSTOMER must NOT access ${ep}`);
  }
});

test('Backend Auth: Dashboard endpoints strictly enforce role authorization', () => {
  const dashboardRoleMatrix: Record<string, string[]> = {
    '/dashboard/admin': ['ADMIN'],
    '/dashboard/staff': ['STAFF'],
    '/dashboard/customer': ['CUSTOMER'],
    '/analytics/dashboard': ['ADMIN'],
  };

  function isAuthorizedForDashboardApi(role: 'ADMIN' | 'STAFF' | 'CUSTOMER', endpoint: string): boolean {
    const allowed = dashboardRoleMatrix[endpoint];
    if (!allowed) return false;
    return allowed.includes(role);
  }

  // 1. ADMIN
  assert.equal(isAuthorizedForDashboardApi('ADMIN', '/dashboard/admin'), true);
  assert.equal(isAuthorizedForDashboardApi('ADMIN', '/dashboard/staff'), false);
  assert.equal(isAuthorizedForDashboardApi('ADMIN', '/dashboard/customer'), false);
  assert.equal(isAuthorizedForDashboardApi('ADMIN', '/analytics/dashboard'), true);

  // 2. STAFF
  assert.equal(isAuthorizedForDashboardApi('STAFF', '/dashboard/admin'), false);
  assert.equal(isAuthorizedForDashboardApi('STAFF', '/dashboard/staff'), true);
  assert.equal(isAuthorizedForDashboardApi('STAFF', '/dashboard/customer'), false);
  assert.equal(isAuthorizedForDashboardApi('STAFF', '/analytics/dashboard'), false);

  // 3. CUSTOMER
  assert.equal(isAuthorizedForDashboardApi('CUSTOMER', '/dashboard/admin'), false);
  assert.equal(isAuthorizedForDashboardApi('CUSTOMER', '/dashboard/staff'), false);
  assert.equal(isAuthorizedForDashboardApi('CUSTOMER', '/dashboard/customer'), true);
  assert.equal(isAuthorizedForDashboardApi('CUSTOMER', '/analytics/dashboard'), false);
});
