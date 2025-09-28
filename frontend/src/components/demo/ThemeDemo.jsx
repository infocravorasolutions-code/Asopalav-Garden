import React from 'react';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Palette, Building2, Globe, Phone, Mail } from 'lucide-react';

const ThemeDemo = () => {
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Company Theme Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Branding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Company Branding</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={companyName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="h-12 w-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: primaryColor + '20' }}
                    >
                      <Building2 
                        className="h-6 w-6" 
                        style={{ color: primaryColor }}
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-bold" style={{ color: textColor }}>
                      {companyName}
                    </h4>
                    <p className="text-sm" style={{ color: textColor + '80' }}>
                      Company Branding
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Color Palette</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div 
                    className="h-16 w-full rounded-lg mb-2"
                    style={{ backgroundColor: primaryColor }}
                  ></div>
                  <p className="text-sm font-medium">Primary</p>
                  <p className="text-xs text-gray-500">{primaryColor}</p>
                </div>
                <div className="text-center">
                  <div 
                    className="h-16 w-full rounded-lg mb-2"
                    style={{ backgroundColor: secondaryColor }}
                  ></div>
                  <p className="text-sm font-medium">Secondary</p>
                  <p className="text-xs text-gray-500">{secondaryColor}</p>
                </div>
                <div className="text-center">
                  <div 
                    className="h-16 w-full rounded-lg mb-2"
                    style={{ backgroundColor: accentColor }}
                  ></div>
                  <p className="text-sm font-medium">Accent</p>
                  <p className="text-xs text-gray-500">{accentColor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Buttons */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Theme Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <Button 
                style={{ 
                  backgroundColor: primaryColor, 
                  borderColor: primaryColor,
                  color: 'white'
                }}
              >
                Primary Button
              </Button>
              <Button 
                variant="outline"
                style={{ 
                  borderColor: secondaryColor,
                  color: secondaryColor
                }}
              >
                Secondary Button
              </Button>
              <Button 
                style={{ 
                  backgroundColor: accentColor, 
                  borderColor: accentColor,
                  color: 'white'
                }}
              >
                Accent Button
              </Button>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {industry && (
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Industry</p>
                    <p className="font-medium">{industry}</p>
                  </div>
                </div>
              )}
              
              {phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{phone}</p>
                  </div>
                </div>
              )}
              
              {email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{email}</p>
                  </div>
                </div>
              )}
              
              {website && (
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a 
                      href={website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {description && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Company Description</h3>
              <p className="text-gray-700 leading-relaxed">{description}</p>
            </div>
          )}

          {/* Address */}
          {address && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Address</h3>
              <p className="text-gray-700">{address}</p>
            </div>
          )}

          {/* Theme CSS Variables */}
          <div>
            <h3 className="text-lg font-semibold mb-4">CSS Variables</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm text-gray-800">
{`:root {
  --company-primary: ${primaryColor};
  --company-secondary: ${secondaryColor};
  --company-accent: ${accentColor};
  --company-background: ${backgroundColor};
  --company-text: ${textColor};
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeDemo;
