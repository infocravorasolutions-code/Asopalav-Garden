import React from 'react';

const DashboardTest = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Sidebar */}
      <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Test Sidebar</h2>
          <div className="space-y-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-blue-800 font-medium">Dashboard</span>
            </div>
            <div className="p-3 hover:bg-gray-100 rounded-lg">
              <span className="text-gray-700">Company Management</span>
            </div>
            <div className="p-3 hover:bg-gray-100 rounded-lg">
              <span className="text-gray-700">User Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Main Content */}
      <div className="ml-80">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Test Dashboard</h1>
          
          {/* Test Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Total Employees</h3>
              <p className="text-3xl font-bold text-blue-600">156</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Active Today</h3>
              <p className="text-3xl font-bold text-green-600">142</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Rate</h3>
              <p className="text-3xl font-bold text-purple-600">91.2%</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Pending Reports</h3>
              <p className="text-3xl font-bold text-orange-600">8</p>
            </div>
          </div>

          {/* Test Content */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">Add Manager</h3>
                <p className="text-sm text-gray-600">Create new manager account</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">Add Employee</h3>
                <p className="text-sm text-gray-600">Create new employee account</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">Company Settings</h3>
                <p className="text-sm text-gray-600">Manage company information</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">Export Data</h3>
                <p className="text-sm text-gray-600">Download reports and data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTest;
