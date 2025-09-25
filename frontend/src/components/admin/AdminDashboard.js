import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import AdminOverview from './AdminOverview';
import ManagersList from './ManagersList';
import EmployeesList from './EmployeesList';
import AttendanceManagement from './AttendanceManagement';
import ReportsSection from './ReportsSection';
// Settings component removed - now using static configuration
import SabarmatiRiverMap from './SabarmatiRiverMap';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const isReadOnly = user?.adminType === 'readonly';
  const isSuperAdmin = user?.adminType === 'super';
  
  console.log('AdminDashboard - User:', user);
  console.log('AdminDashboard - isReadOnly:', isReadOnly);
  console.log('AdminDashboard - isSuperAdmin:', isSuperAdmin);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={isReadOnly ? "attendance" : "dashboard"} replace />} />
        <Route path="dashboard" element={isReadOnly ? <Navigate to="/admin/attendance" replace /> : <AdminOverview />} />
        <Route path="managers" element={isReadOnly ? <Navigate to="/admin/attendance" replace /> : <ManagersList />} />
        <Route path="employees" element={isReadOnly ? <Navigate to="/admin/attendance" replace /> : <EmployeesList />} />
        <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="reports" element={isReadOnly ? <Navigate to="/admin/attendance" replace /> : <ReportsSection />} />
        {/* Settings route removed - now using static configuration */}
        {/* Sabarmati River Map Route */}
        <Route path="sabarmati-river-map" element={isReadOnly ? <Navigate to="/admin/attendance" replace /> : <SabarmatiRiverMap />} />
      </Routes>
    </Layout>
  );
};

export default AdminDashboard;
