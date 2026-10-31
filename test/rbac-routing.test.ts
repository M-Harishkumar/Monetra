import test from 'node:test';
import assert from 'node:assert/strict';
import { isRouteAllowedForRole, getAccessibleRoutesForRole, ROUTE_PERMISSIONS } from '../src/utils/rbac.ts';

test('RBAC matrix enforces strict ADMIN dashboard access and denies staff/customer dashboards', () => {
  // Admin dashboard allowed
  assert.equal(isRouteAllowedForRole('/admin/dashboard', 'ADMIN'), true);
  // Staff and customer dashboards strictly forbidden for Admin
  assert.equal(isRouteAllowedForRole('/staff/dashboard', 'ADMIN'), false);
  assert.equal(isRouteAllowedForRole('/customer/dashboard', 'ADMIN'), false);

  // Administrative modules allowed
  assert.equal(isRouteAllowedForRole('/', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/ai-hub', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/customers', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/products', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/plans', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/quotations', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/subscriptions', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/invoices', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/payments', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/reconciliation', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/billing-engine', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/revenue-guard', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/health-monitor', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/renewals', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/simulator', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/reports', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/staff', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/audit-logs', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/email-logs', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/settings', 'ADMIN'), true);
});

test('RBAC matrix enforces strict STAFF boundaries', () => {
  // Allowed operational routes
  assert.equal(isRouteAllowedForRole('/', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/staff/dashboard', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/ai-hub', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/customers', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/quotations', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/subscriptions', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/invoices', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/payments', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/reconciliation', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/revenue-guard', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/renewals', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/simulator', 'STAFF'), true);

  // Restricted administrative routes
  assert.equal(isRouteAllowedForRole('/admin/dashboard', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/customer/dashboard', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/products', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/plans', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/billing-engine', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/health-monitor', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/reports', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/staff', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/audit-logs', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/email-logs', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/settings', 'STAFF'), false);
});

test('RBAC matrix restricts CUSTOMER to portal routes only', () => {
  // Permitted customer routes
  assert.equal(isRouteAllowedForRole('/', 'CUSTOMER'), true);
  assert.equal(isRouteAllowedForRole('/customer/dashboard', 'CUSTOMER'), true);
  assert.equal(isRouteAllowedForRole('/ai-hub', 'CUSTOMER'), true);
  assert.equal(isRouteAllowedForRole('/invoices', 'CUSTOMER'), true);
  assert.equal(isRouteAllowedForRole('/payments', 'CUSTOMER'), true);
  assert.equal(isRouteAllowedForRole('/quotations', 'CUSTOMER'), true);
  assert.equal(isRouteAllowedForRole('/simulator', 'CUSTOMER'), true);

  // Restricted internal operations & admin routes
  assert.equal(isRouteAllowedForRole('/admin/dashboard', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/staff/dashboard', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/customers', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/products', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/plans', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/subscriptions', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/billing-engine', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/reconciliation', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/revenue-guard', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/health-monitor', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/renewals', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/reports', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/staff', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/audit-logs', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/email-logs', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/settings', 'CUSTOMER'), false);
});

test('getAccessibleRoutesForRole returns filtered routes matching role permissions', () => {
  const adminRoutes = getAccessibleRoutesForRole('ADMIN');
  const staffRoutes = getAccessibleRoutesForRole('STAFF');
  const customerRoutes = getAccessibleRoutesForRole('CUSTOMER');

  assert.equal(adminRoutes.length, ROUTE_PERMISSIONS.length - 2);
  assert.equal(adminRoutes.length, 22);
  assert.ok(staffRoutes.length < adminRoutes.length);
  assert.ok(customerRoutes.length < staffRoutes.length);
  assert.equal(customerRoutes.length, 8);
  assert.equal(staffRoutes.length, 13);
  assert.equal(isRouteAllowedForRole('/profile', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/profile', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/profile', 'CUSTOMER'), true);
});

test('Strict Role-Based Dashboard Routing: Mutual Exclusivity', () => {
  // 1. ADMIN only accesses /admin/dashboard
  assert.equal(isRouteAllowedForRole('/admin/dashboard', 'ADMIN'), true);
  assert.equal(isRouteAllowedForRole('/staff/dashboard', 'ADMIN'), false);
  assert.equal(isRouteAllowedForRole('/customer/dashboard', 'ADMIN'), false);

  // 2. STAFF only accesses /staff/dashboard
  assert.equal(isRouteAllowedForRole('/admin/dashboard', 'STAFF'), false);
  assert.equal(isRouteAllowedForRole('/staff/dashboard', 'STAFF'), true);
  assert.equal(isRouteAllowedForRole('/customer/dashboard', 'STAFF'), false);

  // 3. CUSTOMER only accesses /customer/dashboard
  assert.equal(isRouteAllowedForRole('/admin/dashboard', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/staff/dashboard', 'CUSTOMER'), false);
  assert.equal(isRouteAllowedForRole('/customer/dashboard', 'CUSTOMER'), true);
});
