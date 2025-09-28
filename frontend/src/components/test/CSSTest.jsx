import React from 'react';

const CSSTest = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CSS Test Component</h1>
        
        {/* Test Tailwind Classes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Test Card 1 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Styling</h3>
            <p className="text-gray-600 mb-4">Testing basic Tailwind classes</p>
            <div className="flex space-x-2">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Primary
              </button>
              <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                Secondary
              </button>
            </div>
          </div>

          {/* Test Card 2 */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg text-white">
            <h3 className="text-lg font-semibold mb-2">Gradient Background</h3>
            <p className="mb-4">Testing gradient backgrounds</p>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-sm">Active Status</span>
            </div>
          </div>

          {/* Test Card 3 */}
          <div className="bg-white p-6 rounded-lg border-2 border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Border Styling</h3>
            <p className="text-gray-600 mb-4">Testing border and spacing</p>
            <div className="space-y-2">
              <div className="bg-green-100 p-2 rounded text-green-800 text-sm">
                Success Message
              </div>
              <div className="bg-red-100 p-2 rounded text-red-800 text-sm">
                Error Message
              </div>
            </div>
          </div>
        </div>

        {/* Test Responsive Design */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Responsive Design Test</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-100 p-4 rounded text-center">
              <div className="text-2xl font-bold text-blue-600">156</div>
              <div className="text-sm text-blue-800">Total Users</div>
            </div>
            <div className="bg-green-100 p-4 rounded text-center">
              <div className="text-2xl font-bold text-green-600">142</div>
              <div className="text-sm text-green-800">Active Today</div>
            </div>
            <div className="bg-purple-100 p-4 rounded text-center">
              <div className="text-2xl font-bold text-purple-600">91.2%</div>
              <div className="text-sm text-purple-800">Success Rate</div>
            </div>
            <div className="bg-orange-100 p-4 rounded text-center">
              <div className="text-2xl font-bold text-orange-600">8</div>
              <div className="text-sm text-orange-800">Pending</div>
            </div>
          </div>
        </div>

        {/* Test Form Elements */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Form Elements Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>
          <div className="mt-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors">
              Submit Form
            </button>
          </div>
        </div>

        {/* Test Company Theme Classes */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Company Theme Test</h3>
          <div className="space-y-4">
            <div className="btn-primary px-4 py-2 rounded inline-block">
              Company Primary Button
            </div>
            <div className="btn-secondary px-4 py-2 rounded inline-block ml-4">
              Company Secondary Button
            </div>
            <div className="btn-accent px-4 py-2 rounded inline-block ml-4">
              Company Accent Button
            </div>
          </div>
          <div className="mt-4">
            <div className="card-company p-4 rounded">
              <div className="card-header p-2 rounded mb-2">
                Company Themed Card
              </div>
              <p className="text-gray-700">This card uses company theme CSS variables.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSSTest;
