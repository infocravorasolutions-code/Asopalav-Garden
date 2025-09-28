import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Building, 
  User,
  Shield,
  Users,
  AlertCircle, 
  ArrowRight
} from 'lucide-react';

const SimpleUnifiedLogin = () => {
  const { login, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  const [userType, setUserType] = useState('admin');
  const [formData, setFormData] = useState({
    company: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setFormData({ company: '', email: '', password: '' });
    setValidationErrors({});
    clearError();
  };

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    clearError();
  };

  const validateForm = () => {
    const errors = {};
    
    if (userType === 'admin' && !formData.company.trim()) {
      errors.company = 'Company code is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    clearError();
    
    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Redirecting to dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 left-40 w-20 h-20 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-xl"></div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 relative">
            
            {/* Header */}
            <div className="text-center mb-8 relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl mb-6">
                <IconComponent className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {userType === 'admin' ? 'Admin Access' :
                 userType === 'manager' ? 'Manager Portal' : 'Employee Login'}
              </h1>
              <p className="text-blue-200 text-lg">
                {userType === 'admin' ? 'Enterprise Dashboard' :
                 userType === 'manager' ? 'Team Management' : 'Personal Workspace'}
              </p>
            </div>
          
            {/* User Type Selector */}
            <div className="mb-8 relative z-10">
              <div className="flex bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
                {[
                  { key: 'admin', label: 'Admin', icon: Shield, color: 'blue' },
                  { key: 'manager', label: 'Manager', icon: Users, color: 'purple' },
                  { key: 'employee', label: 'Employee', icon: User, color: 'green' }
                ].map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => handleUserTypeChange(key)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl text-sm font-bold ${
                      userType === key
                        ? `bg-gradient-to-r from-${color}-500 to-${color}-600 text-white shadow-lg shadow-${color}-500/25`
                        : 'text-white/70'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${userType === key ? 'text-white' : 'text-white/70'}`} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-2xl p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                    <span className="text-red-200 text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Company Code - Only for Admin */}
              {userType === 'admin' && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-white/90 flex items-center">
                    <Building className="h-5 w-5 mr-3 text-blue-400" />
                    Company Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter your company code"
                      value={formData.company}
                      onChange={handleInputChange('company')}
                      disabled={isSubmitting}
                      className="w-full px-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                    {validationErrors.company && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.company}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-white/90 flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-green-400" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  />
                  {validationErrors.email && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-white/90 flex items-center">
                  <Lock className="h-5 w-5 mr-3 text-purple-400" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  {validationErrors.password && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-2xl disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <span className="text-lg font-semibold">Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-lg font-semibold">Sign In</span>
                    <ArrowRight className="h-6 w-6 ml-3" />
                  </div>
                )}
              </button>
            </form>

            {/* Additional Links */}
            <div className="mt-8 space-y-4 relative z-10">
              <div className="text-center">
                <a
                  href="/forgot-password"
                  className="text-sm text-blue-300 font-medium"
                >
                  Forgot your password?
                </a>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-white/60">
                  {userType === 'admin' ? 'Need help? Contact your system administrator' :
                   userType === 'manager' ? 'Need help? Contact your admin' : 'Need help? Contact your manager or HR'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleUnifiedLogin;
