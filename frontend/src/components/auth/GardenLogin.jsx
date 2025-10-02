import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Loading from '../ui/Loading';
import CompanyLogo from '../ui/CompanyLogo';
import {
  Leaf,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  Trees,
  Sun
} from 'lucide-react';

const GardenLogin = () => {
  const { login, loading } = useAuth();
  const { companyName, primaryColor, secondaryColor, accentColor } = useCompanyTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with Garden Theme */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"
        style={{
          background: `linear-gradient(135deg, 
            ${primaryColor}15 0%, 
            ${secondaryColor}10 25%, 
            ${accentColor}08 50%, 
            ${primaryColor}12 75%, 
            ${secondaryColor}15 100%)`
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 opacity-20">
          <Trees className="w-full h-full text-green-400" />
        </div>
        <div className="absolute top-20 right-20 w-16 h-16 opacity-15">
          <Leaf className="w-full h-full text-green-500" />
        </div>
        <div className="absolute bottom-20 left-20 w-24 h-24 opacity-10">
          <Sun className="w-full h-full text-yellow-400" />
        </div>
        <div className="absolute bottom-10 right-10 w-18 h-18 opacity-20">
          <Sparkles className="w-full h-full text-green-300" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{
                backgroundColor: `${primaryColor}20`,
                border: `2px solid ${primaryColor}40`
              }}>
              <Leaf className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            {/* Company Logo Display */}
            <div className="flex justify-center mb-4">
              <CompanyLogo
                companyCode="NEELKANTH" // Default for garden theme
                size="lg"
                className="shadow-lg"
                style={{
                  minWidth: '64px',
                  minHeight: '64px',
                  maxWidth: '64px',
                  maxHeight: '64px'
                }}
              />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
              {companyName || 'Garden Attendance'}
            </h1>
            <p className="text-gray-600">
              Welcome to your garden management system
            </p>
          </div>

          {/* Login Form */}
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-semibold text-gray-800">
                Sign In to Your Account
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    error={errors.email}
                    leftIcon={<User className="w-4 h-4" />}
                    className="transition-all duration-300 focus:ring-2 focus:ring-opacity-50"
                    style={{
                      '--focus-ring-color': primaryColor
                    }}
                  />
                </div>

                {/* Password Input */}
                <div>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    error={errors.password}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    }
                    className="transition-all duration-300 focus:ring-2 focus:ring-opacity-50"
                    style={{
                      '--focus-ring-color': primaryColor
                    }}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full h-12 text-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    border: 'none',
                    boxShadow: `0 4px 15px ${primaryColor}40`
                  }}
                  rightIcon={<LogIn className="w-5 h-5" />}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 rounded-lg"
                style={{
                  backgroundColor: `${primaryColor}08`,
                  border: `1px solid ${primaryColor}20`
                }}>
                <h4 className="text-sm font-medium mb-2" style={{ color: primaryColor }}>
                  Demo Credentials
                </h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><strong>Admin:</strong> admin@greenvalleygardens.com</p>
                  <p><strong>Manager:</strong> manager@greenvalleygardens.com</p>
                  <p><strong>Password:</strong> admin123</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Garden Attendance Management System
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Professional landscaping & garden maintenance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardenLogin;
