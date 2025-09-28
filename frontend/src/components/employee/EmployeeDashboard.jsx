import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Calendar,
  BarChart3,
  Timer,
  TrendingUp,
  User,
  LogIn,
  LogOut,
  History
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';

const EmployeeDashboard = () => {
  const { user, company } = useAuth();
  const { theme } = useCompanyTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    loadDashboardData();
    loadAttendanceHistory();
    checkCurrentStatus();
    getCurrentLocation();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API
      setTimeout(() => {
        setDashboardData({
          totalDays: 22,
          presentDays: 20,
          absentDays: 2,
          lateDays: 3,
          averageHours: 8.2,
          thisMonthHours: 164.5,
          lastCheckIn: '2024-01-15 09:00:00',
          lastCheckOut: '2024-01-15 18:00:00'
        });
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const loadAttendanceHistory = async () => {
    try {
      // Simulate attendance history - replace with actual API
      setTimeout(() => {
        setAttendanceHistory([
          { date: '2024-01-15', checkIn: '09:00', checkOut: '18:00', hours: 8.5, status: 'present', location: 'Office' },
          { date: '2024-01-14', checkIn: '09:15', checkOut: '17:45', hours: 8.5, status: 'present', location: 'Office' },
          { date: '2024-01-13', checkIn: '09:30', checkOut: '18:15', hours: 8.75, status: 'late', location: 'Office' },
          { date: '2024-01-12', checkIn: '08:55', checkOut: '18:05', hours: 9.17, status: 'present', location: 'Office' },
          { date: '2024-01-11', checkIn: null, checkOut: null, hours: 0, status: 'absent', location: 'N/A' }
        ]);
      }, 1000);
    } catch (error) {
      console.error('Error loading attendance history:', error);
    }
  };

  const checkCurrentStatus = async () => {
    try {
      // Check if employee is currently working
      // This would be an actual API call
      setIsWorking(false); // Simulate not working
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleStepIn = async () => {
    try {
      if (!currentLocation) {
        alert('Location access required for attendance. Please enable location services.');
        return;
      }

      // Implement step in functionality
      console.log('Stepping in with location:', currentLocation);
      // Add actual API call here
      setIsWorking(true);
    } catch (error) {
      console.error('Error stepping in:', error);
      alert('Failed to step in. Please try again.');
    }
  };

  const handleStepOut = async () => {
    try {
      if (!currentLocation) {
        alert('Location access required for attendance. Please enable location services.');
        return;
      }

      // Implement step out functionality
      console.log('Stepping out with location:', currentLocation);
      // Add actual API call here
      setIsWorking(false);
    } catch (error) {
      console.error('Error stepping out:', error);
      alert('Failed to step out. Please try again.');
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
      title: 'Present Days',
      value: dashboardData?.presentDays || 0,
      total: dashboardData?.totalDays || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Absent Days',
      value: dashboardData?.absentDays || 0,
      total: dashboardData?.totalDays || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Late Days',
      value: dashboardData?.lateDays || 0,
      total: dashboardData?.totalDays || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Avg Hours/Day',
      value: dashboardData?.averageHours || 0,
      total: 8,
      icon: Timer,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              {company?.name} - Employee Portal
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {currentLocation && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step In/Out Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Attendance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${isWorking ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isWorking ? 'Currently Working' : 'Not Working'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isWorking ? 'You are currently checked in' : 'You are not checked in'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isWorking ? (
                <Button
                  onClick={handleStepIn}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={!currentLocation}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Step In
                </Button>
              ) : (
                <Button
                  onClick={handleStepOut}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  disabled={!currentLocation}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Step Out
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const percentage = stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0;
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
                    {stat.total > 0 && (
                      <p className="text-xs text-gray-500">{percentage}% of total</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>This Month</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Hours</span>
                <span className="text-lg font-bold text-blue-600">{dashboardData?.thisMonthHours || 0}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Average per Day</span>
                <span className="text-lg font-bold text-green-600">{dashboardData?.averageHours || 0}h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${Math.min((dashboardData?.thisMonthHours || 0) / 176 * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">Target: 176 hours (22 days × 8 hours)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Attendance Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {dashboardData?.totalDays > 0 ? Math.round((dashboardData.presentDays / dashboardData.totalDays) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Punctuality</span>
                <span className="text-lg font-bold text-blue-600">
                  {dashboardData?.totalDays > 0 ? Math.round(((dashboardData.totalDays - dashboardData.lateDays) / dashboardData.totalDays) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${dashboardData?.totalDays > 0 ? (dashboardData.presentDays / dashboardData.totalDays) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>Recent Attendance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceHistory.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    record.status === 'present' ? 'bg-green-500' : 
                    record.status === 'late' ? 'bg-yellow-500' : 
                    record.status === 'absent' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{record.date}</h4>
                    <p className="text-sm text-gray-600">{record.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {record.checkIn ? `In: ${record.checkIn}` : 'Not checked in'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {record.checkOut ? `Out: ${record.checkOut}` : 'Still working'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{record.hours}h</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' : 
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 
                      record.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
