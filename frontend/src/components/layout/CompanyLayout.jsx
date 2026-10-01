import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import {
  Leaf,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Settings,
  LogOut,
  TreePine,
  Sun,
  Droplets
} from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';

const CompanyLayout = ({ children }) => {
  const { user, company, logout } = useAuth();
  const { 
    companyName, 
    logoUrl, 
    primaryColor, 
    secondaryColor, 
    accentColor,
    backgroundColor,
    textColor,
    phone,
    email,
    website,
    industry,
    description,
    address
  } = useCompanyTheme();
  const [isCompanyDetailsOpen, setIsCompanyDetailsOpen] = useState(false);

  if (!company) {
      return (
        <div className="min-h-screen" 
             style={{ 
               background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}05 100%)` 
             }}>
          <div className="bg-white shadow-sm border-b"
               style={{ borderBottomColor: primaryColor + '20' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <div className="p-2 rounded-full mr-3"
                       style={{ backgroundColor: primaryColor + '20' }}>
                    <Leaf className="h-6 w-6" style={{ color: primaryColor }} />
                  </div>
                  <h1 className="text-xl font-semibold" style={{ color: textColor }}>
                    Mahakali Farm & Nursery
                  </h1>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  leftIcon={<LogOut className="h-4 w-4" />}
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: backgroundColor }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b" style={{ borderBottomColor: primaryColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
              {/* Company Logo and Name */}
              <div className="flex items-center">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={companyName}
                    className="h-8 w-8 rounded-full mr-3 object-cover"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: primaryColor + '20' }}
                  >
                    <Leaf
                      className="h-5 w-5"
                      style={{ color: primaryColor }}
                    />
                  </div>
                )}
                <div>
                  <h1
                    className="text-xl font-semibold"
                    style={{ color: textColor }}
                  >
                    {companyName}
                  </h1>
                  <p
                    className="text-sm"
                    style={{ color: textColor + '80' }}
                  >
                    Farm & Nursery Management
                  </p>
                </div>
              </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role || 'Administrator'}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCompanyDetailsOpen(!isCompanyDetailsOpen)}
                rightIcon={isCompanyDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              >
                Company Details
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Company Details Panel */}
      {isCompanyDetailsOpen && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Garden Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: primaryColor }}>
                    <TreePine className="h-5 w-5 mr-2" />
                    Garden Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <Leaf className="h-4 w-4 mr-3" style={{ color: primaryColor }} />
                    <div>
                      <p className="text-sm text-gray-600">Garden Name</p>
                      <p className="font-medium text-gray-900">{companyName}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="h-4 w-4 mr-3" style={{ color: primaryColor }}>#</span>
                    <div>
                      <p className="text-sm text-gray-600">Garden Code</p>
                      <p className="font-medium text-gray-900">{company?.code || 'N/A'}</p>
                    </div>
                  </div>

                  {industry && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-3" style={{ color: primaryColor }} />
                      <div>
                        <p className="text-sm text-gray-600">Garden Type</p>
                        <p className="font-medium text-gray-900">{industry}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: primaryColor }}>
                    <Phone className="h-5 w-5 mr-2" />
                    Garden Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {address && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">{address}</p>
                      </div>
                    </div>
                  )}
                  
                  {phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{email}</p>
                      </div>
                    </div>
                  )}
                  
                  {website && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Website</p>
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-primary-600 hover:text-primary-500"
                        >
                          {company.website}
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Garden Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: primaryColor }}>
                    <Settings className="h-5 w-5 mr-2" />
                    Garden Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <Sun className="h-4 w-4 mr-3" style={{ color: primaryColor }} />
                    <div>
                      <p className="text-sm text-gray-600">Garden Timezone</p>
                      <p className="font-medium text-gray-900">
                        {company.timezone || 'UTC'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-3" style={{ color: primaryColor }} />
                    <div>
                      <p className="text-sm text-gray-600">Garden Team Size</p>
                      <p className="font-medium text-gray-900">
                        {company.employeeCount || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 mr-3" style={{ color: primaryColor }} />
                    <div>
                      <p className="text-sm text-gray-600">Garden Hours</p>
                      <p className="font-medium text-gray-900">
                        {company.workingHours || '7 AM - 5 PM'}
                      </p>
                    </div>
                  </div>
                  
                  {company.established && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Established</p>
                        <p className="font-medium text-gray-900">
                          {new Date(company.established).getFullYear()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
};

export default CompanyLayout;
