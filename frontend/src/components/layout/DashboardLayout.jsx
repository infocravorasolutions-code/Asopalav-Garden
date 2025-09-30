import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import { Bell, Settings, LogOut, User } from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { companyName, logoUrl, primaryColor } = useCompanyTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Determine user type from user data
  const getUserType = () => {
    if (!user) return 'admin';

    // Check if user has role property
    if (user.role) {
      if (user.role === 'superadmin' || user.role === 'readonly') {
        return 'admin';
      }
      return user.role;
    }

    // Check if user has userType property
    if (user.userType) {
      return user.userType;
    }

    // Default to admin
    return 'admin';
  };

  const userType = getUserType();
  const userName = user?.name || 'User';

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        userType={userType}
      />

      {/* Mobile Header */}
      <MobileHeader
        onMenuToggle={toggleSidebar}
        userType={userType}
        userName={userName}
      />

      {/* Main Content */}
      <div className="lg:ml-64 transition-all duration-300">
        <div className="min-h-screen bg-gray-50 lg:pt-16">
          {/* Desktop Header */}
          <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200 fixed top-0 right-0 left-64 z-40 h-16">
            <div className="px-4 sm:px-6 py-4 h-full flex items-center">
              <div className="flex items-center justify-between w-full min-w-0">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  {/* Company Logo */}
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={companyName}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: primaryColor + '20' }}
                    >
                      <User
                        className="h-5 w-5"
                        style={{ color: primaryColor }}
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                      {userType === 'admin' ? 'Admin Dashboard' : userType === 'manager' ? 'Manager Dashboard' : 'Employee Dashboard'}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      {companyName} • Welcome back, {userName}
                    </p>
                  </div>
                </div>

                {/* User Info and Actions */}
                <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                  {/* Notifications */}
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative touch-manipulation">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  </button>

                  {/* User Menu */}
                  <div className="relative user-menu">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation min-w-0"
                    >
                      <div className="text-right min-w-0 hidden sm:block">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{userName}</p>
                        <p className="text-xs text-gray-500 capitalize truncate">
                          {userType ? userType : 'No role found'}
                        </p>
                      </div>
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: primaryColor + '20' }}
                      >
                        <span
                          className="text-xs sm:text-sm font-semibold"
                          style={{ color: primaryColor }}
                        >
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 touch-manipulation">
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 touch-manipulation">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 touch-manipulation"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-3 sm:p-4 lg:p-6 xl:p-8 space-y-6 sm:space-y-8">
            <div className="w-full max-w-none sm:max-w-7xl mx-auto space-y-6 sm:space-y-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
