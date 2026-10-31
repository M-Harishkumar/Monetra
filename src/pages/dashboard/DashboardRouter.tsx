import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AdminDashboard } from './AdminDashboard.tsx';
import { StaffDashboard } from './StaffDashboard.tsx';
import { CustomerPortal } from './CustomerPortal.tsx';

export const DashboardRouter: React.FC = () => {
  const { role } = useAuth();

  if (role === 'STAFF') {
    return <StaffDashboard />;
  }

  if (role === 'CUSTOMER') {
    return <CustomerPortal />;
  }

  return <AdminDashboard />;
};
