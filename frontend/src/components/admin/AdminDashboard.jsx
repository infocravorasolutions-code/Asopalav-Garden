import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  BarChart3,
  FileText,
  TrendingUp,
  UserPlus,
  Building,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // State for dynamic stats
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dynamic stats data
  const fetchStats = async () => {
    try {
      setRefreshing(true);

      // Fetch all data in parallel
      const [employeesResponse, attendanceResponse] = await Promise.all([
        api.get('/api/employee/all'),
        api.get('/api/attendence/')
      ]);

      const employees = employeesResponse.data?.data || employeesResponse.data?.employees || [];
      const attendance = attendanceResponse.data?.attendance || [];

      // Calculate today's date
      const today = new Date().toDateString();

      // Filter today's attendance
      const todayAttendance = attendance.filter(record =>
        new Date(record.stepIn).toDateString() === today
      );

      // Calculate active employees (checked in today)
      const activeToday = todayAttendance.filter(record =>
        record.stepIn && !record.stepOut
      ).length;

      // Calculate attendance rate
      const totalEmployees = employees.length;
      const attendanceRate = totalEmployees > 0 ?
        ((todayAttendance.length / totalEmployees) * 100).toFixed(1) : 0;

      // Calculate pending reports (employees without attendance today)
      const employeesWithAttendance = new Set(todayAttendance.map(record =>
        record.employeeId?._id || record.employeeId
      ));
      const pendingReports = totalEmployees - employeesWithAttendance.size;

      // Update stats with dynamic data
      setStats([
        {
          title: 'Total Employees',
          value: totalEmployees.toString(),
          change: '+12%',
          changeType: 'positive',
          icon: Users,
          color: 'blue'
        },
        {
          title: 'Active Today',
          value: activeToday.toString(),
          change: '+8%',
          changeType: 'positive',
          icon: Clock,
          color: 'green'
        },
        {
          title: 'Attendance Rate',
          value: `${attendanceRate}%`,
          change: '+2.1%',
          changeType: 'positive',
          icon: BarChart3,
          color: 'purple'
        },
        {
          title: 'Pending Reports',
          value: pendingReports.toString(),
          change: '-3',
          changeType: 'negative',
          icon: FileText,
          color: 'orange'
        }
      ]);

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch dashboard statistics');

      // Fallback to default stats
      setStats([
        {
          title: 'Total Employees',
          value: '0',
          change: '+0%',
          changeType: 'positive',
          icon: Users,
          color: 'blue'
        },
        {
          title: 'Active Today',
          value: '0',
          change: '+0%',
          changeType: 'positive',
          icon: Clock,
          color: 'green'
        },
        {
          title: 'Attendance Rate',
          value: '0%',
          change: '+0%',
          changeType: 'positive',
          icon: BarChart3,
          color: 'purple'
        },
        {
          title: 'Pending Reports',
          value: '0',
          change: '0',
          changeType: 'positive',
          icon: FileText,
          color: 'orange'
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickActionClick = (href) => {
    navigate(href);
  };

  const handleRefresh = async () => {
    await fetchStats();
    toast.success('Dashboard data refreshed');
  };


  const quickActions = [
    {
      title: 'Add Manager',
      description: 'Create new manager account',
      icon: UserPlus,
      color: 'blue',
      href: '/admin/managers'
    },
    {
      title: 'Add Employee',
      description: 'Create new employee account',
      icon: Users,
      color: 'green',
      href: '/admin/employees'
    },
    {
      title: 'Attendance Management',
      description: 'Monitor and manage employee attendance',
      icon: Clock,
      color: 'orange',
      href: '/admin/attendance'
    },
    {
      title: 'Muster Roll Report',
      description: 'Generate traditional muster roll reports',
      icon: FileText,
      color: 'blue',
      href: '/admin/traditional-muster-roll'
    },
    {
      title: 'Export Data',
      description: 'Download reports and data',
      icon: Download,
      color: 'orange',
      href: '/admin/export'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage your workforce and monitor attendance</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-xs sm:text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                    stat.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                  }`}>
                  <stat.icon className={`h-6 w-6 ${stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                      stat.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                    }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="hover:shadow-lg cursor-pointer hover:scale-105 transform transition-all duration-200"
              onClick={() => handleQuickActionClick(action.href)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${action.color === 'blue' ? 'bg-blue-100' :
                    action.color === 'green' ? 'bg-green-100' :
                      action.color === 'purple' ? 'bg-purple-100' :
                        'bg-orange-100'
                    }`}>
                    <action.icon className={`h-6 w-6 ${action.color === 'blue' ? 'text-blue-600' :
                      action.color === 'green' ? 'text-green-600' :
                        action.color === 'purple' ? 'text-purple-600' :
                          'text-orange-600'
                      }`} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">John Doe checked in</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">New employee added</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Report generated</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Present Today</span>
                <span className="font-semibold">142/156</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '91%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Late Arrivals</span>
                <span className="font-semibold text-orange-600">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Absent</span>
                <span className="font-semibold text-red-600">14</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;