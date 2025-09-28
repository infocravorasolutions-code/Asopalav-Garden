import React from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  BarChart3, 
  UserPlus,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';

const ManagerDashboard = () => {
  const stats = [
    {
      title: 'Team Members',
      value: '24',
      change: '+2',
      changeType: 'positive',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Present Today',
      value: '22',
      change: '+1',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Late Arrivals',
      value: '3',
      change: '-1',
      changeType: 'negative',
      icon: AlertCircle,
      color: 'orange'
    },
    {
      title: 'Team Performance',
      value: '94.2%',
      change: '+3.1%',
      changeType: 'positive',
      icon: BarChart3,
      color: 'purple'
    }
  ];

  const teamMembers = [
    { name: 'John Doe', status: 'present', time: '8:30 AM', location: 'Main Office' },
    { name: 'Jane Smith', status: 'present', time: '8:45 AM', location: 'Field Site A' },
    { name: 'Mike Johnson', status: 'late', time: '9:15 AM', location: 'Main Office' },
    { name: 'Sarah Wilson', status: 'present', time: '8:20 AM', location: 'Field Site B' },
    { name: 'Tom Brown', status: 'absent', time: '-', location: '-' },
  ];

  const quickActions = [
    {
      title: 'Add Team Member',
      description: 'Add new employee to your team',
      icon: UserPlus,
      color: 'blue',
      href: '/manager/team/add'
    },
    {
      title: 'Check Attendance',
      description: 'View team attendance status',
      icon: Clock,
      color: 'green',
      href: '/manager/attendance'
    },
    {
      title: 'Location Management',
      description: 'Manage work locations',
      icon: MapPin,
      color: 'purple',
      href: '/manager/location'
    },
    {
      title: 'Team Reports',
      description: 'Generate team performance reports',
      icon: BarChart3,
      color: 'orange',
      href: '/manager/reports'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Manage your team and track performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                  stat.color === 'orange' ? 'bg-orange-100' :
                  'bg-purple-100'
                }`}>
                  <stat.icon className={`h-6 w-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'orange' ? 'text-orange-600' :
                    'text-purple-600'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    action.color === 'blue' ? 'bg-blue-100' :
                    action.color === 'green' ? 'bg-green-100' :
                    action.color === 'purple' ? 'bg-purple-100' :
                    'bg-orange-100'
                  }`}>
                    <action.icon className={`h-6 w-6 ${
                      action.color === 'blue' ? 'text-blue-600' :
                      action.color === 'green' ? 'text-green-600' :
                      action.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Team Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Status Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      member.status === 'present' ? 'bg-green-500' :
                      member.status === 'late' ? 'bg-orange-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{member.time}</p>
                    <p className="text-xs text-gray-500 capitalize">{member.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Attendance Rate</span>
                <span className="font-semibold text-green-600">91.7%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '91.7%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">On-time Rate</span>
                <span className="font-semibold text-blue-600">87.5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87.5%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Productivity Score</span>
                <span className="font-semibold text-purple-600">94.2%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;