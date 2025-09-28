import React from 'react';
import { Menu, Bell, User, Building } from 'lucide-react';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';

const MobileHeader = ({ onMenuToggle, userType, userName }) => {
  const { companyName, logoUrl, primaryColor } = useCompanyTheme();
  return (
    <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 h-16 flex items-center">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          
          {/* Company Logo */}
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName}
              className="w-6 h-6 rounded object-cover"
            />
          ) : (
            <div 
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <Building 
                className="h-4 w-4" 
                style={{ color: primaryColor }} 
              />
            </div>
          )}
          
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {companyName || (userType === 'admin' ? 'Admin Portal' : 'Manager Portal')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">Welcome back, {userName}</p>
          </div>
        </div>

        {/* Right side - Notifications and user */}
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: primaryColor + '20' }}
          >
            <span 
              className="text-sm font-semibold"
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
