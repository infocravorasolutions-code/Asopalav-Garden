import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyThemeProvider } from './contexts/CompanyThemeContext';
import AdminDashboard from './components/admin/AdminDashboard';
import ReadOnlyAdminDashboard from './components/admin/ReadOnlyAdminDashboard';
import ManagersPageNew from './components/admin/ManagersPageNew';
import EmployeesPage from './components/admin/EmployeesPage';
import TraditionalMusterRollReport from './components/admin/TraditionalMusterRollReport';
import AttendanceManagement from './components/admin/AttendanceManagement';
import SiteManagement from './components/admin/SiteManagement';
import ManagerDashboard from './components/manager/ManagerDashboard';
import TeamPage from './components/manager/TeamPage';
import StepInStepOut from './components/manager/StepInStepOut';
import ManagerAttendance from './components/manager/ManagerAttendance';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import CompanyLayout from './components/layout/CompanyLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import Loading from './components/ui/Loading';
import ErrorBoundary from './components/ui/ErrorBoundary';
import AdminStyleLogin from './components/auth/AdminStyleLogin';
import EnhancedLogin from './components/auth/EnhancedLogin';
import EnhancedEmployeeLogin from './components/auth/EnhancedEmployeeLogin';
import SimpleLogin from './components/auth/SimpleLogin';
import MyAttendance from './components/employee/MyAttendance';
import ForgotPassword from './components/auth/ForgotPassword';
import SuperAdminLogin from './components/auth/SuperAdminLogin';
import SuperAdminForgotPassword from './components/auth/SuperAdminForgotPassword';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading..." size="lg" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Role-based Route Component
const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed
  const userRole = user?.role || localStorage.getItem('userType');
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading..." size="lg" />
      </div>
    );
  }

  // For login pages, don't redirect based on authentication
  // Let the login component handle the redirect after successful login
  return children;
};

// SuperAdmin Protected Route Component
const SuperAdminProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    const userRole = localStorage.getItem('user_role');

    if (token && userRole === 'superadmin') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading..." size="lg" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/superadmin/login" replace />;
};

const AdminHomeRedirect = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'readonly') {
    return <Navigate to="/admin/attendance" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
};

const AdminDashboardGate = () => {
  const { user } = useAuth();

  if (user?.role === 'readonly') {
    return <Navigate to="/admin/attendance" replace />;
  }

  return (
    <DashboardLayout>
      <AdminDashboard />
    </DashboardLayout>
  );
};

// Main App Routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AdminStyleLogin />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      {/* Enhanced Login Routes */}
      <Route
        path="/admin/login"
        element={
          <PublicRoute>
            <EnhancedLogin />
          </PublicRoute>
        }
      />

      <Route
        path="/employee/login"
        element={
          <PublicRoute>
            <EnhancedEmployeeLogin />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <RoleBasedRoute allowedRoles={['admin', 'readonly']}>
            <AdminDashboardGate />
          </RoleBasedRoute>
        }
      />

      <Route
        path="/admin/managers"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ManagersPageNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EmployeesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />



      <Route
        path="/admin/traditional-muster-roll"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TraditionalMusterRollReport />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AttendanceManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/sites"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <SiteManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ManagerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/team"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TeamPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/step-in-out"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <StepInStepOut />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/attendance"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ManagerAttendance />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EmployeeDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/attendance"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <MyAttendance />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* SuperAdmin Routes */}
      <Route
        path="/superadmin/login"
        element={
          <PublicRoute>
            <SuperAdminLogin />
          </PublicRoute>
        }
      />

      <Route
        path="/superadmin/forgot-password"
        element={
          <PublicRoute>
            <SuperAdminForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/superadmin/dashboard"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminDashboard />
          </SuperAdminProtectedRoute>
        }
      />

      {/* Simple Login route */}
      <Route path="/simple-login" element={<SimpleLogin />} />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<AdminHomeRedirect />} />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CompanyThemeProvider>
          <Router>
            <div className="App">
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
                    iconTheme: {
                      primary: '#4ade80',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              <AppRoutes />
            </div>
          </Router>
        </CompanyThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;