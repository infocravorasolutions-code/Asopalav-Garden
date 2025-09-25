import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from '../admin/AdminDashboard';
import ManagerDashboard from '../manager/ManagerDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Route to appropriate dashboard based on user role
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  } else if (user?.role === 'manager' || user?.role === 'supervisor') {
    return <ManagerDashboard />;
  }

  // Fallback for unknown roles
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-secondary-900 mb-4">Access Denied</h1>
        <p className="text-secondary-600">You don't have permission to access this dashboard.</p>
      </div>
    </div>
  );
};

export default Dashboard;
