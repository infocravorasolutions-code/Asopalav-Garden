import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Shield,
  Users,
  User,
  Building,
  AlertCircle
} from 'lucide-react';

const IndustryLogin = () => {
  const { login, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [userType, setUserType] = useState('admin');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userTypes = [
    { value: 'admin', label: 'Admin', icon: Shield, color: 'blue' },
    { value: 'manager', label: 'Manager', icon: Users, color: 'purple' },
    { value: 'employee', label: 'Employee', icon: User, color: 'green' }
  ];

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setFormData({ email: '', password: '' });
    clearError();
  };

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        // Navigate based on user type
        if (userType === 'admin') {
          navigate('/admin/dashboard');
        } else if (userType === 'manager') {
          navigate('/manager/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const getIconComponent = () => {
    switch (userType) {
      case 'admin':
        return Shield;
      case 'manager':
        return Users;
      case 'employee':
        return User;
      default:
        return Shield;
    }
  };

  const IconComponent = getIconComponent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 left-40 w-20 h-20 bg-cyan-500/20 rounded-full blur-xl"></div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm">
          {/* Glass Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white font-poppins">
                {userType === 'admin' ? 'Admin Portal' : userType === 'manager' ? 'Manager Portal' : 'Employee Portal'}
              </h2>
            </div>

            {/* User Type Selector */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 mb-4">
              <div className="grid grid-cols-3 gap-1">
                {userTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleUserTypeChange(type.value)}
                    className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md text-xs sm:text-sm font-medium font-poppins transition-colors ${userType === type.value
                        ? (type.color === 'blue' ? 'bg-blue-600 text-white shadow-sm' :
                          type.color === 'purple' ? 'bg-purple-600 text-white shadow-sm' :
                            'bg-green-600 text-white shadow-sm')
                        : 'text-white/70 hover:text-white'
                      }`}
                  >
                    <type.icon className="h-3 w-3" />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="w-full px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base font-poppins"
                  placeholder="Email address"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="w-full px-3 py-2 pr-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base font-poppins"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-300" />
                    <span className="text-red-200 text-sm sm:text-base font-poppins">{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium text-sm sm:text-base font-poppins hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-poppins">Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-4 text-center">
              <p className="text-white/60 text-xs sm:text-sm font-poppins">
                Secure {userType} access
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndustryLogin;
