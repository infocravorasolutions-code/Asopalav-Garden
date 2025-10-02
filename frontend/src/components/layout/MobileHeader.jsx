import React from 'react';
import { Menu, Bell, User, Building } from 'lucide-react';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';

const MobileHeader = ({ onMenuToggle, userType, userName }) => {
  const { companyName, logoUrl, primaryColor } = useCompanyTheme();
  return (
    <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 py-3 h-16 flex items-center">
      <div className="flex items-center justify-between w-full min-w-0">
        {/* Left side - Menu button and title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation flex-shrink-0"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </button>
          
          {/* Company Logo */}
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div 
              className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <Building 
                className="h-3 w-3 sm:h-4 sm:w-4" 
                style={{ color: primaryColor }} 
              />
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
              {companyName || (userType === 'admin' ? 'Admin Portal' : 'Manager Portal')}
            </h1>
            <p className="text-xs text-gray-500 truncate">Welcome back, {userName}</p>
          </div>
        </div>

        {/* Right side - Notifications and user */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors relative touch-manipulation">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 sm:h-3 sm:w-3 bg-red-500 rounded-full"></span>
          </button>
          <div 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primaryColor + '20' }}
          >
            <span 
              className="text-xs sm:text-sm font-semibold"
              style={{ color: primaryColor }}
            >
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
