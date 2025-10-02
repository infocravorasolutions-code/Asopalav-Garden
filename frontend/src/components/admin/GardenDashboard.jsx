import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar,
  Leaf,
  TreePine,
  Sun,
  Droplets,
  Sparkles
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';

const GardenDashboard = () => {
  const { user, company } = useAuth();
  const { 
    companyName, 
    primaryColor, 
    secondaryColor, 
    accentColor, 
    backgroundColor, 
    textColor 
  } = useCompanyTheme();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setLoading(true);

      // Simulate API call
      setTimeout(() => {
        setDashboardData({
          totalEmployees: 45,
          activeEmployees: 42,
          onLeave: 3,
          pendingApprovals: 2,
          totalAttendance: 93,
          presentToday: 40,
          absentToday: 5,
          lateToday: 2,
          recentActivity: [
            { id: 1, type: 'step_in', employee: 'John Gardener', time: '07:00 AM', status: 'On Time', location: 'Main Garden' },
            { id: 2, type: 'step_out', employee: 'Sarah Plant', time: '05:00 PM', status: 'Completed', location: 'Greenhouse' },
            { id: 3, type: 'step_in', employee: 'Mike Tree', time: '08:15 AM', status: 'Late', location: 'Park Area' },
            { id: 4, type: 'step_in', employee: 'Lisa Flower', time: '07:30 AM', status: 'On Time', location: 'Rose Garden' },
          ],
          performanceMetrics: {
            onTimeArrival: 88,
            earlyDeparture: 3,
            overtimeHours: 25,
            gardenAreas: 12,
            plantsMaintained: 156
          },
        });
        setLoading(false);
      }, 1500);
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Loading Garden Dashboard..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center py-8 rounded-2xl"
           style={{ 
             background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}10 100%)`,
             border: `1px solid ${primaryColor}20`
           }}>
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-full mr-4"
               style={{ backgroundColor: `${primaryColor}20` }}>
            <Leaf className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>
              Welcome to {companyName}
            </h2>
            <p className="text-lg" style={{ color: textColor }}>
              Garden Management Dashboard
            </p>
          </div>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Monitor your garden team's attendance, track work progress, and manage your beautiful landscapes.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center" style={{ color: primaryColor }}>
              <Users className="h-5 w-5 mr-2" /> Garden Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold" style={{ color: primaryColor }}>
              {dashboardData?.totalEmployees}
            </p>
            <p className="text-sm text-gray-500">Active: {dashboardData?.activeEmployees}</p>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <TreePine className="w-4 h-4 mr-1" />
              Garden Specialists
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" /> Present Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">
              {dashboardData?.presentToday}
            </p>
            <p className="text-sm text-gray-500">On Time: {dashboardData?.presentToday - dashboardData?.lateToday}</p>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <Sun className="w-4 h-4 mr-1" />
              Working in Gardens
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" /> Absent Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-600">
              {dashboardData?.absentToday}
            </p>
            <p className="text-sm text-gray-500">On Leave: {dashboardData?.onLeave}</p>
            <div className="mt-2 flex items-center text-sm text-red-600">
              <Droplets className="w-4 h-4 mr-1" />
              Watering Schedule
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-600">
              <Clock className="h-5 w-5 mr-2" /> Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-yellow-600">
              {dashboardData?.pendingApprovals}
            </p>
            <p className="text-sm text-gray-500">New Requests: 1</p>
            <div className="mt-2 flex items-center text-sm text-yellow-600">
              <Sparkles className="w-4 h-4 mr-1" />
              Garden Maintenance
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Garden Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ color: primaryColor }}>
              <TrendingUp className="h-5 w-5 mr-2" /> Garden Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">On-Time Arrival</span>
                <span className="text-lg font-bold" style={{ color: primaryColor }}>
                  {dashboardData?.performanceMetrics.onTimeArrival}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${dashboardData?.performanceMetrics.onTimeArrival}%`,
                    backgroundColor: primaryColor
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Garden Areas Maintained</span>
                <span className="text-lg font-bold" style={{ color: secondaryColor }}>
                  {dashboardData?.performanceMetrics.gardenAreas}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Plants Maintained Today</span>
                <span className="text-lg font-bold" style={{ color: accentColor }}>
                  {dashboardData?.performanceMetrics.plantsMaintained}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ color: primaryColor }}>
              <Calendar className="h-5 w-5 mr-2" /> Today's Garden Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'step_in' ? 'bg-green-500' : 
                    activity.type === 'step_out' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.employee}</p>
                    <p className="text-xs text-gray-500">{activity.location} • {activity.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === 'On Time' ? 'bg-green-100 text-green-800' :
                    activity.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: primaryColor }}>
            <MapPin className="h-5 w-5 mr-2" /> Garden Management Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col hover:shadow-md transition-all duration-300"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <Users className="h-6 w-6 mb-2" />
              Manage Garden Team
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex-col hover:shadow-md transition-all duration-300"
              style={{ borderColor: secondaryColor, color: secondaryColor }}
            >
              <Calendar className="h-6 w-6 mb-2" />
              View Attendance
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex-col hover:shadow-md transition-all duration-300"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              <Clock className="h-6 w-6 mb-2" />
              Garden Reports
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex-col hover:shadow-md transition-all duration-300"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <MapPin className="h-6 w-6 mb-2" />
              Garden Locations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Garden Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: primaryColor }}>
            <Leaf className="h-5 w-5 mr-2" /> Garden Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {dashboardData?.totalAttendance || 0}%
              </p>
              <p className="text-sm text-gray-600">Overall Attendance</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                {dashboardData?.presentToday || 0}
              </p>
              <p className="text-sm text-gray-600">Present Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {dashboardData?.absentToday || 0}
              </p>
              <p className="text-sm text-gray-600">Absent Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {dashboardData?.lateToday || 0}
              </p>
              <p className="text-sm text-gray-600">Late Today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GardenDashboard;
