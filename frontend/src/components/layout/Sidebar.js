import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  X,
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  // Settings icon removed - no longer needed
  Building2,
  Clock,
  UserPlus,
  Shield,
  LogIn,
  Waves
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, user }) => {
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'admin' && user?.adminType === 'super';
  const isReadOnlyAdmin = user?.role === 'admin' && user?.adminType === 'readonly';
  const isManager = user?.role === 'manager' || user?.role === 'supervisor';

  const adminMenuItems = isReadOnlyAdmin ? [
    {
      name: 'Attendance',
      icon: Clock,
      path: '/admin/attendance',
    }
  ] : [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
    },
    {
      name: 'Managers',
      icon: Shield,
      path: '/admin/managers',
      show: isSuperAdmin,
    },
    {
      name: 'Employees',
      icon: Users,
      path: '/admin/employees',
    },
    {
      name: 'Attendance',
      icon: Clock,
      path: '/admin/attendance',
    },
    {
      name: 'Reports',
      icon: BarChart3,
      path: '/admin/reports',
    },
    // Sabarmati River Map
    {
      name: 'Sabarmati River Map',
      icon: Waves,
      path: '/admin/sabarmati-river-map',
    },
    // Settings menu item removed - now using static configuration
  ];

  const managerMenuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/manager/dashboard',
    },
    {
      name: 'My Employees',
      icon: Users,
      path: '/manager/employees',
    },
    {
      name: 'Step In/Out',
      icon: LogIn,
      path: '/manager/step-in-out',
    },
    // {
    //   name: 'Attendance',
    //   icon: Clock,
    //   path: '/manager/attendance',
    // },
    // {
    //   name: 'Reports',
    //   icon: BarChart3,
    //   path: '/manager/reports',
    // },
  ];

  const menuItems = isAdmin ? adminMenuItems : managerMenuItems;

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <div className="flex items-center space-x-2">
            <img src="/assets/logo.png" alt="logo" className="h-15 text-primary-600" />
            {/* <span className="text-xl font-bold text-secondary-900">EMS</span> */}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-secondary-600 hover:bg-secondary-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg">
        <div className="flex items-center p-4 border-b border-secondary-200">
          <img src="/assets/logo.png" alt="logo" className="h-15 text-primary-600" />
          {/* <span className="ml-2 text-xl font-bold text-secondary-900">Employee Management</span> */}
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">
                {user?.name}
              </p>
              {/* <p className="text-xs text-secondary-500 capitalize">
                {user?.role} {user?.adminType && `(${user.adminType})`}
                {isReadOnlyAdmin && (
                  <span className="ml-1 text-orange-600 font-medium">• View Only</span>
                )}
              </p> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
