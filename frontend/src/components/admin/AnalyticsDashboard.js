import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  Target, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  LineChart,
  Activity,
  Timer,
  UserCheck,
  UserX,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useDashboard } from '../../contexts/DashboardContext';

const AnalyticsDashboard = () => {
  const { attendanceList, fetchAttendance, isLoading } = useAttendance();
  const { totalEmployees, totalManagers, workingEmployees, shiftWise } = useDashboard();
  
  const [dateRange, setDateRange] = useState('month'); // week, month, quarter, year
  const [selectedMetric, setSelectedMetric] = useState('attendance'); // attendance, punctuality, hours, location
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, comparison
  const [showTrends, setShowTrends] = useState(true);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    if (!attendanceList || attendanceList.length === 0) {
      return {
        attendanceTrend: [],
        punctualityTrend: [],
        hoursTrend: [],
        locationAnalytics: [],
        shiftAnalytics: [],
        employeeAnalytics: [],
        dailyBreakdown: [],
        weeklyBreakdown: [],
        monthlyBreakdown: [],
        topPerformers: [],
        bottomPerformers: [],
        insights: [],
        kpis: {
          overallAttendanceRate: 0,
          overallPunctualityRate: 0,
          averageWorkHours: 0,
          totalWorkHours: 0,
          overtimeHours: 0,
          lateArrivals: 0,
          earlyLeaves: 0
        }
      };
    }

    const now = new Date();
    const getDateRange = (range) => {
      switch (range) {
        case 'week':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case 'quarter':
          return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case 'year':
          return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
          return new Date(0);
      }
    };

    const startDate = getDateRange(dateRange);
    const filteredData = attendanceList.filter(record => 
      new Date(record.stepIn) >= startDate
    );

    // Daily breakdown
    const dailyBreakdown = {};
    const weeklyBreakdown = {};
    const monthlyBreakdown = {};

    filteredData.forEach(record => {
      const date = new Date(record.stepIn);
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Daily
      if (!dailyBreakdown[dayKey]) {
        dailyBreakdown[dayKey] = { present: 0, absent: 0, total: 0, hours: 0, late: 0 };
      }
      dailyBreakdown[dayKey].total++;
      if (record.stepIn) {
        dailyBreakdown[dayKey].present++;
        dailyBreakdown[dayKey].hours += (record.totalTime || 0) / 60;
      } else {
        dailyBreakdown[dayKey].absent++;
      }

      // Weekly
      if (!weeklyBreakdown[weekKey]) {
        weeklyBreakdown[weekKey] = { present: 0, absent: 0, total: 0, hours: 0 };
      }
      weeklyBreakdown[weekKey].total++;
      if (record.stepIn) {
        weeklyBreakdown[weekKey].present++;
        weeklyBreakdown[weekKey].hours += (record.totalTime || 0) / 60;
      } else {
        weeklyBreakdown[weekKey].absent++;
      }

      // Monthly
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { present: 0, absent: 0, total: 0, hours: 0 };
      }
      monthlyBreakdown[monthKey].total++;
      if (record.stepIn) {
        monthlyBreakdown[monthKey].present++;
        monthlyBreakdown[monthKey].hours += (record.totalTime || 0) / 60;
      } else {
        monthlyBreakdown[monthKey].absent++;
      }
    });

    // Convert to arrays for charts
    const dailyArray = Object.entries(dailyBreakdown)
      .map(([date, data]) => ({
        date,
        attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        totalHours: Math.round(data.hours * 10) / 10,
        present: data.present,
        absent: data.absent,
        total: data.total
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const weeklyArray = Object.entries(weeklyBreakdown)
      .map(([week, data]) => ({
        week,
        attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        totalHours: Math.round(data.hours * 10) / 10,
        present: data.present,
        absent: data.absent,
        total: data.total
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    const monthlyArray = Object.entries(monthlyBreakdown)
      .map(([month, data]) => ({
        month,
        attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        totalHours: Math.round(data.hours * 10) / 10,
        present: data.present,
        absent: data.absent,
        total: data.total
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Employee analytics
    const employeeStats = {};
    filteredData.forEach(record => {
      const empId = record.employeeId?._id || record.employeeId;
      const empName = record.employeeId?.name || 'Unknown';
      
      if (!employeeStats[empId]) {
        employeeStats[empId] = {
          name: empName,
          present: 0,
          absent: 0,
          total: 0,
          totalHours: 0,
          lateCount: 0,
          earlyLeaveCount: 0,
          averageHours: 0
        };
      }
      
      employeeStats[empId].total++;
      if (record.stepIn) {
        employeeStats[empId].present++;
        employeeStats[empId].totalHours += (record.totalTime || 0) / 60;
      } else {
        employeeStats[empId].absent++;
      }
    });

    const employeeArray = Object.values(employeeStats)
      .filter(emp => emp.total >= 3)
      .map(emp => ({
        ...emp,
        attendanceRate: Math.round((emp.present / emp.total) * 100),
        averageHours: emp.present > 0 ? Math.round((emp.totalHours / emp.present) * 10) / 10 : 0
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate);

    // Location analytics
    const locationStats = {};
    filteredData.forEach(record => {
      const location = record.address || 'Unknown Location';
      if (!locationStats[location]) {
        locationStats[location] = { present: 0, absent: 0, total: 0, hours: 0 };
      }
      locationStats[location].total++;
      if (record.stepIn) {
        locationStats[location].present++;
        locationStats[location].hours += (record.totalTime || 0) / 60;
      } else {
        locationStats[location].absent++;
      }
    });

    const locationArray = Object.entries(locationStats)
      .map(([location, data]) => ({
        location: location.length > 30 ? location.substring(0, 30) + '...' : location,
        attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        totalHours: Math.round(data.hours * 10) / 10,
        present: data.present,
        absent: data.absent,
        total: data.total
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate);

    // Shift analytics
    const shiftArray = Object.entries(shiftWise || {})
      .map(([shift, count]) => ({
        shift: shift.charAt(0).toUpperCase() + shift.slice(1),
        count,
        percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0
      }));

    // Calculate KPIs
    const totalPresent = filteredData.filter(r => r.stepIn).length;
    const totalRecords = filteredData.length;
    const totalHours = filteredData.reduce((sum, r) => sum + (r.totalTime || 0), 0) / 60;
    const averageHours = totalPresent > 0 ? totalHours / totalPresent : 0;

    const kpis = {
      overallAttendanceRate: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0,
      overallPunctualityRate: 85, // Placeholder - would need more detailed calculation
      averageWorkHours: Math.round(averageHours * 10) / 10,
      totalWorkHours: Math.round(totalHours * 10) / 10,
      overtimeHours: Math.round(Math.max(0, totalHours - (totalPresent * 8)) * 10) / 10, // Assuming 8-hour shifts, rounded to 1 decimal
      lateArrivals: 0, // Placeholder
      earlyLeaves: 0 // Placeholder
    };

    // Generate insights
    const insights = [];
    
    if (kpis.overallAttendanceRate >= 90) {
      insights.push({
        type: 'positive',
        title: 'Excellent Attendance',
        message: `Attendance rate of ${kpis.overallAttendanceRate}% is outstanding`,
        icon: CheckCircle
      });
    } else if (kpis.overallAttendanceRate < 80) {
      insights.push({
        type: 'warning',
        title: 'Low Attendance',
        message: `Attendance rate of ${kpis.overallAttendanceRate}% needs improvement`,
        icon: AlertTriangle
      });
    }

    if (kpis.averageWorkHours > 8.5) {
      insights.push({
        type: 'info',
        title: 'High Work Hours',
        message: `Average work hours of ${kpis.averageWorkHours}h indicates high productivity`,
        icon: Timer
      });
    }

    return {
      attendanceTrend: dailyArray,
      punctualityTrend: dailyArray, // Simplified
      hoursTrend: dailyArray,
      locationAnalytics: locationArray,
      shiftAnalytics: shiftArray,
      employeeAnalytics: employeeArray,
      dailyBreakdown: dailyArray,
      weeklyBreakdown: weeklyArray,
      monthlyBreakdown: monthlyArray,
      topPerformers: employeeArray.slice(0, 5),
      bottomPerformers: employeeArray.slice(-5).reverse(),
      insights,
      kpis
    };
  }, [attendanceList, dateRange, totalEmployees, shiftWise]);

  const KPICard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="card p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {trend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : 
               trend < 0 ? <TrendingDown className="h-4 w-4 mr-1" /> : null}
              {trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : '0%'} vs last period
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, children, icon: Icon, actions }) => (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-6 w-6 text-blue-600" />}
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );

  const SimpleBarChart = ({ data, dataKey, labelKey, color = 'bg-blue-500' }) => {
    const maxValue = Math.max(...data.map(item => item[dataKey]));
    
    return (
      <div className="space-y-3">
        {data.slice(0, 10).map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-600 truncate">
              {item[labelKey]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
              <div 
                className={`${color} h-6 rounded-full flex items-center justify-end pr-2`}
                style={{ width: `${(item[dataKey] / maxValue) * 100}%` }}
              >
                <span className="text-xs text-white font-medium">
                  {item[dataKey]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const InsightCard = ({ insight }) => (
    <div className={`flex items-start gap-3 p-4 rounded-lg ${
      insight.type === 'positive' ? 'bg-green-50 border border-green-200' :
      insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
      'bg-blue-50 border border-blue-200'
    }`}>
      <insight.icon className={`h-5 w-5 mt-0.5 ${
        insight.type === 'positive' ? 'text-green-600' :
        insight.type === 'warning' ? 'text-yellow-600' :
        'text-blue-600'
      }`} />
      <div>
        <p className={`font-medium ${
          insight.type === 'positive' ? 'text-green-800' :
          insight.type === 'warning' ? 'text-yellow-800' :
          'text-blue-800'
        }`}>
          {insight.title}
        </p>
        <p className={`text-sm ${
          insight.type === 'positive' ? 'text-green-600' :
          insight.type === 'warning' ? 'text-yellow-600' :
          'text-blue-600'
        }`}>
          {insight.message}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into attendance patterns and trends</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="select select-sm"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="select select-sm"
              >
                <option value="attendance">Attendance</option>
                <option value="punctuality">Punctuality</option>
                <option value="hours">Work Hours</option>
                <option value="location">Location</option>
              </select>
            </div>
            
            <button
              onClick={() => fetchAttendance()}
              className="btn btn-outline btn-sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <KPICard
          title="Overall Attendance Rate"
          value={`${analytics.kpis.overallAttendanceRate}%`}
          icon={UserCheck}
          color="bg-green-500"
          subtitle={`${analytics.dailyBreakdown.reduce((sum, day) => sum + day.present, 0)} present`}
        />
        <KPICard
          title="Average Work Hours"
          value={`${analytics.kpis.averageWorkHours}h`}
          icon={Timer}
          color="bg-blue-500"
          subtitle={`${analytics.kpis.totalWorkHours}h total`}
        />
        <KPICard
          title="Punctuality Rate"
          value={`${analytics.kpis.overallPunctualityRate}%`}
          icon={Clock}
          color="bg-purple-500"
          subtitle="On-time arrivals"
        />
        {/* <KPICard
          title="Overtime Hours"
          value={`${analytics.kpis.overtimeHours.toFixed(1)}h`}
          icon={Activity}
          color="bg-orange-500"
          subtitle="Extra hours worked"
        /> */}
      </div>

      {/* Insights */}
      {analytics.insights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <ChartCard 
          title="Attendance Trend" 
          icon={LineChart}
          actions={
            <button
              onClick={() => setShowTrends(!showTrends)}
              className="btn btn-ghost btn-sm"
            >
              {showTrends ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        >
          {showTrends ? (
            <div className="space-y-3">
              {analytics.dailyBreakdown.slice(-7).map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">{day.attendanceRate}%</div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${day.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <LineChart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Trend chart hidden</p>
            </div>
          )}
        </ChartCard>

        {/* Top Performers */}
        <ChartCard title="Top Performers" icon={Award}>
          <div className="space-y-3">
            {analytics.topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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

        {/* Location Analytics */}
        <ChartCard title="Location Performance" icon={MapPin}>
          <SimpleBarChart 
            data={analytics.locationAnalytics}
            dataKey="attendanceRate"
            labelKey="location"
            color="bg-blue-500"
          />
        </ChartCard>

        {/* Shift Distribution */}
        <ChartCard title="Shift Distribution" icon={PieChart}>
          <div className="space-y-3">
            {analytics.shiftAnalytics.map((shift, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 'bg-purple-500'
                  }`}></div>
                  <span className="text-sm font-medium">{shift.shift}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{shift.count}</span>
                  <span className="text-xs text-gray-500 ml-2">({shift.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Detailed Analytics Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Employee Performance</h3>
          <button className="btn btn-outline btn-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Attendance Rate</th>
                <th>Total Days</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Avg Hours</th>
                <th>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {analytics.employeeAnalytics.slice(0, 10).map((employee, index) => (
                <tr key={index}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{employee.attendanceRate}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            employee.attendanceRate >= 90 ? 'bg-green-500' :
                            employee.attendanceRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${employee.attendanceRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.total}</td>
                  <td className="text-green-600 font-medium">{employee.present}</td>
                  <td className="text-red-600 font-medium">{employee.absent}</td>
                  <td>{employee.averageHours}h</td>
                  <td>{Math.round(employee.totalHours * 10) / 10}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
