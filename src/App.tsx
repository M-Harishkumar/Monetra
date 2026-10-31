import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { RoleGuard } from './components/common/RoleGuard.tsx';
import { AccessDenied } from './components/common/AccessDenied.tsx';
import { DashboardRouter } from './pages/dashboard/DashboardRouter.tsx';
import { AdminDashboard } from './pages/dashboard/AdminDashboard.tsx';
import { StaffDashboard } from './pages/dashboard/StaffDashboard.tsx';
import { CustomerPortal } from './pages/dashboard/CustomerPortal.tsx';
import { CustomersPage } from './pages/customers/CustomersPage.tsx';
import { ProductsPage } from './pages/products/ProductsPage.tsx';
import { PlansPage } from './pages/plans/PlansPage.tsx';
import { QuotationsPage } from './pages/quotations/QuotationsPage.tsx';
import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage.tsx';
import { InvoicesPage } from './pages/invoices/InvoicesPage.tsx';
import { PaymentsPage } from './pages/payments/PaymentsPage.tsx';
import { BillingEnginePage } from './pages/billing/BillingEnginePage.tsx';
import { RevenueGuardPage } from './pages/revenue-guard/RevenueGuardPage.tsx';
import { HealthMonitorPage } from './pages/health/HealthMonitorPage.tsx';
import { RenewalCenterPage } from './pages/renewals/RenewalCenterPage.tsx';
import { SimulatorPage } from './pages/simulator/SimulatorPage.tsx';
import { ReconciliationPage } from './pages/reconciliation/ReconciliationPage.tsx';
import { PortfolioIntelligencePage } from './pages/reports/PortfolioIntelligencePage.tsx';
import { StaffPage } from './pages/staff/StaffPage.tsx';
import { AuditLogsPage } from './pages/audit/AuditLogsPage.tsx';
import { EmailLogsPage } from './pages/email/EmailLogsPage.tsx';
import { SettingsPage } from './pages/settings/SettingsPage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { AIHubPage } from './pages/ai/AIHubPage.tsx';
import { ProfilePage } from './pages/profile/ProfilePage.tsx';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#14243A] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#16A6A1] border-t-transparent" />
          <span className="text-xs font-semibold text-slate-300">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#14243A] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#16A6A1] border-t-transparent" />
          <span className="text-xs font-semibold text-slate-300">Loading portal...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const targetDashboard =
      user?.role === 'ADMIN'
        ? '/admin/dashboard'
        : user?.role === 'STAFF'
        ? '/staff/dashboard'
        : '/customer/dashboard';
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication routes */}
            <Route
              path="/signin"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/login" element={<Navigate to="/signin" replace />} />

            {/* Main Application Layout guarded by ProtectedRoute and RoleGuards */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Root / intelligently routes to the active role's dedicated dashboard */}
              <Route index element={<DashboardRouter />} />

              {/* Explicit Role-Specific Dashboards */}
              <Route
                path="admin/dashboard"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="staff/dashboard"
                element={
                  <RoleGuard allowedRoles={['STAFF']}>
                    <StaffDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="customer/dashboard"
                element={
                  <RoleGuard allowedRoles={['CUSTOMER']}>
                    <CustomerPortal />
                  </RoleGuard>
                }
              />
              <Route
                path="ai-hub"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <AIHubPage />
                  </RoleGuard>
                }
              />

              {/* Business Management Routes */}
              <Route
                path="customers"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF']}>
                    <CustomersPage />
                  </RoleGuard>
                }
              />
              <Route
                path="products"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <ProductsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="plans"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <PlansPage />
                  </RoleGuard>
                }
              />
              <Route
                path="quotations"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <QuotationsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="subscriptions"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF']}>
                    <SubscriptionsPage />
                  </RoleGuard>
                }
              />

              {/* Financial Operations Routes */}
              <Route
                path="invoices"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <InvoicesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="payments"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <PaymentsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="billing-engine"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <BillingEnginePage />
                  </RoleGuard>
                }
              />
              <Route
                path="reconciliation"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF']}>
                    <ReconciliationPage />
                  </RoleGuard>
                }
              />

              {/* Revenue Intelligence Routes */}
              <Route
                path="revenue-guard"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF']}>
                    <RevenueGuardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="health-monitor"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <HealthMonitorPage />
                  </RoleGuard>
                }
              />
              <Route
                path="renewals"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF']}>
                    <RenewalCenterPage />
                  </RoleGuard>
                }
              />
              <Route
                path="simulator"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <SimulatorPage />
                  </RoleGuard>
                }
              />
              <Route
                path="reports"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <PortfolioIntelligencePage />
                  </RoleGuard>
                }
              />

              {/* System Administration Routes (Admin Only) */}
              <Route
                path="staff"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <StaffPage />
                  </RoleGuard>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <AuditLogsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="email-logs"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <EmailLogsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="settings"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <SettingsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="profile"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <ProfilePage />
                  </RoleGuard>
                }
              />

              {/* Direct Access Denied Fallback */}
              <Route path="access-denied" element={<AccessDenied />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
