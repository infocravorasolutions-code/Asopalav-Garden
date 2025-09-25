import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  Plus,
  Calendar,
  AlertCircle,
  UserCog,
  Briefcase,
  Activity,
  ArrowUpRight,
  UserPlus,
  FileText as FileTextIcon,
  CalendarClock,
  BarChart3,
  CheckCircle2,
  UserX,
  CalendarOff,
  Eye,
  BarChart,
  TrendingDown,
  Timer,
  MapPin,
  Award
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import AttendanceStats from './AttendanceStats';
import RealTimeMonitor from './RealTimeMonitor';
import AnalyticsDashboard from './AnalyticsDashboard';

// Function to get time-based greeting
const getTimeBasedGreeting = (time = new Date()) => {
  const hour = time.getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
};

// Function to get greeting emoji based on time
const getGreetingEmoji = (time = new Date()) => {
  const hour = time.getHours();
  
  if (hour >= 5 && hour < 12) {
    return "🌅"; // Sunrise for morning
  } else if (hour >= 12 && hour < 17) {
    return "☀️"; // Sun for afternoon
  } else if (hour >= 17 && hour < 21) {
    return "🌆"; // Sunset for evening
  } else {
    return "🌙"; // Moon for night
  }
};

const quickActions = [
  { title: 'Add New Employee', description: 'Create employee profile', href: '/admin/employees', icon: UserPlus, className: "bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800" },
  { title: 'Generate Report', description: 'Export attendance data', href: '/admin/reports', icon: FileTextIcon, className: "bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800" },
];

const AdminOverview = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview'); // overview, stats, realtime, analytics
  const { 
    totalEmployees, 
    totalManagers, 
    workingEmployees, 
    shiftWise, 
    isLoading, 
    error, 
    fetchDashboard 
  } = useDashboard();
  
  const { attendanceList, fetchAttendance, isLoading: attendanceLoading } = useAttendance();
  const { user } = useAuth();
  
  // Memoize the readonly check to prevent unnecessary re-renders
  const isReadonly = useCallback(() => {
    return user?.adminType === "readonly";
  }, [user]);

  useEffect(() => {
    fetchDashboard();
    fetchAttendance();
  }, []); // Only run once on component mount

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const metrics = [
    {
      icon: Users,
      label: "Total Employees",
      value: totalEmployees,
      growth: "",
      color: "text-emerald-500",
    },
    {
      icon: UserCog,
      label: "Total Supervisors",
      value: totalManagers,
      growth: "",
      color: "text-blue-500",
    },
    {
      icon: Briefcase,
      label: "Working Employees",
      value: workingEmployees,
      growth: "",
      color: "text-purple-500",
    },
    {
      icon: Activity,
      label: "Night Shift",
      value: shiftWise.night ?? 0,
      growth: "",
      color: "text-orange-500",
    },
  ];

  const chartData = [
    { status: "Morning", count: shiftWise.morning ?? 0, fill: "hsl(var(--chart-2))", icon: CheckCircle2 },
    { status: "Evening", count: shiftWise.evening ?? 0, fill: "hsl(var(--chart-3))", icon: Activity },
    { status: "Night", count: shiftWise.night ?? 0, fill: "hsl(var(--chart-4))", icon: CalendarOff },
  ];

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <p className="text-2xl font-bold text-secondary-900">{isLoading ? '...' : value}</p>
          {change && (
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, description, icon: Icon, onClick, color }) => (
    <button
      onClick={onClick}
      className="card hover:shadow-md transition-shadow duration-200 text-left"
    >
      <div className={`p-3 rounded-lg ${color} w-fit mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="font-medium text-secondary-900 mb-1">{title}</h3>
      <p className="text-sm text-secondary-600">{description}</p>
    </button>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'stats', label: 'Statistics', icon: BarChart },
    { id: 'realtime', label: 'Real-time', icon: Eye },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Admin Dashboard</h1>
          <p className="text-secondary-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card p-2">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 flex-1 md:flex-none ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Enhanced Greeting Section */}
          <div className="card bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {getTimeBasedGreeting(currentTime)}, {user?.name || 'Admin'}! {getGreetingEmoji(currentTime)}
                  </h2>
                  <p className="text-blue-100 text-lg">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
                <div className="text-blue-100 text-sm">
                  Current Time
                </div>
              </div>
            </div>
          </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : (
          metrics.map((metric, index) => (
            <div key={metric.label} className="card transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-secondary-600">{metric.label}</p>
                  <p className="text-lg md:text-2xl font-bold text-secondary-900">{metric.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-lg bg-blue-500`}>
                  <metric.icon className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chart Section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-secondary-900">Shift-wise Attendance</h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-12 text-gray-500">
            Loading chart...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chartData.map((item) => (
              <div key={item.status} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{item.status}</p>
                    <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-100">
                    <item.icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

          {/* Quick Actions Section */}
          {!isReadonly() && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickAction
                  title="Add Employee"
                  description="Create a new employee account"
                  icon={Plus}
                  color="bg-blue-500"
                  onClick={() => navigate('/admin/employees')}
                />
                <QuickAction
                  title="Add Manager"
                  description="Create a new manager account"
                  icon={UserCheck}
                  color="bg-purple-500"
                  onClick={() => navigate('/admin/managers')}
                />
                <QuickAction
                  title="View Attendance"
                  description="Check today's attendance records"
                  icon={Clock}
                  color="bg-green-500"
                  onClick={() => navigate('/admin/attendance')}
                />
                <QuickAction
                  title="Generate Reports"
                  description="Create and download reports"
                  icon={TrendingUp}
                  color="bg-orange-500"
                  onClick={() => navigate('/admin/reports')}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <AttendanceStats 
          attendanceData={attendanceList} 
          isLoading={attendanceLoading} 
        />
      )}

      {/* Real-time Monitor Tab */}
      {activeTab === 'realtime' && (
        <RealTimeMonitor />
      )}

      {/* Analytics Dashboard Tab */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboard />
      )}
    </div>
  );
};

export default AdminOverview;
