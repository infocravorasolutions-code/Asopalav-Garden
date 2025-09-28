import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar,
  Building2,
  Palette,
  Download,
  FileText,
  Filter,
  Eye,
  EyeOff,
  BarChart3,
  UserPlus,
  Settings
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import { exportAPI } from '../../services/api';

const EnhancedAdminDashboard = () => {
  const { user, company } = useAuth();
  const { theme } = useCompanyTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    employeeId: '',
    managerId: ''
  });

  // Check if user is readonly admin
  const isReadOnlyAdmin = user?.role === 'readonly';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API
      setTimeout(() => {
        setDashboardData({
          totalEmployees: 156,
          presentToday: 142,
          absentToday: 14,
          lateToday: 8,
          totalAttendance: 98.5,
          recentActivity: [
            { id: 1, employee: 'John Doe', action: 'Clock In', time: '09:15 AM', status: 'on-time' },
            { id: 2, employee: 'Jane Smith', action: 'Clock Out', time: '06:30 PM', status: 'on-time' },
            { id: 3, employee: 'Mike Johnson', action: 'Clock In', time: '09:45 AM', status: 'late' },
            { id: 4, employee: 'Sarah Wilson', action: 'Clock In', time: '09:00 AM', status: 'on-time' },
          ]
        });
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      const exportData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        employeeId: filters.employeeId,
        managerId: filters.managerId,
        companyId: user?.companyId
      };

      if (format === 'excel') {
        await exportAPI.exportAttendanceToExcel(exportData);
      } else if (format === 'pdf') {
        await exportAPI.exportAttendanceToPDF(exportData);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportEmployees = async () => {
    setExportLoading(true);
    try {
      await exportAPI.exportEmployeesToExcel({ companyId: user?.companyId });
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Loading dashboard..." size="lg" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Employees',
      value: dashboardData?.totalEmployees || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Present Today',
      value: dashboardData?.presentToday || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Absent Today',
      value: dashboardData?.absentToday || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Late Today',
      value: dashboardData?.lateToday || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section with ReadOnly Indicator */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              {company?.name} - Admin Dashboard
              {isReadOnlyAdmin && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <EyeOff className="w-3 h-3 mr-1" />
                  Read-Only Mode
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {!isReadOnlyAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  disabled={exportLoading}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Excel</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={exportLoading}
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF</span>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportEmployees}
              disabled={exportLoading || isReadOnlyAdmin}
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Export Employees</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && !isReadOnlyAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Export Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={filters.employeeId}
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager ID
                </label>
                <input
                  type="text"
                  value={filters.managerId}
                  onChange={(e) => setFilters({ ...filters, managerId: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`${stat.borderColor} border-2`}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ReadOnly Admin Notice */}
      {isReadOnlyAdmin && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Read-Only Access</h3>
                <p className="text-yellow-700">
                  You have read-only access to the system. You can view reports and data but cannot make changes or export data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Hidden for ReadOnly Admins */}
      {!isReadOnlyAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Employees</h3>
                  <p className="text-gray-600">Add, edit, or remove employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Managers</h3>
                  <p className="text-gray-600">Create and manage manager accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reports & Analytics</h3>
                  <p className="text-gray-600">View detailed reports and analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.recentActivity?.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'on-time' ? 'bg-green-500' : 
                    activity.status === 'late' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <span className="font-medium text-gray-900">{activity.employee}</span>
                  <span className="text-gray-600">{activity.action}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{activity.time}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activity.status === 'on-time' ? 'bg-green-100 text-green-800' : 
                    activity.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAdminDashboard;
