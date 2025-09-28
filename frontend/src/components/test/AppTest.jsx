import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';

const AppTest = () => {
  const { isAuthenticated, user, company } = useAuth();
  const { companyName, primaryColor } = useCompanyTheme();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 App Test Component
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auth Status */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                Authentication Status
              </h2>
              <div className="space-y-2">
                <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
                <p><strong>User:</strong> {user ? user.name || 'Unknown' : 'None'}</p>
                <p><strong>Company:</strong> {company ? company.name || 'Unknown' : 'None'}</p>
              </div>
            </div>

            {/* Theme Status */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-4">
                Theme Status
              </h2>
              <div className="space-y-2">
                <p><strong>Company Name:</strong> {companyName}</p>
                <p><strong>Primary Color:</strong> 
                  <span 
                    className="inline-block w-4 h-4 rounded ml-2"
                    style={{ backgroundColor: primaryColor }}
                  ></span>
                  {primaryColor}
                </p>
              </div>
            </div>

            {/* App Status */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">
                App Status
              </h2>
              <div className="space-y-2">
                <p><strong>React:</strong> ✅ Working</p>
                <p><strong>Contexts:</strong> ✅ Loaded</p>
                <p><strong>Components:</strong> ✅ Rendering</p>
                <p><strong>Styling:</strong> ✅ Applied</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Go to Login
                </button>
                <button 
                  onClick={() => window.location.href = '/admin/dashboard'}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mt-8 bg-gray-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Debug Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                <p><strong>Screen Size:</strong> {window.innerWidth}x{window.innerHeight}</p>
                <p><strong>URL:</strong> {window.location.href}</p>
              </div>
              <div>
                <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
                <p><strong>Theme Applied:</strong> {document.body.className}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppTest;
