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

const Sidebar = ({ isOpen, onToggle, userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { companyName, logoUrl, primaryColor } = useCompanyTheme();
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
          id: 'muster-roll',
          label: 'Muster Roll Report',
          icon: FileText,
          path: '/admin/traditional-muster-roll',
          color: 'indigo'
        },

      ];
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
        }
      ];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  // Removed dropdown functionality

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onToggle();
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

    return (
      <button
        key={item.id}
        onClick={() => handleNavigation(item.path)}
        className={`w-full flex items-center px-4 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 group min-w-0 ${isItemActive
          ? (item.color === 'blue' ? 'bg-blue-500/20 text-blue-600 border-l-4 border-blue-500' :
            item.color === 'green' ? 'bg-green-500/20 text-green-600 border-l-4 border-green-500' :
              item.color === 'purple' ? 'bg-purple-500/20 text-purple-600 border-l-4 border-purple-500' :
                item.color === 'orange' ? 'bg-orange-500/20 text-orange-600 border-l-4 border-orange-500' :
                  item.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-600 border-l-4 border-indigo-500' :
                    'bg-gray-500/20 text-gray-600 border-l-4 border-gray-500')
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: primaryColor + '20' }}
              >
                <Building
                  className="h-6 w-6"
                  style={{ color: primaryColor }}
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {companyName || (userType === 'admin' ? 'Admin Portal' : 'Manager Portal')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {userType === 'admin' ? 'Administrator' : 'Manager'} Portal
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className='flex flex-col justify-between items-between
'>
          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {navigationItems.map(item => renderMenuItem(item))}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-0"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
