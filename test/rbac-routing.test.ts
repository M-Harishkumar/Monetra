import test from 'node:test';
import assert from 'node:assert/strict';
import { isRouteAllowedForRole, getAccessibleRoutesForRole, ROUTE_PERMISSIONS } from '../src/utils/rbac.ts';

test('RBAC matrix grants ADMIN full access across all routes', () => {
  for (const route of ROUTE_PERMISSIONS) {
    assert.equal(
      isRouteAllowedForRole(route.path, 'ADMIN'),
      true,
      `ADMIN must have access to ${route.path}`
    );
  }
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

  assert.equal(adminRoutes.length, ROUTE_PERMISSIONS.length);
  assert.ok(staffRoutes.length < adminRoutes.length);
  assert.ok(customerRoutes.length < staffRoutes.length);
  assert.equal(customerRoutes.length, 7);
  assert.equal(staffRoutes.length, 12);
});
