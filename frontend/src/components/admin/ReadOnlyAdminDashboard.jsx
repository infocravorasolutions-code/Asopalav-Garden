import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  BarChart3,
  FileText,
  TrendingUp,
  Download,
  RefreshCw,
  Loader2,
  Activity,
  Eye,
  Calendar,
  Users
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const ReadOnlyAdminDashboard = () => {
  const navigate = useNavigate();

  // State for dynamic stats
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const companyInfo = JSON.parse(localStorage.getItem('company') || '{}');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch attendance data - request all records
      const attendanceResponse = await api.get('/attendence?limit=0');
      const attendance = attendanceResponse.data.attendance || [];
      setAttendanceData(attendance);

      // Calculate stats
      const totalEmployees = new Set(attendance.map(record => record.employeeId._id || record.employeeId)).size;
      const presentToday = attendance.filter(record => {
        const today = new Date().toDateString();
        const recordDate = new Date(record.stepIn).toDateString();
        return recordDate === today && record.status === 'present';
      }).length;

      const totalHours = attendance.reduce((total, record) => {
        if (record.totalTime) {
          const hours = parseFloat(record.totalTime);
          return total + (isNaN(hours) ? 0 : hours);
        }
        return total;
      }, 0);

      // Get recent activity (last 10 attendance records)
      const recent = attendance
        .sort((a, b) => new Date(b.stepIn) - new Date(a.stepIn))
        .slice(0, 10);

      setRecentActivity(recent);

      // Set stats
      setStats([
        {
          title: 'Total Employees',
          value: totalEmployees,
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          change: '+0%',
          changeType: 'neutral'
        },
        {
          title: 'Present Today',
          value: presentToday,
          icon: Activity,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          change: '+0%',
          changeType: 'positive'
        },
        {
          title: 'Total Hours',
          value: totalHours.toFixed(1),
          icon: Clock,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          change: '+0%',
          changeType: 'neutral'
        },
        {
          title: 'Attendance Records',
          value: attendance.length,
          icon: BarChart3,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          change: '+0%',
          changeType: 'neutral'
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard refreshed');
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Read-Only Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome, {userInfo.name} - {companyInfo.name}
              </p>
              <div className="flex items-center mt-2">
                <Eye className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-600 font-medium">Read-Only Access</span>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions - Read-Only */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/admin/attendance')}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">View Attendance</h3>
                    <p className="text-sm text-gray-600">Monitor employee attendance records</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/admin/reports')}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-50 rounded-full">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Generate Reports</h3>
                    <p className="text-sm text-gray-600">Create attendance and muster roll reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/admin/analytics')}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-50 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">View Analytics</h3>
                    <p className="text-sm text-gray-600">Analyze attendance patterns and trends</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attendance Activity</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Step In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Step Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentActivity.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {record.employeeId?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.employeeId?.empCode || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(record.stepIn)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(record.stepIn)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.stepOut ? formatTime(record.stepOut) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Read-Only Access</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You have read-only access to the attendance system. You can view attendance data,
                  generate reports, and analyze trends, but cannot modify employee data or system settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReadOnlyAdminDashboard;
