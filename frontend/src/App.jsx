import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyThemeProvider } from './contexts/CompanyThemeContext';
import GardenLogin from './components/auth/GardenLogin';
import GardenDashboard from './components/admin/GardenDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import ManagersPage from './components/admin/ManagersPage';
import ManagersPageNew from './components/admin/ManagersPageNew';
import EmployeesPage from './components/admin/EmployeesPage';
import MusterRollReport from './components/admin/MusterRollReport';
import TraditionalMusterRollReport from './components/admin/TraditionalMusterRollReport';
import AttendanceManagement from './components/admin/AttendanceManagement';
import ManagerDashboard from './components/manager/ManagerDashboard';
import TeamPage from './components/manager/TeamPage';
import StepInStepOut from './components/manager/StepInStepOut';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import CompanyLayout from './components/layout/CompanyLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import Loading from './components/ui/Loading';
import ErrorBoundary from './components/ui/ErrorBoundary';
import UnifiedLogin from './components/auth/UnifiedLogin';
import AdminStyleLogin from './components/auth/AdminStyleLogin';
import IndustryLogin from './components/auth/IndustryLogin';
import EnhancedLogin from './components/auth/EnhancedLogin';
import EnhancedEmployeeLogin from './components/auth/EnhancedEmployeeLogin';
import SimpleLogin from './components/auth/SimpleLogin';
import MyAttendance from './components/employee/MyAttendance';
import ForgotPassword from './components/auth/ForgotPassword';

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
          <ProtectedRoute>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
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
        path="/admin/muster-roll"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <MusterRollReport />
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




      {/* Simple Login route */}
      <Route path="/simple-login" element={<SimpleLogin />} />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

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