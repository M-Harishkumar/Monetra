import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { DashboardRouter } from './pages/dashboard/DashboardRouter.tsx';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span className="text-xs font-semibold text-slate-400">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span className="text-xs font-semibold text-slate-400">Loading portal...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          {/* Main App Layout guarded by ProtectedRoute */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardRouter />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="billing-engine" element={<BillingEnginePage />} />
            <Route path="revenue-guard" element={<RevenueGuardPage />} />
            <Route path="health-monitor" element={<HealthMonitorPage />} />
            <Route path="renewals" element={<RenewalCenterPage />} />
            <Route path="simulator" element={<SimulatorPage />} />
            <Route path="reconciliation" element={<ReconciliationPage />} />
            <Route path="reports" element={<PortfolioIntelligencePage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="email-logs" element={<EmailLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

