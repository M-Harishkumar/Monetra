import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';

export const DashboardRouter: React.FC = () => {
  const { role } = useAuth();

  if (role === 'STAFF') {
    return <Navigate to="/staff/dashboard" replace />;
  }

  if (role === 'CUSTOMER') {
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
};
