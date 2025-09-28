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
import ManagerDashboard from './components/manager/ManagerDashboard';
import TeamPage from './components/manager/TeamPage';
import CompanyLayout from './components/layout/CompanyLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import Loading from './components/ui/Loading';
import ErrorBoundary from './components/ui/ErrorBoundary';
import AppTest from './components/test/AppTest';
import DemoLogin from './components/demo/DemoLogin';
import UnifiedLogin from './components/auth/UnifiedLogin';
import IndustryLogin from './components/auth/IndustryLogin';
import EnhancedLogin from './components/auth/EnhancedLogin';
import EnhancedEmployeeLogin from './components/auth/EnhancedEmployeeLogin';
import LoginTest from './components/test/LoginTest';
import SimpleLogin from './components/auth/SimpleLogin';
import TailwindTest from './components/test/TailwindTest';
import CSSDebug from './components/test/CSSDebug';
import DashboardTest from './components/test/DashboardTest';
import CSSTest from './components/test/CSSTest';

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
  const { isAuthenticated, loading } = useAuth();
  
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
              element={<UnifiedLogin />}
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
      
      {/* Demo route */}
      <Route path="/demo" element={<DemoLogin />} />
      
      {/* Test routes */}
      <Route path="/test" element={<AppTest />} />
      <Route path="/login-test" element={<LoginTest />} />
      <Route path="/simple-login" element={<SimpleLogin />} />
      <Route path="/tailwind-test" element={<TailwindTest />} />
      <Route path="/css-debug" element={<CSSDebug />} />
      <Route path="/dashboard-test" element={<DashboardTest />} />
      <Route path="/css-test" element={<CSSTest />} />
      
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
              <Toaster position="top-right" />
              <AppRoutes />
            </div>
          </Router>
        </CompanyThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;