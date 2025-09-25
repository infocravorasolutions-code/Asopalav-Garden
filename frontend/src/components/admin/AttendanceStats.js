import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Timer,
  UserCheck,
  UserX,
  Clock3,
  Clock4,
  Clock5,
  Target,
  Award,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAttendance } from '../../contexts/AttendanceContext';

const AttendanceStats = ({ attendanceData = [], isLoading = false }) => {
  const [timeRange, setTimeRange] = useState('week'); // week, month, quarter, year
  const [selectedShift, setSelectedShift] = useState('all'); // all, morning, evening, night

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    if (!attendanceData || attendanceData.length === 0) {
      return {
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        averageHours: 0,
        totalHours: 0,
        onTimeCount: 0,
        lateCount: 0,
        earlyLeaveCount: 0,
        shiftStats: { morning: 0, evening: 0, night: 0 },
        locationStats: {},
        dailyStats: {},
        weeklyStats: {},
        monthlyStats: {},
        topPerformers: [],
        attendanceTrend: [],
        punctualityRate: 0,
        attendanceRate: 0,
        averageWorkDuration: 0,
        overtimeHours: 0,
        locationDistribution: [],
        shiftDistribution: [],
        timeDistribution: []
      };
    }

    const now = new Date();
    const filteredData = attendanceData.filter(record => {
      const recordDate = new Date(record.stepIn);
      const isInTimeRange = timeRange === 'week' ? 
        recordDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) :
        timeRange === 'month' ? 
        recordDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) :
        timeRange === 'quarter' ? 
        recordDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) :
        true; // year or all

      const isInShift = selectedShift === 'all' || record.shift === selectedShift;
      return isInTimeRange && isInShift;
    });

    // Basic counts
    const totalRecords = filteredData.length;
    const presentCount = filteredData.filter(record => record.stepIn).length;
    const absentCount = totalRecords - presentCount;

    // Time calculations
    const totalMinutes = filteredData.reduce((sum, record) => sum + (record.totalTime || 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    const averageHours = totalRecords > 0 ? Math.round(totalMinutes / totalRecords / 60 * 10) / 10 : 0;

    // Shift statistics
    const shiftStats = filteredData.reduce((acc, record) => {
      const shift = record.shift || 'unknown';
      acc[shift] = (acc[shift] || 0) + 1;
      return acc;
    }, {});

    // Location statistics
    const locationStats = filteredData.reduce((acc, record) => {
      const location = record.address || 'Unknown Location';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    // Punctuality analysis (assuming standard shift times)
    const shiftTimes = {
      morning: { start: 7, end: 15 },
      evening: { start: 14, end: 22 },
      night: { start: 22, end: 7 }
    };

    let onTimeCount = 0;
    let lateCount = 0;
    let earlyLeaveCount = 0;
    let overtimeHours = 0;

    filteredData.forEach(record => {
      if (record.stepIn) {
        const stepInHour = new Date(record.stepIn).getHours();
        const shift = record.shift;
        
        if (shift && shiftTimes[shift]) {
          const expectedStart = shiftTimes[shift].start;
          const expectedEnd = shiftTimes[shift].end;
          
          // Check if on time (within 30 minutes of expected start)
          if (Math.abs(stepInHour - expectedStart) <= 0.5) {
            onTimeCount++;
          } else if (stepInHour > expectedStart) {
            lateCount++;
          } else {
            onTimeCount++; // Early is also considered on time
          }

          // Check for early leave and overtime
          if (record.stepOut) {
            const stepOutHour = new Date(record.stepOut).getHours();
            const workDuration = (record.totalTime || 0) / 60; // in hours
            const expectedDuration = expectedEnd > expectedStart ? 
              expectedEnd - expectedStart : 
              (24 - expectedStart) + expectedEnd;

            if (workDuration < expectedDuration - 0.5) {
              earlyLeaveCount++;
            } else if (workDuration > expectedDuration + 0.5) {
              overtimeHours += workDuration - expectedDuration;
            }
          }
        }
      }
    });

    // Daily statistics
    const dailyStats = filteredData.reduce((acc, record) => {
      const date = new Date(record.stepIn).toDateString();
      if (!acc[date]) {
        acc[date] = { present: 0, absent: 0, total: 0 };
      }
      acc[date].total++;
      if (record.stepIn) {
        acc[date].present++;
      } else {
        acc[date].absent++;
      }
      return acc;
    }, {});

    // Top performers (employees with highest attendance rate)
    const employeeStats = filteredData.reduce((acc, record) => {
      const empId = record.employeeId?._id || record.employeeId;
      const empName = record.employeeId?.name || 'Unknown';
      
      if (!acc[empId]) {
        acc[empId] = { name: empName, present: 0, total: 0, totalHours: 0 };
      }
      acc[empId].total++;
      if (record.stepIn) {
        acc[empId].present++;
        acc[empId].totalHours += (record.totalTime || 0) / 60;
      }
      return acc;
    }, {});

    const topPerformers = Object.values(employeeStats)
      .filter(emp => emp.total >= 3) // At least 3 records
      .map(emp => ({
        ...emp,
        attendanceRate: Math.round((emp.present / emp.total) * 100),
        averageHours: Math.round((emp.totalHours / emp.present) * 10) / 10
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5);

    // Calculate rates
    const punctualityRate = totalRecords > 0 ? Math.round((onTimeCount / totalRecords) * 100) : 0;
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
    const averageWorkDuration = presentCount > 0 ? Math.round((totalMinutes / presentCount) / 60 * 10) / 10 : 0;

    // Location distribution for charts
    const locationDistribution = Object.entries(locationStats)
      .map(([location, count]) => ({
        name: location.length > 20 ? location.substring(0, 20) + '...' : location,
        value: count,
        percentage: Math.round((count / totalRecords) * 100)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Shift distribution
    const shiftDistribution = Object.entries(shiftStats)
      .map(([shift, count]) => ({
        name: shift.charAt(0).toUpperCase() + shift.slice(1),
        value: count,
        percentage: Math.round((count / totalRecords) * 100)
      }));

    // Time distribution (hourly)
    const timeDistribution = filteredData.reduce((acc, record) => {
      if (record.stepIn) {
        const hour = new Date(record.stepIn).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {});

    const timeDistributionArray = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      count: timeDistribution[hour] || 0
    }));

    return {
      totalRecords,
      presentCount,
      absentCount,
      averageHours,
      totalHours,
      onTimeCount,
      lateCount,
      earlyLeaveCount,
      shiftStats,
      locationStats,
      dailyStats,
      topPerformers,
      punctualityRate,
      attendanceRate,
      averageWorkDuration,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      locationDistribution,
      shiftDistribution,
      timeDistribution: timeDistributionArray
    };
  }, [attendanceData, timeRange, selectedShift]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="card p-4 hover:shadow-md transition-shadow">
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
              {trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : '0%'} from last period
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, children, icon: Icon }) => (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="h-5 w-5 text-blue-600" />}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input input-sm"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Shift:</span>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="input input-sm"
            >
              <option value="all">All Shifts</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Records"
          value={stats.totalRecords}
          icon={BarChart3}
          color="bg-blue-500"
          subtitle={`${stats.presentCount} present, ${stats.absentCount} absent`}
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          icon={UserCheck}
          color="bg-green-500"
          subtitle={`${stats.presentCount} out of ${stats.totalRecords}`}
        />
        <StatCard
          title="Punctuality Rate"
          value={`${stats.punctualityRate}%`}
          icon={Clock}
          color="bg-purple-500"
          subtitle={`${stats.onTimeCount} on time, ${stats.lateCount} late`}
        />
        <StatCard
          title="Average Hours"
          value={`${stats.averageWorkDuration}h`}
          icon={Timer}
          color="bg-orange-500"
          subtitle={`Total: ${stats.totalHours}h`}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="On Time"
          value={stats.onTimeCount}
          icon={CheckCircle}
          color="bg-green-500"
          subtitle={`${stats.punctualityRate}% punctuality`}
        />
        <StatCard
          title="Late Arrivals"
          value={stats.lateCount}
          icon={AlertTriangle}
          color="bg-yellow-500"
          subtitle={`${Math.round((stats.lateCount / stats.totalRecords) * 100)}% of total`}
        />
        <StatCard
          title="Early Leaves"
          value={stats.earlyLeaveCount}
          icon={XCircle}
          color="bg-red-500"
          subtitle={`${Math.round((stats.earlyLeaveCount / stats.totalRecords) * 100)}% of total`}
        />
        <StatCard
          title="Overtime Hours"
          value={`${stats.overtimeHours}h`}
          icon={Activity}
          color="bg-indigo-500"
          subtitle="Extra hours worked"
        />
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Distribution */}
        <ChartCard title="Shift Distribution" icon={PieChart}>
          <div className="space-y-3">
            {stats.shiftDistribution.map((shift, index) => (
              <div key={shift.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 'bg-purple-500'
                  }`}></div>
                  <span className="text-sm font-medium">{shift.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{shift.value}</span>
                  <span className="text-xs text-gray-500 ml-2">({shift.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Top Performers */}
        <ChartCard title="Top Performers" icon={Award}>
          <div className="space-y-3">
            {stats.topPerformers.map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{performer.name}</p>
                    <p className="text-xs text-gray-500">{performer.present}/{performer.total} days</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{performer.attendanceRate}%</p>
                  <p className="text-xs text-gray-500">{performer.averageHours}h avg</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Location Distribution */}
        <ChartCard title="Location Distribution" icon={MapPin}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.locationDistribution.map((location, index) => (
              <div key={location.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">{location.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{location.value}</span>
                  <span className="text-xs text-gray-500 ml-2">({location.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Time Distribution */}
        <ChartCard title="Clock-in Time Distribution" icon={Clock3}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.timeDistribution
              .filter(item => item.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 10)
              .map((item, index) => (
                <div key={item.hour} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock4 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{item.hour}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(item.count / Math.max(...stats.timeDistribution.map(t => t.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
          </div>
        </ChartCard>
      </div>

      {/* Insights and Alerts */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Strong Performance</p>
                <p className="text-xs text-green-600">
                  {stats.attendanceRate >= 90 ? 
                    `Excellent attendance rate of ${stats.attendanceRate}%` :
                    stats.attendanceRate >= 80 ?
                    `Good attendance rate of ${stats.attendanceRate}%` :
                    `Attendance rate of ${stats.attendanceRate}% needs improvement`
                  }
                </p>
              </div>
            </div>
            
            {stats.punctualityRate >= 80 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Good Punctuality</p>
                  <p className="text-xs text-blue-600">
                    {stats.punctualityRate}% of employees arrive on time
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {stats.lateCount > stats.totalRecords * 0.1 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Late Arrivals</p>
                  <p className="text-xs text-yellow-600">
                    {stats.lateCount} late arrivals ({Math.round((stats.lateCount / stats.totalRecords) * 100)}% of total)
                  </p>
                </div>
              </div>
            )}
            
            {stats.overtimeHours > 0 && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-800">Overtime Work</p>
                  <p className="text-xs text-purple-600">
                    {stats.overtimeHours} hours of overtime recorded
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStats;
