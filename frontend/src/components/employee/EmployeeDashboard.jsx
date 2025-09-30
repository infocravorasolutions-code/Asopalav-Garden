import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  Navigation,
  Battery,
  Wifi,
  WifiOff,
  Camera,
  RefreshCw
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import StepInModal from './StepInModal';
import StepOutModal from './StepOutModal';
import MyAttendance from './MyAttendance';
import { attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [attendanceStatus, setAttendanceStatus] = useState('');
  console.log(attendanceStatus, 'attendanceStatus')
  const [location, setLocation] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);

  // Modal states
  const [isStepInModalOpen, setIsStepInModalOpen] = useState(false);
  const [isStepOutModalOpen, setIsStepOutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Navigation state (for future use)
  // const [activeTab, setActiveTab] = useState('dashboard');

  // Update time every second
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, []);

  // Fetch current attendance status
  const fetchCurrentAttendanceStatus = useCallback(async () => {
    debugger
    if (!user?._id) return;

    try {
      console.log('🔍 [EmployeeDashboard] Fetching current attendance status for employee:', user._id);
      const response = await attendanceAPI.getEmployeeAttendance(user._id);
      console.log('📊 [EmployeeDashboard] Attendance response:', response);

      if (response?.data?.attendance && Array.isArray(response.data.attendance)) {
        const today = new Date().toDateString();

        // Find today's attendance record
        const todayAttendance = response.data.attendance.find(record => {
          const recordDate = new Date(record.stepIn).toDateString();
          return recordDate === today;
        });

        if (todayAttendance) {
          if (todayAttendance.stepIn && !todayAttendance.stepOut) {
            setAttendanceStatus('checked_in');
            console.log('✅ [EmployeeDashboard] Employee is currently checked in');
          } else if (todayAttendance.stepIn && todayAttendance.stepOut) {
            setAttendanceStatus('checked_out');
            console.log('✅ [EmployeeDashboard] Employee is currently checked out');
          } else {
            setAttendanceStatus('not_checked_in');
            console.log('✅ [EmployeeDashboard] Employee has not checked in today');
          }
        } else {
          setAttendanceStatus('not_checked_in');
          console.log('✅ [EmployeeDashboard] No attendance record for today');
        }
      } else {
        setAttendanceStatus('not_checked_in');
        console.log('✅ [EmployeeDashboard] No attendance data found');
      }
    } catch (error) {
      console.error('❌ [EmployeeDashboard] Error fetching attendance status:', error);
      setAttendanceStatus('not_checked_in');
    }
  }, []);

  // Fetch attendance status on component mount and when user changes
  useEffect(() => {
    if (user?._id) {
      fetchCurrentAttendanceStatus();
    }
  }, [user?._id, fetchCurrentAttendanceStatus]);

  // Auto-refresh attendance status every 30 seconds
  // useEffect(() => {
  //   if (!user?.id) return;

  //   const interval = setInterval(() => {
  //     fetchCurrentAttendanceStatus();
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(interval);
  // }, [user?.id, fetchCurrentAttendanceStatus]);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get battery level if available
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
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

  // Step in function
  const handleStepIn = async (stepInData) => {
    setIsLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add the image file
      if (stepInData.stepInImage) {
        formData.append('stepInImage', stepInData.stepInImage);
      }

      // Add other data
      formData.append('address', stepInData.address || '');
      formData.append('shift', stepInData.shift || 'morning');
      formData.append('status', stepInData.status || 'present');
      formData.append('latitude', stepInData.latitude || '');
      formData.append('longitude', stepInData.longitude || '');
      formData.append('note', stepInData.note || '');

      // For employee step-in, don't send employeeId and companyId as they come from JWT token
      const response = await attendanceAPI.stepIn(formData);

      // setAttendanceStatus('checked_in');
      toast.success('Successfully checked in!');
      console.log('Step in response:', response);
      // Refresh attendance status to ensure UI is up to date
      await fetchCurrentAttendanceStatus();
    } catch (error) {
      console.error('Error during step in:', error);
      toast.error('Failed to check in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step out function
  const handleStepOut = async (stepOutData) => {
    setIsLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add the image file
      if (stepOutData.stepOutImage) {
        formData.append('stepOutImage', stepOutData.stepOutImage);
      }

      // Add other data
      formData.append('address', stepOutData.stepOutLocation || '');
      formData.append('status', stepOutData.status || 'absent');
      formData.append('latitude', stepOutData.coordinates?.latitude || '');
      formData.append('longitude', stepOutData.coordinates?.longitude || '');
      formData.append('note', stepOutData.note || '');

      // For employee step-out, don't send employeeId and companyId as they come from JWT token
      const response = await attendanceAPI.stepOut(formData);

      setAttendanceStatus('checked_out');
      toast.success('Successfully checked out!');
      console.log('Step out response:', response);
      // Refresh attendance status to ensure UI is up to date
      await fetchCurrentAttendanceStatus();
    } catch (error) {
      console.error('Error during step out:', error);
      toast.error('Failed to check out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open step in modal
  const openStepInModal = () => {
    setIsStepInModalOpen(true);
  };

  // Open step out modal
  const openStepOutModal = () => {
    setIsStepOutModalOpen(true);
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'checked_in':
        return 'text-green-600 bg-green-100';
      case 'checked_out':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'checked_in':
        return 'Checked In';
      case 'checked_out':
        return 'Checked Out';
      default:
        return 'Not Checked In';
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="w-full flex flex-col space-y-2 p-2 sm:space-y-3 sm:p-3 lg:p-4">
        <div className="w-full">
          <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 truncate">
            Welcome, {user?.name || 'Employee'}
          </h1>
          <p className="text-xs text-gray-600 mt-1 truncate">
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </p>
        </div>
        <div className="w-full flex flex-col gap-2">
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendanceStatus)}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${attendanceStatus === 'checked_in' ? 'bg-green-500' :
              attendanceStatus === 'checked_out' ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
            {getStatusText(attendanceStatus)}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={fetchCurrentAttendanceStatus}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation min-h-[44px]"
              title="Refresh attendance status"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="flex items-center text-xs text-gray-500">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500 mr-1" />
              )}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="w-full p-2 sm:p-3 lg:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Check In</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {attendanceStatus === 'checked_in' ? 'Done' : 'Ready'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              {attendanceStatus !== 'checked_in' && (
                <Button
                  onClick={openStepInModal}
                  className="w-full mt-4 touch-manipulation min-h-[44px]"
                  disabled={!isOnline}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Step In
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Check Out</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {attendanceStatus === 'checked_out' ? 'Done' : 'Ready'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              {attendanceStatus === 'checked_in' && (
                <Button
                  onClick={openStepOutModal}
                  variant="outline"
                  className="w-full mt-4 touch-manipulation min-h-[44px]"
                  disabled={!isOnline}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Step Out
                </Button>
              )}
            </CardContent>
          </Card>

          {/* <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Location</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {location ? 'Located' : 'Not Located'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <Button
                onClick={getCurrentLocation}
                variant="outline"
                className="w-full mt-4 touch-manipulation min-h-[44px]"
                disabled={!isOnline}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Location
              </Button>
            </CardContent>
          </Card> */}

          {/* <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Battery</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {batteryLevel ? `${batteryLevel}%` : 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-100">
                  <Battery className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Employee Information */}
        <div className="w-full p-2 sm:p-3 lg:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Full Name</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Email Address</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.mobile || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Mobile Number</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.designation || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Designation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Today's Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Time</span>
                  <span className="font-semibold">{formatTime(currentTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="font-semibold truncate">{formatDate(currentTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendanceStatus)}`}>
                    {getStatusText(attendanceStatus)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Connection</span>
                  <span className={`flex items-center ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? (
                      <Wifi className="h-4 w-4 mr-1" />
                    ) : (
                      <WifiOff className="h-4 w-4 mr-1" />
                    )}
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                {location && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Location</span>
                    <span className="font-semibold text-sm truncate">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
        {/* <div className="w-full p-2 sm:p-3 lg:p-4">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">System Online</p>
                  <p className="text-xs text-gray-500">All services operational</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Location Services</p>
                  <p className="text-xs text-gray-500">
                    {location ? 'Location detected' : 'Location not available'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Battery Status</p>
                  <p className="text-xs text-gray-500">
                    {batteryLevel ? `${batteryLevel}% remaining` : 'Battery level not available'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div> */}
      </div>

      {/* Step In Modal */}
      <StepInModal
        isOpen={isStepInModalOpen}
        onClose={() => setIsStepInModalOpen(false)}
        onSubmit={handleStepIn}
        loading={isLoading}
      />

      {/* Step Out Modal */}
      <StepOutModal
        isOpen={isStepOutModalOpen}
        onClose={() => setIsStepOutModalOpen(false)}
        onSubmit={handleStepOut}
        loading={isLoading}
      />
    </div>
  );
};

export default EmployeeDashboard;