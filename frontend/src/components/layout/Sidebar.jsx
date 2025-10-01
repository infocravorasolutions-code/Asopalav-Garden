import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  User,
  UserPlus,
  Clock,
  Calendar,
  MapPin,
  BarChart3,
  FileText,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  Building,
  UserCheck,
  TrendingUp,
  Shield,
  UserCog
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import CompanyLogo from '../ui/CompanyLogo';

const Sidebar = ({ isOpen, onToggle, userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { companyName, logoUrl, primaryColor, companyCode } = useCompanyTheme();
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Navigation items based on user type
  const getNavigationItems = () => {
    if (userType === 'admin') {
      // Check if admin is readonly
      const isReadonlyAdmin = user?.role === 'readonly';

      if (isReadonlyAdmin) {
        // Readonly admin can only see attendance menu + logout
        return [
          {
            id: 'attendance',
            label: 'Attendance',
            icon: Clock,
            path: '/admin/attendance',
            color: 'orange'
          },
          {
            id: 'logout',
            label: 'Logout',
            icon: LogOut,
            path: '/logout',
            color: 'red',
            isLogout: true
          }
        ];
      } else {
        // Full admin can see all menus + logout
        return [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            path: '/admin/dashboard',
            color: 'blue'
          },
          {
            id: 'managers',
            label: 'Managers',
            icon: UserCog,
            path: '/admin/managers',
            color: 'purple'
          },
          {
            id: 'employees',
            label: 'Employees',
            icon: UserCheck,
            path: '/admin/employees',
            color: 'green'
          },
          {
            id: 'attendance',
            label: 'Attendance',
            icon: Clock,
            path: '/admin/attendance',
            color: 'orange'
          },
          {
            id: 'Report',
            label: 'Report',
            icon: FileText,
            path: '/admin/traditional-muster-roll',
            color: 'indigo'
          },
          {
            id: 'logout',
            label: 'Logout',
            icon: LogOut,
            path: '/logout',
            color: 'red',
            isLogout: true
          }
        ];
      }
    } else if (userType === 'manager') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          path: '/manager/dashboard',
          color: 'blue'
        },
        {
          id: 'my-team',
          label: 'My Team',
          icon: UserCheck,
          path: '/manager/team',
          color: 'purple'
        },
        {
          id: 'step-in-out',
          label: 'Step In/Step Out',
          icon: Clock,
          path: '/manager/step-in-out',
          color: 'green'
        },
        {
          id: 'logout',
          label: 'Logout',
          icon: LogOut,
          path: '/logout',
          color: 'red',
          isLogout: true
        }
      ];
    } else if (userType === 'employee') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          path: '/employee/dashboard',
          color: 'blue'
        },
        {
          id: 'attendance',
          label: 'My Attendance',
          icon: Clock,
          path: '/employee/attendance',
          color: 'green'
        },
        {
          id: 'logout',
          label: 'Logout',
          icon: LogOut,
          path: '/logout',
          color: 'red',
          isLogout: true
        }
      ];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  // Removed dropdown functionality

  const handleNavigation = (path, isLogout = false) => {
    if (isLogout) {
      handleLogout();
    } else {
      navigate(path);
      if (isMobile) {
        onToggle();
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const renderMenuItem = (item) => {
    const isItemActive = isActive(item.path);
    const isLogoutItem = item.isLogout;

    return (
      <button
        key={item.id}
        onClick={() => handleNavigation(item.path, isLogoutItem)}
        className={`w-full flex items-center px-4 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 group min-w-0 ${isItemActive
          ? (item.color === 'blue' ? 'bg-blue-500/20 text-blue-600 border-l-4 border-blue-500' :
            item.color === 'green' ? 'bg-green-500/20 text-green-600 border-l-4 border-green-500' :
              item.color === 'purple' ? 'bg-purple-500/20 text-purple-600 border-l-4 border-purple-500' :
                item.color === 'orange' ? 'bg-orange-500/20 text-orange-600 border-l-4 border-orange-500' :
                  item.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-600 border-l-4 border-indigo-500' :
                    item.color === 'red' ? 'bg-red-500/20 text-red-600 border-l-4 border-red-500' :
                      'bg-gray-500/20 text-gray-600 border-l-4 border-gray-500')
          : isLogoutItem
            ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">{item.label}</span>
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:h-screen
        w-64 lg:w-64 overflow-hidden
      `}>
        {/* Header - Logo Only */}
        <div className="flex items-center justify-center p-6 border-b border-gray-200">
          <div className="w-full">
            <CompanyLogo
              companyCode={companyCode}
              fallbackLogoUrl={logoUrl}
              size="2xl"
              className="w-full h-auto"
              noContainer={true}
              style={{
                width: '100%',
                height: 'auto',
                maxWidth: 'none',
                maxHeight: 'none'
              }}
            />
            {/* Readonly Admin Indicator */}
            {userType === 'admin' && user?.role === 'readonly' && (
              <div className="mt-3 text-center">
                {/* <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Read-Only Access
                </span> */}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navigationItems.map(item => renderMenuItem(item))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
