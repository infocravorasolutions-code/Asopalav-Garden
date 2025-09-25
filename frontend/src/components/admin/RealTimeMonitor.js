import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  UserCheck, 
  UserX, 
  Activity,
  Eye,
  RefreshCw,
  Bell,
  TrendingUp,
  TrendingDown,
  Timer,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useAuth } from '../../contexts/AuthContext';

const RealTimeMonitor = () => {
  const { attendanceList, fetchAttendance, isLoading } = useAttendance();
  const { user } = useAuth();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [filterStatus, setFilterStatus] = useState('all'); // all, working, completed, late
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAttendance();
      setLastUpdate(new Date());
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAttendance]);

  // Calculate real-time statistics
  const realTimeStats = useMemo(() => {
    if (!attendanceList || attendanceList.length === 0) {
      return {
        currentlyWorking: 0,
        completedToday: 0,
        lateToday: 0,
        onTimeToday: 0,
        totalToday: 0,
        recentActivity: [],
        workingEmployees: [],
        alerts: []
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Filter today's records
    const todayRecords = attendanceList.filter(record => {
      const recordDate = new Date(record.stepIn);
      return recordDate >= today && recordDate <= endOfToday;
    });

    // Currently working (stepped in but not out)
    const currentlyWorking = todayRecords.filter(record => 
      record.stepIn && !record.stepOut
    );

    // Completed today (both step in and out)
    const completedToday = todayRecords.filter(record => 
      record.stepIn && record.stepOut
    );

    // Late arrivals (assuming standard shift times)
    const shiftTimes = {
      morning: 7,
      evening: 14,
      night: 22
    };

    const lateToday = todayRecords.filter(record => {
      if (!record.stepIn || !record.shift) return false;
      const stepInHour = new Date(record.stepIn).getHours();
      const expectedStart = shiftTimes[record.shift];
      return stepInHour > expectedStart + 0.5; // 30 minutes late
    });

    const onTimeToday = todayRecords.filter(record => {
      if (!record.stepIn || !record.shift) return false;
      const stepInHour = new Date(record.stepIn).getHours();
      const expectedStart = shiftTimes[record.shift];
      return stepInHour <= expectedStart + 0.5; // Within 30 minutes
    });

    // Recent activity (last 10 records)
    const recentActivity = attendanceList
      .sort((a, b) => new Date(b.stepIn) - new Date(a.stepIn))
      .slice(0, 10);

    // Working employees with details
    const workingEmployees = currentlyWorking.map(record => {
      const stepInTime = new Date(record.stepIn);
      const hoursWorked = (new Date() - stepInTime) / (1000 * 60 * 60);
      
      return {
        ...record,
        hoursWorked: Math.round(hoursWorked * 10) / 10,
        isOverdue: hoursWorked > 8 // Assuming 8-hour shifts
      };
    });

    // Generate alerts
    const alerts = [];
    
    // Late arrivals alert
    if (lateToday.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${lateToday.length} employee(s) arrived late today`,
        count: lateToday.length,
        icon: AlertCircle
      });
    }

    // Overdue employees alert
    const overdueEmployees = workingEmployees.filter(emp => emp.isOverdue);
    if (overdueEmployees.length > 0) {
      alerts.push({
        type: 'error',
        message: `${overdueEmployees.length} employee(s) have worked over 8 hours`,
        count: overdueEmployees.length,
        icon: Timer
      });
    }

    // High attendance rate alert
    const attendanceRate = todayRecords.length > 0 ? 
      (todayRecords.filter(r => r.stepIn).length / todayRecords.length) * 100 : 0;
    
    if (attendanceRate < 80 && todayRecords.length > 5) {
      alerts.push({
        type: 'info',
        message: `Low attendance rate: ${Math.round(attendanceRate)}%`,
        count: Math.round(attendanceRate),
        icon: TrendingDown
      });
    }

    return {
      currentlyWorking: currentlyWorking.length,
      completedToday: completedToday.length,
      lateToday: lateToday.length,
      onTimeToday: onTimeToday.length,
      totalToday: todayRecords.length,
      recentActivity,
      workingEmployees,
      alerts,
      attendanceRate: Math.round(attendanceRate)
    };
  }, [attendanceList]);

  // Filter working employees based on search and status
  const filteredWorkingEmployees = useMemo(() => {
    let filtered = realTimeStats.workingEmployees;

    // Apply status filter
    if (filterStatus === 'working') {
      filtered = filtered.filter(emp => !emp.isOverdue);
    } else if (filterStatus === 'overdue') {
      filtered = filtered.filter(emp => emp.isOverdue);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [realTimeStats.workingEmployees, filterStatus, searchTerm]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="card p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-1 text-xs ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : 
               trend < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
              {trend > 0 ? `+${trend}` : trend < 0 ? `${trend}` : '0'} from yesterday
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const AlertCard = ({ alert }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      alert.type === 'error' ? 'bg-red-50 border border-red-200' :
      alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
      'bg-blue-50 border border-blue-200'
    }`}>
      <alert.icon className={`h-5 w-5 ${
        alert.type === 'error' ? 'text-red-600' :
        alert.type === 'warning' ? 'text-yellow-600' :
        'text-blue-600'
      }`} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${
          alert.type === 'error' ? 'text-red-800' :
          alert.type === 'warning' ? 'text-yellow-800' :
          'text-blue-800'
        }`}>
          {alert.message}
        </p>
      </div>
      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
        alert.type === 'error' ? 'bg-red-100 text-red-800' :
        alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
        'bg-blue-100 text-blue-800'
      }`}>
        {alert.count}
      </div>
    </div>
  );

  const WorkingEmployeeCard = ({ employee }) => (
    <div className={`card p-4 transition-all duration-200 ${
      employee.isOverdue ? 'border-l-4 border-l-red-500 bg-red-50' : 'hover:shadow-md'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {employee.employeeId?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900">{employee.employeeId?.name || 'Unknown'}</p>
            <p className="text-sm text-gray-500">{employee.shift || 'N/A'} shift</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">{employee.hoursWorked}h</p>
          <p className="text-xs text-gray-500">
            Since {new Date(employee.stepIn).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
        </div>
      </div>
      {employee.address && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{employee.address}</span>
        </div>
      )}
      {employee.isOverdue && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>Overdue - Consider checking in</span>
        </div>
      )}
    </div>
  );

  const ActivityItem = ({ activity }) => (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        activity.stepOut ? 'bg-green-100' : 'bg-blue-100'
      }`}>
        {activity.stepOut ? (
          <UserX className="h-4 w-4 text-green-600" />
        ) : (
          <UserCheck className="h-4 w-4 text-blue-600" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">
          {activity.employeeId?.name || 'Unknown Employee'}
        </p>
        <p className="text-xs text-gray-500">
          {activity.stepOut ? 'Stepped out' : 'Stepped in'} at{' '}
          {new Date(activity.stepOut || activity.stepIn).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}
        </p>
      </div>
      <div className="text-right">
        <span className={`badge badge-sm ${
          activity.shift === 'morning' ? 'badge-primary' :
          activity.shift === 'evening' ? 'badge-secondary' :
          'badge-accent'
        }`}>
          {activity.shift || 'N/A'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {autoRefresh ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400" />
              )}
              <h2 className="text-xl font-bold text-gray-900">Real-Time Monitor</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Auto-refresh:</label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="toggle toggle-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Interval:</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="select select-sm w-20"
                disabled={!autoRefresh}
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={120}>2m</option>
              </select>
            </div>
            <button
              onClick={() => {
                fetchAttendance();
                setLastUpdate(new Date());
              }}
              className="btn btn-outline btn-sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {realTimeStats.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Live Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {realTimeStats.alerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Real-time Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Currently Working"
          value={realTimeStats.currentlyWorking}
          icon={Activity}
          color="bg-blue-500"
          subtitle="Active employees"
        />
        <StatCard
          title="Completed Today"
          value={realTimeStats.completedToday}
          icon={CheckCircle}
          color="bg-green-500"
          subtitle="Finished shifts"
        />
        <StatCard
          title="Late Arrivals"
          value={realTimeStats.lateToday}
          icon={AlertCircle}
          color="bg-yellow-500"
          subtitle="Today's late comers"
        />
        <StatCard
          title="Attendance Rate"
          value={`${realTimeStats.attendanceRate}%`}
          icon={Users}
          color="bg-purple-500"
          subtitle={`${realTimeStats.onTimeToday} on time`}
        />
      </div>

      {/* Working Employees */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Currently Working ({filteredWorkingEmployees.length})
          </h3>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm pl-10 w-48"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select select-sm"
            >
              <option value="all">All Status</option>
              <option value="working">Working</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {filteredWorkingEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No employees currently working</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkingEmployees.map((employee) => (
              <WorkingEmployeeCard key={employee._id} employee={employee} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-green-600" />
          Recent Activity
        </h3>
        
        {realTimeStats.recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {realTimeStats.recentActivity.map((activity) => (
              <ActivityItem key={activity._id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeMonitor;
