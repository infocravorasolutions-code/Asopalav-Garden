import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import ManagerOverview from './ManagerOverview';
import MyEmployees from './MyEmployees';
import MyAttendance from './MyAttendance';
import MyReports from './MyReports';
import StepInStepOut from './StepInStepOut';

const ManagerDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ManagerOverview />} />
        <Route path="employees" element={<MyEmployees />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="step-in-out" element={<StepInStepOut />} />
        <Route path="reports" element={<MyReports />} />
      </Routes>
    </Layout>
  );
};

export default ManagerDashboard;
