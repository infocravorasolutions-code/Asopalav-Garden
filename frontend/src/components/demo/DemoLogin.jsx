import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { demoCredentials } from '../../data/demoData';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Building2, Users, Palette, ArrowRight } from 'lucide-react';

const DemoLogin = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(null);

  const handleDemoLogin = async (credential) => {
    setLoading(credential.email);
    
    try {
      // Simulate API call with demo data
      const mockResponse = {
        success: true,
        data: {
          user: {
            _id: 'demo-user-id',
            name: credential.email.split('@')[0].replace('.', ' '),
            email: credential.email,
            role: 'admin',
            companyId: credential.company._id
          },
          token: 'demo-jwt-token',
          company: credential.company
        }
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call the actual login function
      await login({
        companyCode: credential.companyCode,
        email: credential.email,
        password: credential.password
      });

    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎭 Demo Accounts
          </h1>
          <p className="text-xl text-gray-600">
            Choose a demo company to explore the theme system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {demoCredentials.map((credential, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: credential.company.primaryColor + '20' }}
                  >
                    <Building2 
                      className="w-6 h-6" 
                      style={{ color: credential.company.primaryColor }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{credential.company.name}</CardTitle>
                    <p className="text-sm text-gray-500">{credential.company.industry}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Company Theme Preview */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Theme Colors</h4>
                  <div className="flex space-x-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: credential.company.primaryColor }}
                      title="Primary Color"
                    ></div>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: credential.company.secondaryColor }}
                      title="Secondary Color"
                    ></div>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: credential.company.accentColor }}
                      title="Accent Color"
                    ></div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>Admin: {credential.email.split('@')[0].replace('.', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-gray-400" />
                    <span>Theme: {credential.company.theme.mode}</span>
                  </div>
                </div>

                {/* Company Description */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {credential.company.description}
                </p>

                {/* Login Button */}
                <Button
                  onClick={() => handleDemoLogin(credential)}
                  loading={loading === credential.email}
                  className="w-full"
                  style={{
                    backgroundColor: credential.company.primaryColor,
                    borderColor: credential.company.primaryColor
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {loading === credential.email ? 'Logging in...' : 'Login as Admin'}
                </Button>

                {/* Demo Info */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">
                    <strong>Demo Credentials:</strong><br />
                    Email: {credential.email}<br />
                    Password: admin123
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🚀 How to Use Demo Accounts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">1. Choose a Company</h4>
              <p>Click on any company card to login with that company's theme and branding.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Explore Themes</h4>
              <p>Each company has unique colors, fonts, and branding that will be applied throughout the app.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Test Features</h4>
              <p>Navigate through the admin dashboard to see how the theme system works.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. Switch Companies</h4>
              <p>Logout and try different companies to see how themes change dynamically.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoLogin;
