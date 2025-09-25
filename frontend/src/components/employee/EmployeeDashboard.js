import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployee } from '../../contexts/EmployeeContext';
import StepInModal from './StepInModal';
import { 
  Clock, 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  Mail, TrendingUp,
  
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { 
    dashboardData, 
    loading, 
    attendanceLoading, 
    fetchDashboardData, 
    handleClockIn, 
    handleClockOut 
  } = useEmployee();
  
  const [showStepInModal, setShowStepInModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleStepInSubmit = async (stepInData) => {
    try {
      const result = await handleClockIn(stepInData);
      
      // Check if the result indicates success
      if (result && result.success) {
        setShowStepInModal(false);
        return { success: true };
      } else {
        // Return the error result to the modal
        return result || { success: false, error: 'Step-in failed' };
      }
    } catch (error) {
      console.error('Error in step-in submit:', error);
      // Return error result instead of throwing
      return { success: false, error: error.message || 'Step-in failed' };
    }
  };

  const handleClockOutClick = async () => {
    try {
      const result = await handleClockOut();
      
      // Check if the result indicates success
      if (result && result.success) {
        // Success - the toast message is already shown by EmployeeContext
        console.log('Clock out successful');
      } else {
        // Error - the toast message is already shown by EmployeeContext
        console.log('Clock out failed:', result);
      }
    } catch (error) {
      console.error('Error in clock out:', error);
      // Error message is already handled by EmployeeContext
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  const { employee, attendance } = dashboardData;
  const todayAttendance = attendance.today;
  const stats = attendance.statistics;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {employee.name}</p>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Attendance */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary-600" />
                  Today's Attendance
                </h2>
                <div className="flex space-x-3">
                  {!todayAttendance?.stepInTime ? (
                    <button
                      onClick={() => setShowStepInModal(true)}
                      disabled={attendanceLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Clock In
                    </button>
                  ) : !todayAttendance?.stepOutTime ? (
                    <button
                      onClick={handleClockOutClick}
                      disabled={attendanceLoading}
                      className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Clock Out
                    </button>
                  ) : (
                    <span className="text-green-600 font-medium flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Day Complete
                    </span>
                  )}
                </div>
              </div>

              {todayAttendance ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Clock In</p>
                    <p className="font-semibold text-gray-900">
                      {todayAttendance.stepInTime 
                        ? new Date(todayAttendance.stepInTime).toLocaleTimeString()
                        : 'Not clocked in'
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Clock Out</p>
                    <p className="font-semibold text-gray-900">
                      {todayAttendance.stepOutTime 
                        ? new Date(todayAttendance.stepOutTime).toLocaleTimeString()
                        : 'Not clocked out'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No attendance record for today</p>
                </div>
              )}
            </div>

            {/* Recent Attendance Records */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                Recent Attendance
              </h2>
              
              {attendance.recentRecords && attendance.recentRecords.length > 0 ? (
                <div className="space-y-3">
                  {attendance.recentRecords.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.stepInTime && new Date(record.stepInTime).toLocaleTimeString()} - 
                            {record.stepOutTime && new Date(record.stepOutTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {record.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : record.status === 'working' ? (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent attendance records</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <User className="h-5 w-5 mr-2 text-primary-600" />
                Employee Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Designation</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {employee.designation?.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {employee.category?.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Shift</p>
                    <p className="font-medium text-gray-900 capitalize">{employee.shift}</p>
                  </div>
                </div>
                
                {employee.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{employee.email}</p>
                    </div>
                  </div>
                )}
                
                {employee.mobile && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Mobile</p>
                      <p className="font-medium text-gray-900">{employee.mobile}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{employee.address}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Attendance Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                My Attendance
              </h2>
            </div>
            
            <div className="p-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Days</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalDays}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Present Days</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.presentDays}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Absent Days</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.absentDays}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.monthPresentDays}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Attendance Records */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-4">Recent Attendance Records</h3>
                
                {attendance.recentRecords && attendance.recentRecords.length > 0 ? (
                  <div className="space-y-3">
                    {attendance.recentRecords.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              {record.stepInTime && new Date(record.stepInTime).toLocaleTimeString()} - 
                              {record.stepOutTime && new Date(record.stepOutTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          {record.status === 'completed' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </span>
                          ) : record.status === 'working' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Working
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Started
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                    <p className="text-gray-600">No attendance records available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step In Modal */}
        <StepInModal
          isOpen={showStepInModal}
          onClose={() => setShowStepInModal(false)}
          onSubmit={handleStepInSubmit}
          loading={attendanceLoading}
        />
    </div>
  );
};

export default EmployeeDashboard;
