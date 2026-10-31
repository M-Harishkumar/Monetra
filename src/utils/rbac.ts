import { UserRole } from '../types.ts';

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  label: string;
  category: 'OVERVIEW' | 'BUSINESS' | 'FINANCIAL' | 'INTELLIGENCE' | 'ADMINISTRATION';
}

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: '/', allowedRoles: ['ADMIN', 'STAFF', 'CUSTOMER'], label: 'Dashboard Router', category: 'OVERVIEW' },
  { path: '/admin/dashboard', allowedRoles: ['ADMIN'], label: 'Admin Dashboard', category: 'OVERVIEW' },
  { path: '/staff/dashboard', allowedRoles: ['ADMIN', 'STAFF'], label: 'Staff Dashboard', category: 'OVERVIEW' },
  { path: '/customer/dashboard', allowedRoles: ['ADMIN', 'CUSTOMER'], label: 'Customer Portal', category: 'OVERVIEW' },
  { path: '/ai-hub', allowedRoles: ['ADMIN', 'STAFF', 'CUSTOMER'], label: 'AI Intelligence Hub', category: 'INTELLIGENCE' },
  { path: '/customers', allowedRoles: ['ADMIN', 'STAFF'], label: 'Customers', category: 'BUSINESS' },
  { path: '/products', allowedRoles: ['ADMIN'], label: 'Products & Variants', category: 'BUSINESS' },
  { path: '/plans', allowedRoles: ['ADMIN'], label: 'Subscription Plans', category: 'BUSINESS' },
  { path: '/quotations', allowedRoles: ['ADMIN', 'STAFF', 'CUSTOMER'], label: 'Quotations', category: 'BUSINESS' },
  { path: '/subscriptions', allowedRoles: ['ADMIN', 'STAFF'], label: 'Subscriptions', category: 'BUSINESS' },
  { path: '/invoices', allowedRoles: ['ADMIN', 'STAFF', 'CUSTOMER'], label: 'Invoices', category: 'FINANCIAL' },
  { path: '/payments', allowedRoles: ['ADMIN', 'STAFF', 'CUSTOMER'], label: 'Payments & Ledger', category: 'FINANCIAL' },
  { path: '/reconciliation', allowedRoles: ['ADMIN', 'STAFF'], label: 'Reconciliation', category: 'FINANCIAL' },
  { path: '/billing-engine', allowedRoles: ['ADMIN'], label: 'Recurring Billing Engine', category: 'FINANCIAL' },
  { path: '/revenue-guard', allowedRoles: ['ADMIN', 'STAFF'], label: 'Revenue Guard', category: 'INTELLIGENCE' },
  { path: '/health-monitor', allowedRoles: ['ADMIN'], label: 'Subscription Health', category: 'INTELLIGENCE' },
  { path: '/renewals', allowedRoles: ['ADMIN', 'STAFF'], label: 'Renewal Center', category: 'INTELLIGENCE' },
  { path: '/simulator', allowedRoles: ['ADMIN', 'STAFF', 'CUSTOMER'], label: 'Revenue Simulator', category: 'INTELLIGENCE' },
  { path: '/reports', allowedRoles: ['ADMIN'], label: 'Portfolio Intelligence', category: 'INTELLIGENCE' },
  { path: '/staff', allowedRoles: ['ADMIN'], label: 'Staff Management', category: 'ADMINISTRATION' },
  { path: '/audit-logs', allowedRoles: ['ADMIN'], label: 'Audit Logs', category: 'ADMINISTRATION' },
  { path: '/email-logs', allowedRoles: ['ADMIN'], label: 'Email Logs', category: 'ADMINISTRATION' },
  { path: '/settings', allowedRoles: ['ADMIN'], label: 'System Settings', category: 'ADMINISTRATION' },
];

/**
 * Checks whether a given role is allowed to access a specific route path.
 */
export function isRouteAllowedForRole(path: string, role: UserRole): boolean {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const route = ROUTE_PERMISSIONS.find((r) => r.path === normalizedPath);
  if (!route) {
    return false;
  }
  return route.allowedRoles.includes(role);
}

/**
 * Returns all accessible routes for a given user role.
 */
export function getAccessibleRoutesForRole(role: UserRole): RoutePermission[] {
  return ROUTE_PERMISSIONS.filter((r) => r.allowedRoles.includes(role));
}
