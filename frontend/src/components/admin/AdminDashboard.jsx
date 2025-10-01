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
  Loader2,
  UserCog,
  Briefcase,
  Activity,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Get user info and role
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const isReadOnlyAdmin = userInfo.role === 'readonly';

  // State for dynamic stats
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State for shift-wise attendance
  const [shiftData, setShiftData] = useState({
    morningActive: 0,
    eveningActive: 0,
    nightShiftActive: 0,
    morningShiftEmployees: 0,
    eveningShiftEmployees: 0,
    nightShiftEmployees: 0
  });

  // Fetch dynamic stats data
  const fetchStats = async () => {
    try {
      setRefreshing(true);

      // Fetch all data in parallel
      const [employeesResponse, attendanceResponse, managersResponse] = await Promise.all([
        api.get('/api/employee/all'),
        api.get('/api/attendence/'),
        api.get('/api/manager/')
      ]);

      const employees = employeesResponse.data?.data || employeesResponse.data?.employees || [];
      const attendance = attendanceResponse.data?.attendance || [];
      const managers = managersResponse.data?.data || managersResponse.data?.managers || [];

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

      // Calculate shift-wise data
      const morningShiftEmployees = employees.filter(emp =>
        emp.shift === 'Morning Shift (9:00 AM - 5:00 PM)' || emp.shift === 'Morning'
      ).length;

      const eveningShiftEmployees = employees.filter(emp =>
        emp.shift === 'Evening Shift (5:00 PM - 11:00 PM)' || emp.shift === 'Evening'
      ).length;

      const nightShiftEmployees = employees.filter(emp =>
        emp.shift === 'Night Shift (11:00 PM - 7:00 AM)' || emp.shift === 'Night'
      ).length;

      // Get active employees by shift
      const morningActive = todayAttendance.filter(record => {
        const employee = employees.find(emp =>
          (emp._id === record.employeeId?._id) || (emp._id === record.employeeId)
        );
        return employee && (employee.shift === 'Morning Shift (9:00 AM - 5:00 PM)' || employee.shift === 'Morning') && record.stepIn && !record.stepOut;
      }).length;

      const eveningActive = todayAttendance.filter(record => {
        const employee = employees.find(emp =>
          (emp._id === record.employeeId?._id) || (emp._id === record.employeeId)
        );
        return employee && (employee.shift === 'Evening Shift (5:00 PM - 11:00 PM)' || employee.shift === 'Evening') && record.stepIn && !record.stepOut;
      }).length;

      const nightShiftActive = todayAttendance.filter(record => {
        const employee = employees.find(emp =>
          (emp._id === record.employeeId?._id) || (emp._id === record.employeeId)
        );
        return employee && (employee.shift === 'Night Shift (11:00 PM - 7:00 AM)' || employee.shift === 'Night') && record.stepIn && !record.stepOut;
      }).length;

      // Update shift data state
      setShiftData({
        morningActive,
        eveningActive,
        nightShiftActive,
        morningShiftEmployees,
        eveningShiftEmployees,
        nightShiftEmployees
      });

      // Update stats with dynamic data matching reference image
      setStats([
        {
          title: 'Total Employees',
          value: employees.length.toString(),
          change: '+12%',
          changeType: 'positive',
          icon: Users,
          color: 'blue'
        },
        {
          title: 'Total Supervisors',
          value: managers.length.toString(),
          change: '+8%',
          changeType: 'positive',
          icon: UserCog,
          color: 'blue'
        },
        {
          title: 'Working Employees',
          value: activeToday.toString(),
          change: '+2.1%',
          changeType: 'positive',
          icon: Briefcase,
          color: 'blue'
        },
        {
          title: 'Night Shift',
          value: nightShiftActive.toString(),
          change: '+5%',
          changeType: 'positive',
          icon: Activity,
          color: 'blue'
        }
      ]);

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch dashboard statistics');

      // Fallback to default stats
      // setStats([
      //   {
      //     title: 'Total Employees',
      //     value: '0',
      //     change: '+0%',
      //     changeType: 'positive',
      //     icon: Users,
      //     color: 'blue'
      //   },
      //   {
      //     title: 'Active Today',
      //     value: '0',
      //     change: '+0%',
      //     changeType: 'positive',
      //     icon: Clock,
      //     color: 'green'
      //   },
      //   {
      //     title: 'Attendance Rate',
      //     value: '0%',
      //     change: '+0%',
      //     changeType: 'positive',
      //     icon: BarChart3,
      //     color: 'purple'
      //   },
      //   {
      //     title: 'Pending Reports',
      //     value: '0',
      //     change: '0',
      //     changeType: 'positive',
      //     icon: FileText,
      //     color: 'orange'
      //   }
      // ]);
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


  // Define quick actions based on user role
  const quickActions = isReadOnlyAdmin ? [
    {
      title: 'View Attendance',
      description: 'Monitor employee attendance records',
      icon: Clock,
      color: 'orange',
      href: '/admin/attendance'
    },
    {
      title: 'Generate Reports',
      description: 'Create traditional muster roll reports',
      icon: FileText,
      color: 'blue',
      href: '/admin/traditional-muster-roll'
    },
    {
      title: 'Export Data',
      description: 'Download reports and data',
      icon: Download,
      color: 'green',
      href: '/admin/export'
    }
  ] : [
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
      title: 'Report',
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
            {isReadOnlyAdmin ? 'Read-Only Admin Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {isReadOnlyAdmin 
              ? 'View attendance data and generate reports (Read-Only Access)' 
              : 'Manage your workforce and monitor attendance'
            }
          </p>
          {isReadOnlyAdmin && (
            <div className="flex items-center mt-2">
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                Read-Only Access
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-2 sm:px-4 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Refreshing...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid - Matching Reference Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shift-wise Attendance Section */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
          Shift-wise Attendance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Morning Shift Card */}
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Morning</p>
                  <p className="text-3xl font-bold text-blue-600 mb-2">{shiftData.morningActive}</p>
                  <p className="text-xs text-gray-500">of {shiftData.morningShiftEmployees} employees</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 flex-shrink-0">
                  <Sun className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evening Shift Card */}
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Evening</p>
                  <p className="text-3xl font-bold text-blue-600 mb-2">{shiftData.eveningActive}</p>
                  <p className="text-xs text-gray-500">of {shiftData.eveningShiftEmployees} employees</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 flex-shrink-0">
                  <Moon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Night Shift Card */}
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Night</p>
                  <p className="text-3xl font-bold text-blue-600 mb-2">{shiftData.nightShiftActive}</p>
                  <p className="text-xs text-gray-500">of {shiftData.nightShiftEmployees} employees</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 flex-shrink-0">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="hover:shadow-lg cursor-pointer hover:scale-105 transform transition-all duration-200 touch-manipulation min-h-[80px] sm:min-h-[100px]"
              onClick={() => handleQuickActionClick(action.href)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${action.color === 'blue' ? 'bg-blue-100' :
                    action.color === 'green' ? 'bg-green-100' :
                      action.color === 'purple' ? 'bg-purple-100' :
                        'bg-orange-100'
                    }`}>
                    <action.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${action.color === 'blue' ? 'text-blue-600' :
                      action.color === 'green' ? 'text-green-600' :
                        action.color === 'purple' ? 'text-purple-600' :
                          'text-orange-600'
                      }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;