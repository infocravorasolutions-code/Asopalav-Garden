import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Clock,
  BarChart3,
  UserPlus,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { showSuccess, showError, showInfo } from '../../utils/toast';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = () => {
  const { user, company } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate()
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch employees under this manager
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);

        // Verify manager has companyId
        if (!user?.companyId) {
          showError('Manager not associated with any company');
          return;
        }

        console.log('Manager Company ID:', user.companyId);
        console.log('Manager Company Name:', company?.name);
        console.log('Auth Token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');

        // Fetch employees from API using the configured API service
        console.log('Making API call to /api/employee/team...');
        const response = await api.get('/api/employee/team');
        const data = response.data;
        console.log('API Response:', data);

        if (data.message === 'success' && data.data) {
          // Transform API data to match our component structure
          const transformedEmployees = data.data.map(emp => ({
            id: emp._id,
            name: emp.name,
            email: emp.email,
            mobile: emp.mobile,
            empCode: emp.empCode,
            position: emp.position,
            companyId: emp.companyId?._id || emp.companyId,
            companyName: emp.companyId?.name || company?.name || 'Unknown Company',
            status: 'not_checked_in', // Default status, will be updated by fetchAttendanceStatus
            stepInTime: null,
            stepOutTime: null,
            location: null,
            batteryLevel: null,
            isOnline: false,
            lastSeen: null
          }));

          // Fetch attendance status for each employee
          await fetchAttendanceStatus(transformedEmployees);

          console.log('Transformed employees:', transformedEmployees);
          console.log('All employees belong to company:', user.companyId);

          setEmployees(transformedEmployees);

          if (transformedEmployees.length === 0) {
            showInfo('No employees found for your company');
          } else {
            showSuccess(`Loaded ${transformedEmployees.length} employees from your company`);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch employees');
        }

      } catch (error) {
        console.error('Error fetching employees:', error);

        // Check if it's an authentication error
        if (error.response?.status === 401) {
          showError('Authentication failed. Please login again.');
          return;
        }

        // Check if it's a network error
        if (error.code === 'NETWORK_ERROR' || error.message.includes('fetch')) {
          showError('Network error. Please check your connection.');
        } else {
          showError(`Failed to fetch employees: ${error.message}`);
        }

        // Fallback to mock data for demonstration
        console.log('Using fallback mock data');
        showInfo('Using demo data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [user?.companyId, company?.name]);

  // Fetch attendance status for employees
  const fetchAttendanceStatus = async (employeesList) => {
    try {
      console.log('Fetching attendance status for employees...');

      // Check attendance status for each employee
      for (const employee of employeesList) {
        try {
          const statusResponse = await api.get(`/api/attendence/status/${employee.id}`);
          console.log(`Attendance status for ${employee.name}:`, statusResponse.data);

          if (statusResponse.data.success && statusResponse.data.attendance) {
            const attendance = statusResponse.data.attendance;
            employee.status = attendance.stepOut ? 'checked_out' : 'checked_in';
            employee.stepInTime = attendance.stepIn ? new Date(attendance.stepIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
            employee.stepOutTime = attendance.stepOut ? new Date(attendance.stepOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
            employee.isOnline = !attendance.stepOut; // Online if not stepped out
            employee.lastSeen = attendance.stepIn ? new Date(attendance.stepIn) : null;
          }
        } catch (statusError) {
          console.log(`No attendance record found for ${employee.name}:`, statusError.message);
          // Keep default status
        }
      }

      setEmployees(employeesList);
      console.log('Updated employees with attendance status:', employeesList);
    } catch (error) {
      console.error('Error fetching attendance status:', error);
      // Continue with default status
      setEmployees(employeesList);
    }
  };

  // Create a separate fetchEmployees function for manual refresh
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);

      // Verify manager has companyId
      if (!user?.companyId) {
        showError('Manager not associated with any company');
        return;
      }

      console.log('Manager Company ID:', user.companyId);
      console.log('Manager Company Name:', company?.name);
      console.log('Auth Token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');

      // Fetch employees from API using the configured API service
      console.log('Making API call to /api/employee/team...');
      const response = await api.get('/api/employee/team');
      const data = response.data;
      console.log('API Response:', data);

      if (data.message === 'success' && data.data) {
        // Transform API data to match our component structure
        const transformedEmployees = data.data.map(emp => ({
          id: emp._id,
          name: emp.name,
          email: emp.email,
          mobile: emp.mobile,
          empCode: emp.empCode,
          position: emp.position,
          companyId: emp.companyId?._id || emp.companyId,
          companyName: emp.companyId?.name || company?.name || 'Unknown Company',
          status: 'not_checked_in', // Default status, will be updated by fetchAttendanceStatus
          stepInTime: null,
          stepOutTime: null,
          location: null,
          batteryLevel: null,
          isOnline: false,
          lastSeen: null
        }));

        // Fetch attendance status for each employee
        await fetchAttendanceStatus(transformedEmployees);

        console.log('Transformed employees:', transformedEmployees);
        console.log('All employees belong to company:', user.companyId);

        setEmployees(transformedEmployees);

        if (transformedEmployees.length === 0) {
          showInfo('No employees found for your company');
        } else {
          showSuccess(`Loaded ${transformedEmployees.length} employees from your company`);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch employees');
      }

    } catch (error) {
      console.error('Error fetching employees:', error);

      // Check if it's an authentication error
      if (error.response?.status === 401) {
        showError('Authentication failed. Please login again.');
        return;
      }

      // Check if it's a network error
      if (error.code === 'NETWORK_ERROR' || error.message.includes('fetch')) {
        showError('Network error. Please check your connection.');
      } else {
        showError(`Failed to fetch employees: ${error.message}`);
      }

      // Fallback to mock data for demonstration
      console.log('Using fallback mock data');
      showInfo('Using demo data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, company?.name]);


  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate stats
  const totalEmployees = employees.length;
  const presentToday = employees.filter(emp => emp.status === 'present').length;
  const absentToday = employees.filter(emp => emp.status === 'absent').length;
  const checkedOut = employees.filter(emp => emp.status === 'checked_out').length;

  const stats = [
    {
      title: 'Team Members',
      value: totalEmployees.toString(),
      change: `+${totalEmployees}`,
      changeType: 'positive',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Present Today',
      value: presentToday.toString(),
      change: `+${presentToday}`,
      changeType: 'positive',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Absent Today',
      value: absentToday.toString(),
      change: `-${absentToday}`,
      changeType: 'negative',
      icon: AlertCircle,
      color: 'red'
    },
    {
      title: 'Checked Out',
      value: checkedOut.toString(),
      change: `+${checkedOut}`,
      changeType: 'neutral',
      icon: Clock,
      color: 'orange'
    }
  ];

  const quickActions = [
    {
      title: 'Add Team Member',
      description: 'Create new team member',
      icon: UserPlus,
      color: 'blue',
      href: '/manager/team'
    },
    {
      title: 'Step In/Step Out',
      description: 'Clock in/out your employees',
      icon: Clock,
      color: 'green',
      href: '/manager/step-in-out'
    },
    {
      title: 'My Team',
      description: 'View and manage team members',
      icon: Users,
      color: 'purple',
      href: '/manager/team'
    }
  ];

  const handleQuickActionClick = (href) => {
    navigate(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Manager Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Managing {totalEmployees} team members
          </p>
          {/* Company Verification */}
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">
                Company: {company?.name || 'Loading...'}
              </span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Company ID: {user?.companyId || 'Not available'}
            </div>
            <div className="text-xs text-blue-600">
              Showing employees from your company only
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <Button
            onClick={fetchEmployees}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={async () => {
              console.log('Refreshing attendance status...');
              try {
                const updatedEmployees = [...employees];
                await fetchAttendanceStatus(updatedEmployees);
                showSuccess('Attendance status refreshed');
              } catch (refreshError) {
                console.error('Refresh error:', refreshError);
                showError('Failed to refresh attendance status');
              }
            }}
            variant="outline"
            className="flex items-center space-x-2 text-sm"
          >
            <span>Refresh Status</span>
          </Button>
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
                    <span className={`text-xs sm:text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 ml-1">today</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                    stat.color === 'red' ? 'bg-red-100' : 'bg-orange-100'
                  }`}>
                  <stat.icon className={`h-6 w-6 ${stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                      stat.color === 'red' ? 'text-red-600' : 'text-orange-600'
                    }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
  );
};

export default ManagerDashboard;