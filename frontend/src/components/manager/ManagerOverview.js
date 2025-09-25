import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Plus,
  Calendar,
  AlertCircle,
  UserCheck,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useManagerEmployee } from '../../contexts/ManagerEmployeeContext';
import { useManagerAttendance } from '../../contexts/ManagerAttendanceContext';
import toast from 'react-hot-toast';

const ManagerOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { employees, fetchMyEmployees, loading: employeesLoading } = useManagerEmployee();
  const { attendanceList, fetchAttendance, loading: attendanceLoading } = useManagerAttendance();
  
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLate: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch employees and attendance data
      await Promise.all([
        fetchMyEmployees(),
        fetchAttendance({ 
          date: new Date().toISOString().split('T')[0] 
        })
      ]);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard data error:', error);
    }
  };

  // Calculate stats when data changes
  useEffect(() => {
    // console.log('ManagerOverview - employees:', employees);
    // console.log('ManagerOverview - attendanceList:', attendanceList);
    
    // Ensure we have valid data before processing
    if (employees !== undefined && attendanceList !== undefined) {
      // Ensure employees is an array
      const employeesArray = Array.isArray(employees) ? employees : [];
      const attendanceArray = Array.isArray(attendanceList) ? attendanceList : [];
      
      // console.log('ManagerOverview - employeesArray:', employeesArray);
      // console.log('ManagerOverview - attendanceArray:', attendanceArray);
      
      const totalEmployees = employeesArray.length;
      const activeEmployees = employeesArray.filter(emp => emp.status === 'Active').length;
      const todayPresent = attendanceArray.filter(att => att.status === 'present').length;
      const todayLate = attendanceArray.filter(att => att.status === 'late').length;
      const todayAbsent = totalEmployees - todayPresent - todayLate;

      setStats({
        totalEmployees,
        activeEmployees,
        todayPresent,
        todayAbsent,
        todayLate,
      });

      // Generate recent activity from attendance data
      const recentAttendance = attendanceArray
        .filter(att => att.clockIn || att.clockOut)
        .sort((a, b) => new Date(b.clockIn || b.clockOut) - new Date(a.clockIn || a.clockOut))
        .slice(0, 5);

      const activityData = recentAttendance.map((att, index) => ({
        id: index + 1,
        type: att.clockOut ? 'clock-out' : 'clock-in',
        employee: att.employeeId?.name || 'Unknown Employee',
        time: formatTimeAgo(att.clockOut || att.clockIn),
        status: att.status === 'present' ? 'success' : att.status === 'late' ? 'warning' : 'info'
      }));

      setRecentActivity(activityData);
    } else {
      // Set default values when data is not available yet
      setStats({
        totalEmployees: 0,
        activeEmployees: 0,
        todayPresent: 0,
        todayAbsent: 0,
        todayLate: 0,
      });
      setRecentActivity([]);
    }
  }, [employees, attendanceList]);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <p className="text-2xl font-bold text-secondary-900">
            {employeesLoading || attendanceLoading ? '...' : value}
          </p>
          {subtitle && (
            <p className="text-sm text-secondary-500 mt-1">{subtitle}</p>
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

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = () => {
      switch (activity.type) {
        case 'clock-in':
          return <Clock className="h-4 w-4 text-green-600" />;
        case 'clock-out':
          return <Clock className="h-4 w-4 text-blue-600" />;
        case 'employee-added':
          return <UserCheck className="h-4 w-4 text-purple-600" />;
        default:
          return <AlertCircle className="h-4 w-4 text-secondary-600" />;
      }
    };

    const getActivityText = () => {
      switch (activity.type) {
        case 'clock-in':
          return `${activity.employee} clocked in`;
        case 'clock-out':
          return `${activity.employee} clocked out`;
        case 'employee-added':
          return `New employee ${activity.employee} added to team`;
        default:
          return activity.employee;
      }
    };

    return (
      <div className="flex items-center space-x-3 py-2">
        {getActivityIcon()}
        <div className="flex-1">
          <p className="text-sm text-secondary-700">{getActivityText()}</p>
          <p className="text-xs text-secondary-500">{activity.time}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
                     <h1 className="text-2xl font-bold text-secondary-900">
             {user?.role === 'supervisor' ? 'Supervisor Dashboard' : 'Manager Dashboard'}
           </h1>
           <p className="text-secondary-600">
             {user?.role === 'supervisor' 
               ? 'Supervise your team and track their performance.' 
               : 'Manage your team and track their performance.'
             }
           </p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Team Size"
          value={stats.totalEmployees}
          icon={Users}
          color="bg-blue-500"
          subtitle="Total employees in your team"
        />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees}
          icon={UserCheck}
          color="bg-green-500"
          subtitle="Currently active team members"
        />
        <StatCard
          title="Present Today"
          value={stats.todayPresent}
          icon={Clock}
          color="bg-green-500"
          subtitle="Employees who clocked in today"
        />
        {/* <StatCard
          title="Late Today"
          value={stats.todayLate}
          icon={AlertCircle}
          color="bg-yellow-500"
          subtitle="Employees who came late today"
        /> */}
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              title="Add Employee"
              description="Add a new employee to your team"
              icon={Plus}
              color="bg-blue-500"
              onClick={() => navigate('/manager/employees')}
            />
            {/* <QuickAction
              title="View Attendance"
              description="Check your team's attendance"
              icon={Clock}
              color="bg-green-500"
              onClick={() => navigate('/manager/attendance')}
            /> */}
            {/* <QuickAction
              title="Team Reports"
              description="Generate team performance reports"
              icon={TrendingUp}
              color="bg-purple-500"
              onClick={() => navigate('/manager/reports')}
            /> */}
            <QuickAction
              title="Manage Team"
              description="View and manage your employees"
              icon={Users}
              color="bg-orange-500"
              onClick={() => navigate('/manager/employees')}
            />
            <QuickAction
              title="Step In/Out"
              description="Clock in/out your employees"
              icon={LogIn}
              color="bg-indigo-500"
              onClick={() => navigate('/manager/step-in-out')}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Team Activity</h2>
          <div className="card">
            {employeesLoading || attendanceLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading activity...</span>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-secondary-400 mx-auto mb-3" />
                <p className="text-secondary-600">No recent activity</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-secondary-200">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all activity
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerOverview;
