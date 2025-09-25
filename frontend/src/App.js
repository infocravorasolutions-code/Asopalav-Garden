import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import { useOffline } from './hooks/useOffline';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import UpdatePassword from './components/auth/UpdatePassword';
import AdminDashboard from './components/admin/AdminDashboard';
import ManagerDashboard from './components/manager/ManagerDashboard';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import EmployeeLayout from './components/employee/EmployeeLayout';
import OfflinePage from './components/offline/OfflinePage';
import OfflineBanner from './components/offline/OfflineBanner';
import OfflineOverlay from './components/offline/OfflineOverlay';
import './App.css';
import MainContext from './contexts';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  // console.log('🔍 ProtectedRoute DEBUG:', {
  //   isAuthenticated,
  //   userRole: user?.role,
  //   allowedRoles,
  //   user: user
  // });
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = getUserDashboardPath(user);
    return <Navigate to={redirectPath} replace />;
  }
  return children;
};

// Helper function to determine user dashboard path
const getUserDashboardPath = (user) => {
  // Check if user has adminType (admin user)
  if (user?.adminType) {
    return '/admin/dashboard';
  }
  // Check if user has role property
  if (user?.role === 'admin') {
    return '/admin/dashboard';
  }
  // Check if user is employee
  if (user?.role === 'employee') {
    return '/employee/dashboard';
  }
  // Default to manager dashboard for supervisors/managers
  return '/manager/dashboard';
};

// Main App Component
const AppContent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { isOffline } = useOffline();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Show offline page if user is offline and not on login page
  if (isOffline && !isAuthenticated) {
    return <OfflinePage />;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-secondary-50">
        {/* Offline Components for authenticated users */}
        {isAuthenticated && (
          <>
            {/* Choose one of these options: */}
            {/* Option 1: Banner (current) */}
            {/* <OfflineBanner /> */}
            
            {/* Option 2: Full-screen overlay (uncomment to use) */}
            <OfflineOverlay />
          </>
        )}
                 <Routes>
           <Route path="/login" element={
             isAuthenticated ? <Navigate to={getUserDashboardPath(user)} replace /> : <Login />
           } />
           
           <Route path="/forgot-password" element={
             isAuthenticated ? <Navigate to={getUserDashboardPath(user)} replace /> : <ForgotPassword />
           } />
           
           <Route path="/update-password" element={
             isAuthenticated ? <Navigate to={getUserDashboardPath(user)} replace /> : <UpdatePassword />
           } />
           
           <Route path="/dashboard" element={
             <ProtectedRoute>
               <Navigate to={getUserDashboardPath(user)} replace />
             </ProtectedRoute>
           } />
           
           <Route path="/admin/*" element={
             <ProtectedRoute allowedRoles={['admin']}>
               <AdminDashboard />
             </ProtectedRoute>
           } />
           
           <Route path="/manager/*" element={
             <ProtectedRoute allowedRoles={['manager', 'supervisor']}>
               <ManagerDashboard />
             </ProtectedRoute>
           } />
           
           <Route path="/employee/*" element={
             <ProtectedRoute allowedRoles={['employee']}>
               <EmployeeLayout>
                 <Routes>
                   <Route path="dashboard" element={<EmployeeDashboard />} />
                   <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
                 </Routes>
               </EmployeeLayout>
             </ProtectedRoute>
           } />
           
           <Route path="/" element={
             isAuthenticated ? <Navigate to={getUserDashboardPath(user)} replace /> : <Navigate to="/login" replace />
           } />
           
           {/* Add a catch-all route for unknown paths */}
           <Route path="*" element={
             isAuthenticated ? <Navigate to={getUserDashboardPath(user)} replace /> : <Navigate to="/login" replace />
           } />
         </Routes>
      </div>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            duration: 6000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />
    </Router>
  );
};

// Root App Component
const App = () => {
  return (
    <MainContext>
      <AppContent />
    </MainContext>
  );
};

export default App;
